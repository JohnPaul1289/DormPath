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
  ReCaptchaV3Provider,
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
    if (
      typeof self !== "undefined" &&
      (import.meta.env.DEV || env.VITE_APPCHECK_DEBUG_TOKEN)
    ) {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN =
        env.VITE_APPCHECK_DEBUG_TOKEN || true;
    }
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(env.VITE_APPCHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("[DormPath] Firebase App Check connected via reCAPTCHA Enterprise.");
    } catch {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(env.VITE_APPCHECK_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("[DormPath] Firebase App Check connected via reCAPTCHA v3.");
      } catch (err) {
        console.warn("[DormPath] App Check setup notice:", err.message);
      }
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
  if (!currentUser) throw Error("Please sign in to continue.");
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
export function watchAuth(fn) {
  if (!configured) {
    fn(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    try {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        let userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: user.displayName || user.email?.split("@")[0] || "Neighbor",
            role: "student",
            verified: false,
            disabled: false,
            createdAt: serverTimestamp(),
          });
          userSnap = await getDoc(userRef);
        }
        profile = userSnap.data();
        isAdmin = Boolean((await user.getIdTokenResult()).claims.admin);
      } else {
        profile = null;
        isAdmin = false;
      }
      fn(user);
    } catch (e) {
      profile = null;
      isAdmin = false;
      fn(user, e);
    }
  });
}
export async function login(email, password) {
  requireDB();
  return signInWithEmailAndPassword(auth, email, password);
}
export async function loginWithGoogle(preferredRole = "student") {
  requireDB();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      name: user.displayName || "Neighbor",
      role: preferredRole === "landlord" ? "landlord" : "student",
      verified: false,
      disabled: false,
      createdAt: serverTimestamp(),
    });
  }
  profile = (await getDoc(userRef)).data();
  return user;
}
export async function register({ email, password, name, role }) {
  requireDB();
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });
  await setDoc(doc(db, "users", user.uid), {
    name,
    role,
    verified: false,
    disabled: false,
    createdAt: serverTimestamp(),
  });
  await sendEmailVerification(user);
  profile = (await getDoc(doc(db, "users", user.uid))).data();
  return user;
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
export async function saveProfile(name) {
  requireUser();
  await updateDoc(doc(db, "users", currentUser.uid), { name });
  await updateProfile(currentUser, { displayName: name });
  profile = { ...profile, name };
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
  const value = {
    ...data,
    ownerId: currentUser.uid,
    ownerName: profile.name,
    status: data.status || "published",
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
    const [p, old] = await Promise.all([tx.get(propRef), tx.get(roomRef)]);
    if (!p.exists()) throw Error("Property not found.");
    const previous = old.data() || { available: 0, capacity: 0 };
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
        collection(db, "studentRequests"),
        where("status", "==", "open"),
        orderBy("createdAt", "desc"),
        limit(30),
      ),
    ),
  );
}
export async function createRequest(data) {
  requireUser();
  await addDoc(collection(db, "studentRequests"), {
    ...data,
    userId: currentUser.uid,
    name: profile.name,
    status: "open",
    createdAt: serverTimestamp(),
  });
}
export async function closeRequest(id) {
  requireUser();
  await updateDoc(doc(db, "studentRequests", id), { status: "closed" });
}
export async function startConversation(property, studentId = currentUser.uid) {
  requireUser();
  if (property.ownerId === studentId)
    throw Error("Choose a student to start a conversation.");
  const id = `${property.id}_${studentId}`;
  const ref = doc(db, "conversations", id);
  await runTransaction(db, async (tx) => {
    if (!(await tx.get(ref)).exists())
      tx.set(ref, {
        propertyId: property.id,
        studentId,
        ownerId: property.ownerId,
        participants: [studentId, property.ownerId],
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
  const [notes, favs] = await Promise.all([
    getDocs(
      query(
        collection(db, "notifications"),
        where("userId", "==", currentUser.uid),
        limit(30),
      ),
    ),
    favorites(),
  ]);
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
  return [...rows(notes), ...alerts.filter(Boolean)];
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
  if (currentUser.uid !== c.studentId)
    throw Error("Only the student can request a viewing.");
  await addDoc(collection(db, "viewingRequests"), {
    conversationId,
    studentId: c.studentId,
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
export async function uploadPhoto(file) {
  requireUser();
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw Error("Choose a JPEG, PNG or WebP photo under 10 MB.");
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width * ratio;
  canvas.height = bitmap.height * ratio;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82),
  );
  if (!blob || blob.size > 3 * 1024 * 1024)
    throw Error("Image is too large after compression.");
  const headers = {
    Authorization: `Bearer ${await currentUser.getIdToken()}`,
    "Content-Type": "image/webp",
  };
  if (appCheck) {
    try {
      const appCheckToken = await getToken(appCheck, false);
      if (appCheckToken?.token) {
        headers["X-Firebase-AppCheck"] = appCheckToken.token;
      }
    } catch {
      // Graceful fallback during setup or before App Check enforcement
    }
  }
  const res = await fetch("/.netlify/functions/upload", {
    method: "POST",
    headers,
    body: blob,
  });
  const data = await res.json();
  if (!res.ok) throw Error(data.error || "Upload failed.");
  return data.url;
}
