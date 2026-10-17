import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/upload.mjs";
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

