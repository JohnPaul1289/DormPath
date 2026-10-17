import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
const [uid, projectId] = process.argv.slice(2);
if (!uid || !projectId) {
  console.error(
    "Usage: node grant-admin.mjs FIREBASE_USER_UID FIREBASE_PROJECT_ID",
  );
  process.exit(1);
}
initializeApp({ credential: applicationDefault(), projectId });
const user = await getAuth().getUser(uid);
const profile = await getFirestore().collection("users").doc(uid).get();
if (!profile.exists || profile.data().disabled) {
  throw Error("Register an active DormPath account first.");
}
await getAuth().setCustomUserClaims(uid, { ...user.customClaims, admin: true });
console.log(
  "Admin claim assigned. Sign out and back in to refresh the account token.",
);
