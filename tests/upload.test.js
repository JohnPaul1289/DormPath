import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/upload.mjs";
const requiredEnv = {
  FIREBASE_PROJECT_ID: "dormpath",
  FIREBASE_WEB_API_KEY: "public-web-key",
  CLOUDINARY_CLOUD_NAME: "cloud",
  CLOUDINARY_API_KEY: "key",
  CLOUDINARY_API_SECRET: "secret",
  CLOUDINARY_UPLOAD_PRESET: "signed",
};
async function withUploadEnv(fetchImpl, fn) {
  const oldFetch = globalThis.fetch;
  const previous = Object.fromEntries(Object.keys(requiredEnv).map((key) => [key, process.env[key]]));
  Object.assign(process.env, requiredEnv);
  globalThis.fetch = fetchImpl;
  try { await fn(); }
  finally {
    globalThis.fetch = oldFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}
test("upload rejects anonymous requests", async () => {
  const r = await handler(
    new Request("https://example.test/.netlify/functions/upload", {
      method: "POST",
      body: "x",
    }),
  );
  assert.equal(r.status, 401);
});
test("upload rejects unsupported request methods", async () => {
  const r = await handler(
    new Request("https://example.test/.netlify/functions/upload"),
  );
  assert.equal(r.status, 405);
});
test("upload fails closed when service secrets are absent", async () => {
  const r = await handler(
    new Request("https://example.test/.netlify/functions/upload", {
      method: "POST",
      headers: { Authorization: "Bearer invalid" },
      body: "x",
    }),
  );
  assert.equal(r.status, 503);
});
test("upload rejects missing App Check when enforcement is enabled", async () => {
  const orig = process.env.FIREBASE_APPCHECK_ENFORCE;
  try {
    process.env.FIREBASE_APPCHECK_ENFORCE = "true";
    const r = await handler(
      new Request("https://example.test/.netlify/functions/upload", {
        method: "POST",
        headers: { Authorization: "Bearer token-123" },
        body: "x",
      }),
    );
    assert.equal(r.status, 401);
    const body = await r.json();
    assert.match(body.error, /App Check verification required/);
  } finally {
    if (orig !== undefined) {
      process.env.FIREBASE_APPCHECK_ENFORCE = orig;
    } else {
      delete process.env.FIREBASE_APPCHECK_ENFORCE;
    }
  }
});

test("upload fails closed when the Firestore profile cannot be verified", async () => {
  await withUploadEnv(async (url) => {
    if (String(url).includes("accounts:lookup")) return Response.json({ users: [{ localId: "u1", emailVerified: true }] });
    return new Response("denied", { status: 403 });
  }, async () => {
    const r = await handler(new Request("https://example.test/.netlify/functions/upload", {
      method: "POST",
      headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "image" }),
    }));
    assert.equal(r.status, 403);
    assert.match((await r.json()).error, /profile could not be verified/i);
  });
});

test("upload rejects tenants even when their email is verified", async () => {
  await withUploadEnv(async (url) => {
    if (String(url).includes("accounts:lookup")) return Response.json({ users: [{ localId: "u1", emailVerified: true }] });
    return Response.json({ fields: { role: { stringValue: "tenant" }, verified: { booleanValue: false }, disabled: { booleanValue: false } } });
  }, async () => {
    const r = await handler(new Request("https://example.test/.netlify/functions/upload", {
      method: "POST",
      headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "image" }),
    }));
    assert.equal(r.status, 403);
    assert.match((await r.json()).error, /approved landlords only/i);
  });
});

test("upload allows tenants to upload profile avatars with avatar scope", async () => {
  await withUploadEnv(async (url) => {
    if (String(url).includes("accounts:lookup")) return Response.json({ users: [{ localId: "u1", emailVerified: true }] });
    return Response.json({ fields: { role: { stringValue: "tenant" }, verified: { booleanValue: false }, disabled: { booleanValue: false } } });
  }, async () => {
    const r = await handler(new Request("https://example.test/.netlify/functions/upload", {
      method: "POST",
      headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "image", scope: "avatar" }),
    }));
    assert.equal(r.status, 200);
    const data = await r.json();
    assert.ok(data.signature);
    assert.equal(data.resourceType, "image");
  });
});

