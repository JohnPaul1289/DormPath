import { readFileSync } from "node:fs";
import { before, after, beforeEach, test } from "node:test";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  limit,
  serverTimestamp,
  writeBatch,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
let env;
const db = (uid) =>
  env
    .authenticatedContext(uid, uid === "admin" ? { admin: true, email_verified: true } : { email_verified: true })
    .firestore();
const profile = (role, verified = false) => ({
  name: role,
  role,
  verified,
  disabled: false,
  createdAt: Timestamp.now(),
});
const listing = () => ({
  ownerId: "owner",
  ownerName: "Owner",
  title: "Rules test property",
  barangay: "Centro",
  address: "Test address",
  school: "",
  description: "Test description",
  utilities: "Metered electricity",
  rules: "No smoking",
  minPrice: 2000,
  deposit: 2000,
  advance: 2000,
  lat: 17.6,
  lng: 121.7,
  roomTypes: ["Solo room"],
  amenities: [],
  photos: [],
  available: 1,
  capacity: 1,
  lastRoomId: "",
  status: "published",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  vacancyConfirmedAt: Timestamp.now(),
});
const landlordApplication = (uid, status = "submitted") => ({
  userId: uid,
  legalName: "Permit Applicant",
  propertyAddress: "Centro, Tuguegarao City",
  proofOfOwnershipRef: "TCT-12345",
  businessPermitNumber: "BP-12345",
  businessPermitExpires: "2027-12-31",
  barangayClearanceNumber: "BC-12345",
  barangayClearanceExpires: "2027-12-31",
  fireSafetyNumber: "FS-12345",
  fireSafetyExpires: "2027-12-31",
  consent: true,
  status,
  missingItems: [],
  reviewNotes: "",
  createdAt: Timestamp.now(),
  submittedAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-dormpath",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const d = c.firestore();
    await Promise.all([
      setDoc(doc(d, "users", "owner"), profile("landlord", true)),
      setDoc(doc(d, "users", "tenant"), profile("tenant")),
      setDoc(doc(d, "users", "stranger"), profile("tenant")),
      setDoc(doc(d, "users", "unverified"), profile("landlord")),
      setDoc(doc(d, "landlordApplications", "unverified"), landlordApplication("unverified")),
      setDoc(doc(d, "users", "admin"), profile("tenant")),
      setDoc(doc(d, "properties", "p1"), listing()),
      setDoc(doc(d, "conversations", "p1_tenant"), {
        propertyId: "p1",
        tenantId: "tenant",
        ownerId: "owner",
        participants: ["tenant", "owner"],
        title: "Rules test property",
        lastMessage: "",
        lastSender: "",
        readAt: {},
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }),
    ]);
  });
});
after(async () => env?.cleanup());
test("public can query published properties with a bounded query", async () => {
  await assertSucceeds(
    getDocs(
      query(
        collection(env.unauthenticatedContext().firestore(), "properties"),
        where("status", "==", "published"),
        limit(24),
      ),
    ),
  );
});
test("public cannot read private profiles or unbounded property collections", async () => {
  const d = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(d, "users", "owner")));
  await assertFails(getDocs(collection(d, "properties")));
});
test("users cannot self-verify, escalate role, or forge admin fields", async () => {
  await assertFails(
    updateDoc(doc(db("unverified"), "users", "unverified"), { verified: true }),
  );
  await assertFails(
    updateDoc(doc(db("tenant"), "users", "tenant"), { role: "landlord" }),
  );
  await assertFails(
    updateDoc(doc(db("tenant"), "users", "tenant"), { admin: true }),
  );
});
test("verified owners cannot publish their own listings or edit another owner", async () => {
  await assertFails(
    updateDoc(doc(db("owner"), "properties", "p1"), {
      status: "published",
      title: "Changed",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(db("stranger"), "properties", "p1"), {
      title: "Hijacked",
      status: "pending",
      updatedAt: serverTimestamp(),
    }),
  );
});
test("admin claims permit moderation, editable role fields do not", async () => {
  await assertSucceeds(
    updateDoc(doc(db("admin"), "properties", "p1"), { status: "rejected" }),
  );
  await assertFails(
    updateDoc(doc(db("owner"), "users", "unverified"), { verified: true }),
  );
});
test("unverified owners cannot create listings", async () => {
  await assertFails(
    setDoc(doc(db("unverified"), "properties", "new"), {
      ...listing(),
      ownerId: "unverified",
      available: 0,
      capacity: 0,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      vacancyConfirmedAt: serverTimestamp(),
    }),
  );
});
test("private conversation access requires participation, including for administrators", async () => {
  await assertSucceeds(
    getDoc(doc(db("tenant"), "conversations", "p1_tenant")),
  );
  await assertFails(getDoc(doc(db("stranger"), "conversations", "p1_tenant")));
  await assertFails(getDoc(doc(db("admin"), "conversations", "p1_tenant")));
});
test("participants can atomically send messages, strangers cannot spoof sender", async () => {
  const send = (uid, sender = uid) => {
    const d = db(uid),
      b = writeBatch(d);
    b.set(doc(d, "conversations", "p1_tenant", "messages", "m1"), {
      senderId: sender,
      text: "Hello",
      createdAt: serverTimestamp(),
    });
    b.update(doc(d, "conversations", "p1_tenant"), {
      lastMessage: "Hello",
      lastSender: uid,
      updatedAt: serverTimestamp(),
    });
    return b.commit();
  };
  await assertFails(send("stranger", "tenant"));
  await assertFails(send("tenant", "owner"));
  await assertSucceeds(send("tenant"));
});
test("blocking prevents further messages", async () => {
  await assertSucceeds(
    setDoc(doc(db("tenant"), "users", "tenant", "blocks", "owner"), {
      createdAt: serverTimestamp(),
    }),
  );
  const d = db("owner"),
    b = writeBatch(d);
  b.set(doc(d, "conversations", "p1_tenant", "messages", "blocked"), {
    senderId: "owner",
    text: "Hello",
    createdAt: serverTimestamp(),
  });
  b.update(doc(d, "conversations", "p1_tenant"), {
    lastMessage: "Hello",
    lastSender: "owner",
    updatedAt: serverTimestamp(),
  });
  await assertFails(b.commit());
});
test("room inventory rejects capacity overflow even from a verified owner", async () => {
  const d = db("owner"),
    b = writeBatch(d);
  b.set(doc(d, "rooms", "r1"), {
    propertyId: "p1",
    ownerId: "owner",
    name: "Room",
    type: "Solo room",
    price: 2000,
    capacity: 1,
    available: 2,
    updatedAt: serverTimestamp(),
  });
  b.update(doc(d, "properties", "p1"), {
    available: 2,
    capacity: 2,
    updatedAt: serverTimestamp(),
    vacancyConfirmedAt: serverTimestamp(),
  });
  await assertFails(b.commit());
});
test("javascript photo URLs are rejected", async () => {
  await assertFails(
    updateDoc(doc(db("owner"), "properties", "p1"), {
      photos: ["javascript:alert(1)"],
      status: "pending",
      updatedAt: serverTimestamp(),
    }),
  );
});
test("suspended accounts cannot message or change profiles", async () => {
  await env.withSecurityRulesDisabled((c) =>
    updateDoc(doc(c.firestore(), "users", "tenant"), { disabled: true }),
  );
  await assertFails(
    updateDoc(doc(db("tenant"), "users", "tenant"), { name: "Changed" }),
  );
  await assertFails(getDoc(doc(db("tenant"), "conversations", "p1_tenant")));
});
test("verified owner creates property and inventory; admin publishes; public reads rooms", async () => {
  const d = db("owner");
  await assertSucceeds(
    setDoc(doc(d, "properties", "new"), {
      ...listing(),
      status: "pending",
      available: 0,
      capacity: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      vacancyConfirmedAt: serverTimestamp(),
    }),
  );
  const b = writeBatch(d);
  b.set(doc(d, "rooms", "r1"), {
    propertyId: "new",
    ownerId: "owner",
    name: "Room 1",
    type: "Solo room",
    price: 2000,
    capacity: 1,
    available: 1,
    updatedAt: serverTimestamp(),
  });
  b.update(doc(d, "properties", "new"), {
    available: 1,
    capacity: 1,
    lastRoomId: "r1",
    updatedAt: serverTimestamp(),
    vacancyConfirmedAt: serverTimestamp(),
  });
  await assertSucceeds(b.commit());
  await assertSucceeds(
    updateDoc(doc(db("admin"), "properties", "new"), { status: "published" }),
  );
  await assertSucceeds(
    getDocs(
      query(
        collection(env.unauthenticatedContext().firestore(), "rooms"),
        where("propertyId", "==", "new"),
        limit(100),
      ),
    ),
  );
});
test("owner cannot change aggregate availability without matching room write", async () => {
  await assertFails(
    updateDoc(doc(db("owner"), "properties", "p1"), {
      available: 0,
      lastRoomId: "missing",
      updatedAt: serverTimestamp(),
      vacancyConfirmedAt: serverTimestamp(),
    }),
  );
});
test("new user registration and private favorites work without privilege fields", async () => {
  const d = db("newuser");
  await assertSucceeds(
    setDoc(doc(d, "users", "newuser"), {
      name: "New Tenant",
      role: "tenant",
      verified: false,
      disabled: false,
      createdAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    setDoc(doc(d, "favorites", "newuser_p1"), {
      userId: "newuser",
      propertyId: "p1",
      createdAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    getDocs(
      query(
        collection(d, "favorites"),
        where("userId", "==", "newuser"),
        limit(100),
      ),
    ),
  );
  await assertFails(getDoc(doc(db("stranger"), "favorites", "newuser_p1")));
});
test("conversation creation and viewing requests preserve participants", async () => {
  const d = db("stranger");
  await assertSucceeds(
    setDoc(doc(d, "conversations", "p1_stranger"), {
      propertyId: "p1",
      tenantId: "stranger",
      ownerId: "owner",
      participants: ["stranger", "owner"],
      title: "Rules test property",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
      lastSender: "",
      readAt: {},
    }),
  );
  await assertSucceeds(
    setDoc(doc(d, "viewingRequests", "v1"), {
      conversationId: "p1_stranger",
      tenantId: "stranger",
      ownerId: "owner",
      participants: ["stranger", "owner"],
      date: "2026-12-01T10:00:00.000Z",
      status: "requested",
      createdAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(db("owner"), "viewingRequests", "v1"), {
      status: "confirmed",
    }),
  );
  await assertFails(getDoc(doc(db("tenant"), "viewingRequests", "v1")));
});
test("offline retry with stable ID delivers only once", async () => {
  const d = db("tenant");
  const send = () =>
    runTransaction(d, async (tx) => {
      const ref = doc(
        d,
        "conversations",
        "p1_tenant",
        "messages",
        "stable-id",
      );
      if ((await tx.get(ref)).exists()) return;
      tx.set(ref, {
        senderId: "tenant",
        text: "One message",
        createdAt: serverTimestamp(),
      });
      tx.update(doc(d, "conversations", "p1_tenant"), {
        lastMessage: "One message",
        lastSender: "tenant",
        updatedAt: serverTimestamp(),
      });
    });
  await assertSucceeds(send());
  await assertSucceeds(send());
  const messages = await getDocs(
    query(collection(d, "conversations", "p1_tenant", "messages"), limit(50)),
  );
  if (messages.size !== 1) throw Error("Duplicate delivery");
});

test("unverified email cannot access tenant actions even with an existing profile", async () => {
  const unverifiedEmail = env.authenticatedContext("tenant", { email_verified: false }).firestore();
  await assertFails(setDoc(doc(unverifiedEmail, "favorites", "tenant_p1"), {
    userId: "tenant", propertyId: "p1", createdAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(doc(unverifiedEmail, "users", "tenant"), { name: "Changed" }));
});
test("signup cannot self-assign owner verification", async () => {
  await assertFails(setDoc(doc(db("newowner"), "users", "newowner"), {
    ...profile("landlord", true), createdAt: serverTimestamp(),
  }));
});

test("landlord approval requires an admin-reviewed application and atomic profile update", async () => {
  await assertFails(updateDoc(doc(db("admin"), "users", "unverified"), {
    role: "landlord", verified: true,
  }));
  const d = db("admin"), batch = writeBatch(d);
  batch.update(doc(d, "landlordApplications", "unverified"), {
    status: "approved",
    missingItems: [],
    reviewNotes: "Permits reviewed.",
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(d, "users", "unverified"), { role: "landlord", verified: true });
  await assertSucceeds(batch.commit());
});

test("tenant cannot approve a landlord application", async () => {
  await assertFails(updateDoc(doc(db("tenant"), "landlordApplications", "unverified"), {
    status: "approved",
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
});

const clientSave = (extra = {}) => {
  const { available, capacity, lastRoomId, status, createdAt, updatedAt, vacancyConfirmedAt, ...form } = listing();
  return { ...form, video: "", ...extra, ownerId: "owner", status: "pending", updatedAt: serverTimestamp() };
};
const newListing = (extra) => ({
  ...clientSave(extra),
  available: 0,
  capacity: 0,
  lastRoomId: "",
  createdAt: serverTimestamp(),
  vacancyConfirmedAt: serverTimestamp(),
});
const photo = (i) => `https://res.cloudinary.com/demo/image/upload/v1/dormpath/p${i}.webp`;

test("verified landlord can save a new listing exactly as the client sends it", async () => {
  await assertSucceeds(setDoc(doc(db("owner"), "properties", "new1"), newListing()));
  await assertSucceeds(setDoc(doc(db("owner"), "properties", "new2"), newListing({
    video: "https://res.cloudinary.com/demo/video/upload/v1/dormpath/tour.mp4",
    photos: [photo(1), photo(2)],
  })));
});

test("listing save rejects external videos and more than 8 photos", async () => {
  await assertFails(setDoc(doc(db("owner"), "properties", "bad1"), newListing({ video: "https://example.com/tour.mp4" })));
  await assertFails(setDoc(doc(db("owner"), "properties", "bad2"), newListing({
    photos: Array.from({ length: 9 }, (_, i) => photo(i)),
  })));
});

test("unverified landlord cannot save a listing", async () => {
  await assertFails(setDoc(doc(db("unverified"), "properties", "new3"), { ...newListing(), ownerId: "unverified" }));
});

test("owner edit resubmits the listing for moderation", async () => {
  await assertSucceeds(updateDoc(doc(db("owner"), "properties", "p1"), clientSave({ description: "Updated description" })));
  await assertFails(updateDoc(doc(db("owner"), "properties", "p1"), { ...clientSave(), status: "published" }));
});
