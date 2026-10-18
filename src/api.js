import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
} from "firebase/app-check";
import { validateRoom } from "./domain";
import { cached, clearPrivate, privateEnabled } from "./offline";
const env = import.meta.env;
export const configured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_AUTH_DOMAIN &&
  env.VITE_FIREBASE_APP_ID,
);
export let db, auth, appCheck = null;
if (configured) {
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  if (env.VITE_APPCHECK_SITE_KEY) {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(env.VITE_APPCHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("[DormPath] Firebase App Check connected via reCAPTCHA Enterprise.");
    } catch {
      console.warn("DormPath bot protection could not initialize.");
    }
  }
  db = getFirestore(app);
  auth = getAuth(app);
}
export let currentUser = null,
  profile = null,
  isAdmin = false;
const requireDB = () => {
  if (!configured)
    throw Error(
      "Firebase is not connected yet. Follow the setup guide to enable live accounts and listings.",
    );
};
const requireUser = () => {
  requireDB();
  if (!currentUser?.emailVerified) throw Error("Please sign in with a verified email to continue.");
};
const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
async function pagedRows(name, constraints = []) {
  const items = [];
  let cursor;
  for (;;) {
    const page = await getDocs(
      query(
        collection(db, name),
        ...constraints,
        ...(cursor ? [startAfter(cursor)] : []),
        limit(100),
      ),
    );
    items.push(...rows(page));
    if (page.size < 100) break;
    cursor = page.docs.at(-1);
  }
  return items;
}
let preferredSignupRole = "tenant";
async function ensureProfile(user) {
  const ref = doc(db, "users", user.uid);
  await runTransaction(db, async (tx) => {
    if (!(await tx.get(ref)).exists()) tx.set(ref, {
      name: (user.displayName || user.email?.split("@")[0] || "Tenant").slice(0, 80),
      role: preferredSignupRole,
      verified: false,
      disabled: false,
      createdAt: serverTimestamp(),
    });
  });
  return (await getDoc(ref)).data();
}
let userSnapshotUnsub = null;

export async function refreshProfile() {
  if (!currentUser) return null;
  try {
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    if (snap.exists()) {
      profile = { ...profile, ...snap.data() };
    }
  } catch (err) {
    console.warn("[DormPath] refreshProfile error:", err);
  }
  return profile;
}

export function watchAuth(fn) {
  if (!configured) {
    fn(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (userSnapshotUnsub) {
      userSnapshotUnsub();
      userSnapshotUnsub = null;
    }
    if (user && !user.emailVerified) {
      currentUser = null;
      profile = null;
      isAdmin = false;
      fn(null);
      return;
    }
    currentUser = user;
    try {
      if (user) {
        profile = await ensureProfile(user);
        if (auth.currentUser?.uid !== user.uid) return;
        if (profile.disabled) { await signOut(auth); throw Error("This account is suspended."); }
        isAdmin = Boolean((await user.getIdTokenResult()).claims.admin);

        // Real-time listener for profile changes (such as landlord approval)
        userSnapshotUnsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const wasVerified = profile?.verified;
            const prevRole = profile?.role;
            profile = { ...profile, ...data };
            if (data.disabled) {
              signOut(auth).catch(() => {});
            }
            if (wasVerified !== data.verified || prevRole !== data.role) {
              fn(user);
            }
          }
        }, (err) => console.warn("[DormPath] Profile listener error:", err));
      } else {
        profile = null;
        isAdmin = false;
      }
      fn(user);
    } catch (e) {
      profile = null;
      isAdmin = false;
      currentUser = null;
      fn(null, e);
    }
  });
}
export async function login(email, password, remember = false) {
  requireDB();
  if (env.VITE_APPCHECK_SITE_KEY && appCheck) {
    try {
      await getToken(appCheck);
    } catch (err) {
      console.warn("[DormPath] App Check verification skipped on this domain or browser:", err);
    }
  }
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  if (!cred.user.emailVerified) {
    const unverifiedEmail = cred.user.email;
    await signOut(auth);
    currentUser = null;
    profile = null;
    const err = new Error(
      "Your email address is not verified yet. Please check your inbox (and spam folder) for the verification link before logging in.",
    );
    err.code = "auth/unverified-email";
    err.email = unverifiedEmail;
    throw err;
  }
  profile = await ensureProfile(cred.user);
  if (profile.disabled) { await signOut(auth); throw Error("This account is suspended."); }
  currentUser = cred.user;
  isAdmin = Boolean((await cred.user.getIdTokenResult()).claims.admin);
  return cred;
}
export async function loginWithGoogle(preferredRole = "tenant", remember = false) {
  requireDB();
  preferredSignupRole = preferredRole === "landlord" ? "landlord" : "tenant";
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  profile = await ensureProfile(user);
  if (profile.disabled) { await signOut(auth); throw Error("This account is suspended."); }
  currentUser = user;
  isAdmin = Boolean((await user.getIdTokenResult()).claims.admin);
  return user;
}
export async function register({ email, password, name, role }) {
  requireDB();
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });
  const sanitizedRole = role === "landlord" ? "landlord" : "tenant";
  await setDoc(doc(db, "users", user.uid), {
    name,
    role: sanitizedRole,
    verified: false,
    disabled: false,
    createdAt: serverTimestamp(),
  });
  try {
    await sendEmailVerification(user);
  } finally {
    await signOut(auth);
  }
  currentUser = null;
  profile = null;
  return user;
}
export async function resendVerificationEmail(email, password) {
  requireDB();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  try {
    await sendEmailVerification(cred.user);
  } finally {
    await signOut(auth);
  }
  currentUser = null;
  profile = null;
  return true;
}
export async function logout() {
  await clearPrivate();
  localStorage.removeItem("dormpath-private-cache");
  if (auth) await signOut(auth);
}
export async function resetPassword(email) {
  requireDB();
  await sendPasswordResetEmail(auth, email);
}
export async function saveProfile(data) {
  requireUser();
  const payload = typeof data === "string" ? { name: data } : (data || {});
  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.photoURL !== undefined) updates.photoURL = payload.photoURL;
  if (payload.school !== undefined) updates.school = payload.school;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.bio !== undefined) updates.bio = payload.bio;

  // 1. Always update Firebase Auth profile first
  const authUpdates = {};
  if (payload.name !== undefined) authUpdates.displayName = payload.name;
  if (payload.photoURL !== undefined) authUpdates.photoURL = payload.photoURL;
  if (Object.keys(authUpdates).length > 0) {
    try {
      await updateProfile(currentUser, authUpdates);
    } catch (e) {
      console.warn("Auth update warning:", e);
    }
  }

  // 2. Sync with Firestore users collection
  if (Object.keys(updates).length > 0) {
    const userRef = doc(db, "users", currentUser.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: currentUser.displayName || updates.name || "User",
          role: profile?.role === "landlord" ? "landlord" : "tenant",
          verified: false,
          disabled: false,
          createdAt: serverTimestamp(),
          ...updates,
        });
      } else {
        await updateDoc(userRef, updates);
      }
    } catch (e) {
      console.warn("Firestore profile sync warning:", e);
      // If photoURL was updated in auth, we don't throw an unhandled error to the user
      if (!authUpdates.photoURL) throw e;
    }
  }
  profile = { ...profile, ...updates };
}
export async function changePassword(newPassword) {
  requireUser();
  if (!newPassword || newPassword.length < 8) {
    throw Error("Password must be at least 8 characters long.");
  }
  await updatePassword(currentUser, newPassword);
}
export async function sendVerification() {
  requireUser();
  await sendEmailVerification(currentUser);
}
export async function publicProperties(cursor = null) {
  requireDB();
  const constraints = [
    where("status", "==", "published"),
    orderBy("updatedAt", "desc"),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  const snap = await getDocs(
    query(collection(db, "properties"), ...constraints, limit(24)),
  );
  const items = rows(snap);
  if (!cursor) await cached("public:listings", { items, syncedAt: Date.now() });
  return { items, cursor: snap.docs.at(-1), more: snap.size === 24 };
}
export async function getProperty(id) {
  requireDB();
  if (!navigator.onLine) {
    const p = await cached(`public:property:${id}`);
    if (p) return p;
    const list = await cached("public:listings");
    const item = list?.items.find((p) => p.id === id);
    if (item) return item;
    throw Error("This property is not saved for offline access.");
  }
  const snap = await getDoc(doc(db, "properties", id));
  if (!snap.exists()) throw Error("This property is unavailable.");
  const p = { id: snap.id, ...snap.data() };
  if (p.status === "published") await cached(`public:property:${id}`, p);
  return p;
}
export async function listRooms(id, cachePublic = false) {
  requireDB();
  if (!navigator.onLine) return (await cached(`public:rooms:${id}`)) || [];
  const items = await pagedRows("rooms", [where("propertyId", "==", id)]);
  if (cachePublic) await cached(`public:rooms:${id}`, items);
  return items;
}
export async function ownProperties() {
  requireUser();
  return pagedRows("properties", [where("ownerId", "==", currentUser.uid)]);
}
export async function saveProperty(data, id) {
  requireUser();
  if (!profile) {
    try {
      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) profile = snap.data();
    } catch {}
  }
  const value = {
    ...data,
    ownerId: currentUser.uid,
    ownerName: (profile?.name || currentUser.displayName || "Property Owner").slice(0, 80),
    status: "pending",
    updatedAt: serverTimestamp(),
  };
  if (id) await updateDoc(doc(db, "properties", id), value);
  else {
    const ref = await addDoc(collection(db, "properties"), {
      ...value,
      available: 0,
      capacity: 0,
      lastRoomId: "",
      createdAt: serverTimestamp(),
      vacancyConfirmedAt: serverTimestamp(),
    });
    id = ref.id;
  }
  return id;
}
export async function getLandlordApplication(uid = currentUser?.uid) {
  requireUser();
  const snap = await getDoc(doc(db, "landlordApplications", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function submitLandlordApplication(data) {
  requireUser();
  const clean = {
    userId: currentUser.uid,
    legalName: String(data.legalName || "").trim(),
    propertyAddress: String(data.propertyAddress || "").trim(),
    proofOfOwnershipRef: String(data.proofOfOwnershipRef || "").trim(),
    businessPermitNumber: String(data.businessPermitNumber || "").trim(),
    businessPermitExpires: String(data.businessPermitExpires || "").trim(),
    barangayClearanceNumber: String(data.barangayClearanceNumber || "").trim(),
    barangayClearanceExpires: String(data.barangayClearanceExpires || "").trim(),
    fireSafetyNumber: String(data.fireSafetyNumber || "").trim(),
    fireSafetyExpires: String(data.fireSafetyExpires || "").trim(),
    mayorsPermitUrl: String(data.mayorsPermitUrl || "").trim(),
    consent: data.consent === true || data.consent === "on",
  };
  const missing = Object.entries(clean)
    .filter(([key, value]) => key !== "userId" && (value === "" || value === false))
    .map(([key]) => key);
  if (missing.length) throw Error(`Complete all permit fields and upload Mayor's Permit: ${missing.join(", ")}.`);
  for (const [label, value] of [
    ["business / mayor's permit", clean.businessPermitExpires],
    ["barangay clearance", clean.barangayClearanceExpires],
    ["fire safety certificate", clean.fireSafetyExpires],
  ]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T23:59:59`).getTime() < Date.now()) {
      throw Error(`The ${label} must have a valid, unexpired date.`);
    }
  }
  const ref = doc(db, "landlordApplications", currentUser.uid);
  const existing = await getDoc(ref);
  const base = {
    ...clean,
    status: "submitted",
    missingItems: [],
    reviewNotes: "",
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (existing.exists()) await updateDoc(ref, base);
  else await setDoc(ref, { ...base, createdAt: serverTimestamp() });
}
export async function reviewLandlordApplication(uid, status, missingItems = [], reviewNotes = "") {
  requireUser();
  if (!isAdmin) throw Error("Administrator access required.");
  if (!["approved", "changes_requested", "rejected"].includes(status)) throw Error("Invalid review status.");
  const applicationRef = doc(db, "landlordApplications", uid);
  const userRef = doc(db, "users", uid);
  const notifRef = doc(collection(db, "notifications"));
  const batch = writeBatch(db);
  batch.update(applicationRef, {
    status,
    missingItems: status === "changes_requested" ? missingItems.slice(0, 9) : [],
    reviewNotes: String(reviewNotes || "").trim().slice(0, 1000),
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const userUpdates = { verified: status === "approved" };
  if (status === "approved") {
    userUpdates.role = "landlord";
  }
  batch.update(userRef, userUpdates);
  batch.set(doc(collection(db, "auditLogs")), {
    actorId: currentUser.uid,
    collection: "landlordApplications",
    targetId: uid,
    changes: { status, missingItems: status === "changes_requested" ? missingItems.slice(0, 9) : [] },
    createdAt: serverTimestamp(),
  });

  // Create official notification for the landlord
  let notifTitle = "Permit Application Status Updated";
  let notifBody = reviewNotes || "Your permit application status has been updated.";
  if (status === "changes_requested") {
    notifTitle = "Action Required: Mayor's Permit Document Needed";
    notifBody = reviewNotes || "Please upload your official Mayor's Permit scan in your profile to complete verification.";
  } else if (status === "approved") {
    notifTitle = "Congratulations! Landlord Verification Approved";
    notifBody = "You are now a Verified Property Owner. You can publish listings and manage room vacancies.";
  } else if (status === "rejected") {
    notifTitle = "Landlord Application Declined";
    notifBody = reviewNotes || "Your permit application could not be verified.";
  }

  batch.set(notifRef, {
    userId: uid,
    title: notifTitle.slice(0, 200),
    body: notifBody.slice(0, 1000),
    status,
    missingItems: status === "changes_requested" ? missingItems.slice(0, 9) : [],
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  if (currentUser?.uid === uid) {
    profile = { ...profile, ...userUpdates };
  }
}
export async function setUserRole(uid, role) {
  requireUser();
  if (!isAdmin) throw Error("Administrator access required.");
  if (!["landlord", "tenant"].includes(role)) throw Error("Invalid role.");
  await moderate("users", uid, { role });
}
export async function submitFeedback({ type = "suggestion", title, description }) {
  requireUser();
  if (!["suggestion", "bug", "general"].includes(type)) {
    throw Error("Please specify whether this is a suggestion or bug report.");
  }
  const cleanTitle = String(title || "").trim();
  const cleanDesc = String(description || "").trim();
  if (!cleanTitle) throw Error("Please enter a summary or title.");
  if (cleanTitle.length > 120) throw Error("Title must be 120 characters or fewer.");
  if (!cleanDesc) throw Error("Please describe what needs to be fixed or added.");
  if (cleanDesc.length > 2000) throw Error("Description must be 2000 characters or fewer.");

  await addDoc(collection(db, "feedback"), {
    userId: currentUser.uid,
    userName: (profile?.name || currentUser.displayName || "User").slice(0, 80),
    userRole: profile?.role || "tenant",
    userEmail: (currentUser.email || "").slice(0, 100),
    type,
    title: cleanTitle,
    description: cleanDesc,
    status: "open",
    adminNotes: "",
    createdAt: serverTimestamp(),
  });
}
export async function getMyFeedback() {
  requireUser();
  const items = rows(
    await getDocs(
      query(
        collection(db, "feedback"),
        where("userId", "==", currentUser.uid),
        limit(50),
      ),
    ),
  );
  return items.sort((a, b) => {
    const tA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const tB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
    return tB - tA;
  });
}
export async function updateFeedbackStatus(id, status, adminNotes = "") {
  requireUser();
  if (!isAdmin) throw Error("Administrator access required.");
  if (!["open", "in_review", "planned", "resolved", "closed"].includes(status)) {
    throw Error("Invalid feedback status.");
  }
  await moderate("feedback", id, {
    status,
    adminNotes: String(adminNotes || "").trim().slice(0, 1000),
  });
}
export async function propertyStatus(id, status) {
  requireUser();
  await updateDoc(doc(db, "properties", id), {
    status,
    updatedAt: serverTimestamp(),
  });
}
export async function deleteProperty(id) {
  requireUser();
  const p = await getProperty(id);
  if (p.status !== "archived")
    throw Error("Archive this property before deleting it.");
  for (;;) {
    const snap = await getDocs(
      query(collection(db, "rooms"), where("propertyId", "==", id), limit(100)),
    );
    if (snap.empty) break;
    const batch = writeBatch(db);
    snap.docs.forEach((r) => batch.delete(r.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, "properties", id));
}
export async function adjustVacancy(propertyId, roomId, delta) {
  requireUser();
  await runTransaction(db, async (tx) => {
    const rr = doc(db, "rooms", roomId),
      pr = doc(db, "properties", propertyId);
    const [r, p] = await Promise.all([tx.get(rr), tx.get(pr)]);
    if (!r.exists() || !p.exists())
      throw Error("Room or property is unavailable.");
    const next = r.data().available + delta;
    if (next < 0 || next > r.data().capacity)
      throw Error("Availability has changed. Refresh the room inventory.");
    tx.update(rr, { available: next, updatedAt: serverTimestamp() });
    tx.update(pr, {
      available: p.data().available + delta,
      lastRoomId: roomId,
      vacancyConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
export async function saveRoom(propertyId, room, id = null) {
  requireUser();
  validateRoom(room);
  const roomRef = id ? doc(db, "rooms", id) : doc(collection(db, "rooms"));
  const propRef = doc(db, "properties", propertyId);
  await runTransaction(db, async (tx) => {
    // Only read the room when editing an existing one. Reading a document that
    // does not exist yet is denied by the rooms read rule (resource is null).
    const [p, old] = await Promise.all([
      tx.get(propRef),
      id ? tx.get(roomRef) : Promise.resolve(null),
    ]);
    if (!p.exists()) throw Error("Property not found.");
    const previous = old?.exists() ? old.data() : { available: 0, capacity: 0 };
    tx.set(roomRef, {
      ...room,
      propertyId,
      ownerId: currentUser.uid,
      updatedAt: serverTimestamp(),
    });
    tx.update(propRef, {
      available: p.data().available - previous.available + room.available,
      capacity: p.data().capacity - previous.capacity + room.capacity,
      lastRoomId: roomRef.id,
      vacancyConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
export async function favorites() {
  requireUser();
  const key = `favorites:${currentUser.uid}`;
  if (!navigator.onLine && privateEnabled()) return (await cached(key)) || [];
  const items = rows(
    await getDocs(
      query(
        collection(db, "favorites"),
        where("userId", "==", currentUser.uid),
        limit(100),
      ),
    ),
  );
  if (privateEnabled()) await cached(key, items);
  return items;
}
export async function toggleFavorite(propertyId, saved) {
  requireUser();
  const ref = doc(db, "favorites", `${currentUser.uid}_${propertyId}`);
  if (saved) await deleteDoc(ref);
  else
    await setDoc(ref, {
      userId: currentUser.uid,
      propertyId,
      createdAt: serverTimestamp(),
    });
}
export async function requests() {
  requireDB();
  return rows(
    await getDocs(
      query(
        collection(db, "tenantRequests"),
        where("status", "==", "open"),
        orderBy("createdAt", "desc"),
        limit(30),
      ),
    ),
  );
}
export async function createRequest(data) {
  requireUser();
  await addDoc(collection(db, "tenantRequests"), {
    ...data,
    userId: currentUser.uid,
    name: profile.name,
    status: "open",
    createdAt: serverTimestamp(),
  });
}
export async function closeRequest(id) {
  requireUser();
  await updateDoc(doc(db, "tenantRequests", id), { status: "closed" });
}
export async function startConversation(property, tenantId = currentUser.uid) {
  requireUser();
  if (property.ownerId === tenantId)
    throw Error("Choose a tenant to start a conversation.");
  const id = `${property.id}_${tenantId}`;
  const ref = doc(db, "conversations", id);
  await runTransaction(db, async (tx) => {
    if (!(await tx.get(ref)).exists())
      tx.set(ref, {
        propertyId: property.id,
        tenantId,
        ownerId: property.ownerId,
        participants: [tenantId, property.ownerId],
        title: property.title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: "",
        lastSender: "",
        readAt: {},
      });
  });
  return id;
}
export async function conversations() {
  requireUser();
  const key = `conversations:${currentUser.uid}`;
  if (!navigator.onLine && privateEnabled()) return (await cached(key)) || [];
  const items = rows(
    await getDocs(
      query(
        collection(db, "conversations"),
        where("participants", "array-contains", currentUser.uid),
        orderBy("updatedAt", "desc"),
        limit(30),
      ),
    ),
  );
  if (privateEnabled()) await cached(key, items);
  return items;
}
export function watchMessages(id, fn, error) {
  requireUser();
  return onSnapshot(
    query(
      collection(db, "conversations", id, "messages"),
      orderBy("createdAt", "desc"),
      limit(50),
    ),
    (snap) => {
      const data = rows(snap).reverse();
      if (privateEnabled())
        cached(`messages:${currentUser.uid}:${id}`, data).catch(() => {});
      fn(data);
    },
    error,
  );
}
export function watchConversation(id, fn, error) {
  requireUser();
  return onSnapshot(
    doc(db, "conversations", id),
    (snap) => {
      if (snap.exists()) fn({ id: snap.id, ...snap.data() });
    },
    error,
  );
}
export async function olderMessages(id, before) {
  requireUser();
  return rows(
    await getDocs(
      query(
        collection(db, "conversations", id, "messages"),
        orderBy("createdAt", "desc"),
        startAfter(before),
        limit(50),
      ),
    ),
  ).reverse();
}
export async function markRead(id) {
  requireUser();
  await updateDoc(doc(db, "conversations", id), {
    [`readAt.${currentUser.uid}`]: serverTimestamp(),
  });
}
export async function sendMessage(
  conversationId,
  text,
  id = crypto.randomUUID(),
) {
  requireUser();
  if (!text.trim() || text.length > 2000)
    throw Error("Messages must be 1–2,000 characters.");
  const conv = doc(db, "conversations", conversationId),
    message = doc(db, "conversations", conversationId, "messages", id);
  await runTransaction(db, async (tx) => {
    const existing = await tx.get(message);
    if (existing.exists()) return;
    tx.set(message, {
      senderId: currentUser.uid,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    tx.update(conv, {
      lastMessage: text.trim().slice(0, 120),
      lastSender: currentUser.uid,
      updatedAt: serverTimestamp(),
    });
  });
  return id;
}
export async function queueMessage(conversationId, text) {
  requireUser();
  if (!privateEnabled())
    throw Error(
      "Enable offline drafts in your profile to save messages on this device.",
    );
  const key = `queue:${currentUser.uid}`,
    queue = (await cached(key)) || [];
  queue.push({
    id: crypto.randomUUID(),
    conversationId,
    text,
    queuedAt: Date.now(),
  });
  await cached(key, queue);
}
export async function flushQueue() {
  if (!currentUser || !navigator.onLine) return;
  const uid = currentUser.uid,
    key = `queue:${uid}`,
    queue = (await cached(key)) || [];
  for (const item of queue) {
    if (currentUser?.uid !== uid) return;
    await sendMessage(item.conversationId, item.text, item.id);
    await cached(
      key,
      ((await cached(key)) || []).filter((x) => x.id !== item.id),
    );
  }
}
export async function notifications() {
  requireUser();
  let notes = [];
  try {
    const snap = await getDocs(
      query(
        collection(db, "notifications"),
        where("userId", "==", currentUser.uid),
        limit(30),
      ),
    );
    notes = rows(snap);
  } catch (err) {
    console.warn("Notifications collection query:", err);
  }

  let favs = [];
  try {
    favs = await favorites();
  } catch {}

  const applicationAlerts = [];
  try {
    const appSnap = await getDoc(doc(db, "landlordApplications", currentUser.uid));
    if (appSnap.exists()) {
      const app = appSnap.data();
      if (app.status === "changes_requested") {
        applicationAlerts.push({
          id: "app-status-changes",
          title: "Action Required: Mayor's Permit Document Needed",
          body: app.reviewNotes || "An administrator has requested permit document updates. Please upload your Mayor's permit scan in your profile to complete verification.",
          status: "changes_requested",
          missingItems: app.missingItems || ["Mayor's Permit Document"],
          type: "action_required",
          link: "#/profile",
          createdAt: app.reviewedAt || app.updatedAt,
        });
      } else if (app.status === "rejected") {
        applicationAlerts.push({
          id: "app-status-rejected",
          title: "Landlord Permit Application Declined",
          body: app.reviewNotes || "Your permit application details did not match.",
          status: "rejected",
          type: "danger",
          link: "#/profile",
          createdAt: app.reviewedAt || app.updatedAt,
        });
      }
    }
  } catch {}

  const alerts = await Promise.all(
    favs.slice(0, 20).map(async (f) => {
      try {
        const p = await getProperty(f.propertyId);
        return p.available > 0
          ? {
              id: p.id,
              title: `${p.title}: ${p.available} owner-reported spaces`,
              propertyId: p.id,
              createdAt: p.vacancyConfirmedAt,
            }
          : null;
      } catch {
        return null;
      }
    }),
  );

  const all = [...applicationAlerts, ...notes, ...alerts.filter(Boolean)];
  const seen = new Set();
  const unique = [];
  for (const n of all) {
    const key = `${n.id || ""}_${n.title || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(n);
    }
  }
  return unique;
}
export async function report(propertyId, reason) {
  requireUser();
  await addDoc(collection(db, "reports"), {
    propertyId,
    userId: currentUser.uid,
    reason,
    status: "open",
    createdAt: serverTimestamp(),
  });
}
export async function blockUser(blockedId) {
  requireUser();
  await setDoc(doc(db, "users", currentUser.uid, "blocks", blockedId), {
    createdAt: serverTimestamp(),
  });
}
export async function viewing(conversationId, date) {
  requireUser();
  const c = (await getDoc(doc(db, "conversations", conversationId))).data();
  if (currentUser.uid !== c.tenantId)
    throw Error("Only the tenant can request a viewing.");
  await addDoc(collection(db, "viewingRequests"), {
    conversationId,
    tenantId: c.tenantId,
    ownerId: c.ownerId,
    participants: c.participants,
    date,
    status: "requested",
    createdAt: serverTimestamp(),
  });
  await sendMessage(
    conversationId,
    `Viewing requested: ${date}. Please confirm in chat.`,
  );
}
export async function viewings(conversationId) {
  requireUser();
  if (!navigator.onLine) return [];
  return rows(
    await getDocs(
      query(
        collection(db, "viewingRequests"),
        where("conversationId", "==", conversationId),
        where("participants", "array-contains", currentUser.uid),
        limit(20),
      ),
    ),
  );
}
export async function confirmViewing(id) {
  requireUser();
  await updateDoc(doc(db, "viewingRequests", id), { status: "confirmed" });
}
export async function adminList(name) {
  requireUser();
  if (!isAdmin) throw Error("Administrator access required.");
  return rows(await getDocs(query(collection(db, name), limit(100))));
}
export async function moderate(name, id, changes) {
  requireUser();
  if (!isAdmin) throw Error("Administrator access required.");
  const batch = writeBatch(db);
  batch.update(doc(db, name, id), changes);
  batch.set(doc(collection(db, "auditLogs")), {
    actorId: currentUser.uid,
    collection: name,
    targetId: id,
    changes,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}
export async function uploadMedia(file, onProgress, scope = null) {
  requireUser();
  if (!file) throw Error("No file selected.");
  const isAudio = file.type.startsWith("audio/");
  const isVideo = file.type.startsWith("video/");
  const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  if (!isImage && !isVideo && !isAudio) {
    throw Error("Please choose an image (JPEG, PNG, WebP), video, or audio recording.");
  }
  if (isImage && file.size > 10 * 1024 * 1024) {
    throw Error("Image photo must be under 10 MB.");
  }
  if (isAudio && file.size > 20 * 1024 * 1024) {
    throw Error("Voice recording must be under 20 MB.");
  }
  if (isVideo && file.size > 40 * 1024 * 1024) {
    throw Error("Video walkthrough must be under 40 MB.");
  }

  let uploadBlob = file;
  let contentType = file.type;

  if (isImage) {
    try {
      const bitmap = await createImageBitmap(file);
      const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width * ratio;
      canvas.height = bitmap.height * ratio;
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const compressed = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.85)
      );
      if (compressed && compressed.size > 0 && compressed.size <= 5 * 1024 * 1024) {
        uploadBlob = compressed;
        contentType = "image/webp";
      }
    } catch {
      uploadBlob = file;
      contentType = file.type;
    }
  }

  const idToken = await currentUser.getIdToken();
  let appCheckToken = null;
  if (appCheck) {
    try {
      const t = await getToken(appCheck, false);
      if (t?.token) appCheckToken = t.token;
    } catch {}
  }

  // 1. Attempt signed direct Cloudinary upload (enables real progress & up to 50MB)
  try {
    const signRes = await fetch("/.netlify/functions/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
        ...(scope ? { "X-Upload-Scope": scope } : {}),
        ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
      },
      body: JSON.stringify({
        resourceType: (isVideo || isAudio) ? "video" : "image",
        scope,
      }),
    });

    if (signRes.ok) {
      const signData = await signRes.json();
      if (signData.signature && signData.apiKey && signData.cloudName) {
        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const targetUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(signData.cloudName)}/${signData.resourceType || (isVideo || isAudio ? "video" : "image")}/upload`;
          xhr.open("POST", targetUrl);

          if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                onProgress(pct);
              }
            };
          }

          xhr.onload = () => {
            try {
              const res = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300 && (res.secure_url || res.url)) {
                if (onProgress) onProgress(100);
                resolve(res.secure_url || res.url);
              } else {
                reject(new Error(res.error?.message || "Cloud upload rejected."));
              }
            } catch {
              reject(new Error("Invalid response from media server."));
            }
          };

          xhr.onerror = () => reject(new Error("Network connection error during upload."));
          xhr.ontimeout = () => reject(new Error("Upload timed out. Please retry."));
          xhr.timeout = 120000;

          const formData = new FormData();
          formData.append("file", uploadBlob);
          formData.append("api_key", signData.apiKey);
          formData.append("timestamp", String(signData.timestamp));
          formData.append("signature", signData.signature);
          formData.append("public_id", signData.publicId);
          formData.append("upload_preset", signData.uploadPreset);
          formData.append("overwrite", "false");
          xhr.send(formData);
        });
      }
    }
  } catch (err) {
    console.warn("Direct upload fallback to proxy:", err);
  }

  // 2. Fallback to Netlify function proxy streaming
  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/.netlify/functions/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${idToken}`);
    xhr.setRequestHeader("Content-Type", contentType);
    if (isVideo) xhr.setRequestHeader("X-Resource-Type", "video");
    if (isAudio) xhr.setRequestHeader("X-Resource-Type", "audio");
    if (scope) xhr.setRequestHeader("X-Upload-Scope", scope);
    if (appCheckToken) xhr.setRequestHeader("X-Firebase-AppCheck", appCheckToken);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && (res.url || res.secure_url)) {
          if (onProgress) onProgress(100);
          resolve(res.url || res.secure_url);
        } else {
          reject(new Error(res.error || "Upload failed."));
        }
      } catch {
        reject(new Error("Invalid upload response."));
      }
    };

    xhr.onerror = () => reject(new Error("Network connection error during upload."));
    xhr.send(uploadBlob);
  });
}

export async function uploadPhoto(file, onProgress) {
  return uploadMedia(file, onProgress);
}

export async function uploadChatMedia(file, onProgress) {
  return uploadMedia(file, onProgress, "chat");
}

export async function uploadPermitDocument(file, onProgress) {
  return uploadMedia(file, onProgress, "permit");
}
