import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleAuth, Impersonated } from "google-auth-library";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Read environment variables from .env.local if present
const envConfig = {};
try {
  const envPath = path.resolve(__dirname, "../../.env.local");
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        envConfig[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
      }
    });
  }
} catch {}

// 2. Parse command line arguments and flags
const args = process.argv.slice(2);
let targetUser = null;
let targetServiceAccount =
  process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL ||
  process.env.SERVICE_ACCOUNT_EMAIL ||
  process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT ||
  envConfig.FIREBASE_SERVICE_ACCOUNT_EMAIL ||
  envConfig.SERVICE_ACCOUNT_EMAIL ||
  null;

let projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  envConfig.FIREBASE_PROJECT_ID ||
  envConfig.VITE_FIREBASE_PROJECT_ID ||
  "dormpath";

for (const arg of args) {
  if (arg.startsWith("--impersonate=")) {
    targetServiceAccount = arg.split("=")[1].trim();
  } else if (arg.startsWith("--project=")) {
    projectId = arg.split("=")[1].trim();
  } else if (!arg.startsWith("--") && !targetUser) {
    targetUser = arg.trim();
  }
}

if (!targetUser) {
  console.log(`
================================================================================
DormPath - Administrator Bootstrap CLI
================================================================================
Usage:
  node scripts/admin/grant-admin.mjs <user-email-or-uid> [options]

Options:
  --impersonate=<email>  Keyless Service Account Impersonation email
                         (e.g. firebase-adminsdk-xxxxx@${projectId}.iam.gserviceaccount.com)
  --project=<projectId>  Google Cloud / Firebase Project ID (default: ${projectId})

Examples:
  # With Keyless Service Account Impersonation (Zero private keys required):
  npm run make-admin your-email@gmail.com -- --impersonate=firebase-adminsdk-xxx@${projectId}.iam.gserviceaccount.com

  # With Application Default Credentials (ADC):
  npm run make-admin your-email@gmail.com
================================================================================
`);
  process.exit(1);
}

// 3. Resolve Credential Strategy (Keyless Impersonation / ADC / Key fallback)
async function resolveCredential() {
  // Strategy A: Check for existing local key file (legacy fallback)
  const candidateKeys = [
    path.resolve(__dirname, "service-account.json"),
    path.resolve(__dirname, "serviceAccountKey.json"),
    path.resolve(__dirname, "../../service-account.json"),
  ];
  const foundKey = candidateKeys.find((p) => fs.existsSync(p));
  if (foundKey) {
    console.log(`[Auth] Using existing service account key: ${path.basename(foundKey)}`);
    const key = JSON.parse(fs.readFileSync(foundKey, "utf8"));
    return cert(key);
  }

  // Strategy B: Explicit Service Account Impersonation via ADC (Zero Keys Required)
  if (targetServiceAccount) {
    console.log(`[Auth] Using Keyless Service Account Impersonation via Google Cloud ADC...`);
    console.log(`[Auth] Target Service Account: ${targetServiceAccount}`);

    const googleAuth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const sourceClient = await googleAuth.getClient();

    const impersonated = new Impersonated({
      sourceClient,
      targetPrincipal: targetServiceAccount,
      lifetime: 3600,
      delegates: [],
      targetScopes: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/firebase",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    return {
      getAccessToken: async () => {
        const res = await impersonated.getAccessToken();
        return {
          access_token: res.token,
          expires_in: 3600,
        };
      },
    };
  }

  // Strategy C: Standard Application Default Credentials (ADC)
  console.log(`[Auth] Attempting standard Application Default Credentials (ADC)...`);
  return applicationDefault();
}

async function main() {
  console.log(`Connecting to Firebase Project: "${projectId}"`);

  let credential;
  try {
    credential = await resolveCredential();
  } catch (err) {
    console.error("\n[Auth Error] Could not initialize credentials:", err.message);
    printDiagnostics(err);
    process.exit(1);
  }

  const app = initializeApp({ credential, projectId }, `admin-bootstrap-${Date.now()}`);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  try {
    let user;
    if (targetUser.includes("@")) {
      console.log(`Looking up Firebase user by email: ${targetUser}...`);
      user = await auth.getUserByEmail(targetUser);
    } else {
      console.log(`Looking up Firebase user by UID: ${targetUser}...`);
      user = await auth.getUser(targetUser);
    }

    console.log(`Found user: ${user.email || user.uid} (UID: ${user.uid})`);

    // Ensure user profile document exists in Firestore
    const userRef = firestore.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      console.log("Creating user profile document in Firestore...");
      await userRef.set({
        name: user.displayName || user.email?.split("@")[0] || "Administrator",
        role: "landlord",
        verified: true,
        disabled: false,
        createdAt: new Date(),
      });
    } else {
      console.log("Updating user profile verification and active status in Firestore...");
      await userRef.update({
        disabled: false,
        verified: true,
      });
    }

    // Set admin custom claim
    console.log("Setting Firebase Authentication Custom Claim { admin: true }...");
    await auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      admin: true,
    });

    console.log(`
========================================================================
SUCCESS: Administrator privileges successfully granted!
UID:   ${user.uid}
Email: ${user.email || "N/A"}
Role:  Administrator (custom claim { admin: true })
========================================================================
Next step: Sign out and sign back in on DormPath (http://127.0.0.1:5173).
Your new token will carry the "admin: true" claim and the "Admin Console"
link will appear in your workspace sidebar!
`);
  } catch (err) {
    console.error("\n[Operation Error]:", err.message);
    printDiagnostics(err);
    process.exit(1);
  }
}

function printDiagnostics(err) {
  const msg = err.message || "";
  console.log(`
--------------------------------------------------------------------------------
KEYLESS AUTHENTICATION SETUP GUIDE (Org Policy Friendly)
--------------------------------------------------------------------------------
Your organization enforces 'constraints/iam.disableServiceAccountKeyCreation',
which prevents downloading private JSON key files.

DormPath supports KEYLESS Service Account Impersonation via Google Cloud ADC:

Step 1: Install Google Cloud CLI (if not already installed)
  https://cloud.google.com/sdk/docs/install

Step 2: Log in with Application Default Credentials (ADC):
  gcloud auth application-default login

Step 3: Grant your user permission to impersonate the service account:
  gcloud iam service-accounts add-iam-policy-binding \\
    firebase-adminsdk-xxxxx@${projectId}.iam.gserviceaccount.com \\
    --member="user:your-email@gmail.com" \\
    --role="roles/iam.serviceAccountTokenCreator" \\
    --project=${projectId}

  (Find your service account email in Google Cloud Console -> IAM & Admin -> Service Accounts)

Step 4: Run the script using keyless impersonation:
  npm run make-admin ${targetUser || "your-email@gmail.com"} -- --impersonate=firebase-adminsdk-xxxxx@${projectId}.iam.gserviceaccount.com

--------------------------------------------------------------------------------
`);
}

main();
