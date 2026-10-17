import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Resolve Project ID
let projectId = process.argv[3] || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) {
  try {
    const envFile = fs.readFileSync(path.resolve(__dirname, "../../.env.local"), "utf8");
    const m = envFile.match(/VITE_FIREBASE_PROJECT_ID=([^\r\n]+)/);
    if (m) projectId = m[1].trim();
  } catch {}
}
if (!projectId) projectId = "dormpath";

const targetUser = process.argv[2];
if (!targetUser) {
  console.log(`
Usage:
  node scripts/admin/grant-admin.mjs <user-email-or-uid> [projectId]

Example:
  node scripts/admin/grant-admin.mjs your-email@gmail.com
  `);
  process.exit(1);
}

// 2. Initialize Firebase Admin SDK
let credential;
const candidateKeys = [
  path.resolve(__dirname, "service-account.json"),
  path.resolve(__dirname, "serviceAccountKey.json"),
  path.resolve(__dirname, "../../service-account.json"),
];
const foundKey = candidateKeys.find((p) => fs.existsSync(p));

if (foundKey) {
  console.log(`Using service account key: ${foundKey}`);
  const key = JSON.parse(fs.readFileSync(foundKey, "utf8"));
  credential = cert(key);
} else {
  console.log("No service-account.json found; falling back to applicationDefault().");
  credential = applicationDefault();
}

initializeApp({ credential, projectId });

const auth = getAuth();
const firestore = getFirestore();

try {
  let user;
  if (targetUser.includes("@")) {
    console.log(`Looking up user by email: ${targetUser}...`);
    user = await auth.getUserByEmail(targetUser);
  } else {
    console.log(`Looking up user by UID: ${targetUser}...`);
    user = await auth.getUser(targetUser);
  }

  console.log(`Found user: ${user.email || user.uid} (UID: ${user.uid})`);

  // Ensure user profile document exists in Firestore
  const userRef = firestore.collection("users").doc(user.uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    console.log("Creating user profile document in Firestore...");
    await userRef.set({
      name: user.displayName || user.email?.split("@")[0] || "Admin",
      role: "landlord",
      verified: true,
      disabled: false,
      createdAt: new Date(),
    });
  } else {
    // Ensure active and verified
    await userRef.update({
      disabled: false,
      verified: true,
    });
  }

  // Set admin custom claim
  await auth.setCustomUserClaims(user.uid, {
    ...user.customClaims,
    admin: true,
  });

  console.log(`
========================================================================
SUCCESS: Admin privileges successfully granted!
UID:   ${user.uid}
Email: ${user.email || "N/A"}
Role:  Administrator (admin: true)
========================================================================
Next step: Sign out and sign back in on DormPath to refresh your token.
The "Admin Console" link will now appear in your workspace sidebar!
`);
} catch (err) {
  console.error("Error granting admin privileges:", err.message);
  if (err.message.includes("Could not load the default credentials")) {
    console.error(`
To authenticate the Admin SDK:
1. Go to Firebase Console -> Project Settings -> Service accounts
2. Click "Generate new private key"
3. Save the downloaded JSON file as:
   scripts/admin/service-account.json
4. Run this script again!
`);
  }
  process.exit(1);
}
