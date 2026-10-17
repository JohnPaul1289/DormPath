import { createHash, randomUUID } from "node:crypto";
// Upload proxy: secrets and signatures never reach the browser. Firebase REST
// checks use the caller's token, so deployed Firestore rules still apply.
export default async function handler(request) {
  const json = (body, status = 200) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (request.method !== "POST")
    return json({ error: "Method not allowed." }, 405);
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return json({ error: "Sign in before uploading." }, 401);
  const appCheckToken = request.headers.get("x-firebase-appcheck");
  const enforceAppCheck = process.env.FIREBASE_APPCHECK_ENFORCE === "true";
  if (enforceAppCheck && !appCheckToken) {
    return json({ error: "App Check verification required." }, 401);
  }
  const {
    FIREBASE_PROJECT_ID: project,
    CLOUDINARY_CLOUD_NAME: cloud,
    CLOUDINARY_API_KEY: key,
    CLOUDINARY_API_SECRET: secret,
    CLOUDINARY_UPLOAD_PRESET: preset,
  } = process.env;
  if (
    !project ||
    !cloud ||
    !key ||
    !secret ||
    !preset ||
    !process.env.FIREBASE_WEB_API_KEY
  )
    return json({ error: "Photo uploads are not configured." }, 503);
  try {
    if (request.headers.get("content-type") !== "image/webp")
      return json({ error: "Only compressed WebP images are accepted." }, 415);
    // Obtain identity from Google's token verification endpoint, never decode
    // and trust an unsigned JWT payload.
    const lookup = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(process.env.FIREBASE_WEB_API_KEY || "")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!lookup.ok)
      return json({ error: "Your session is invalid or expired." }, 401);
    const identity = (await lookup.json()).users?.[0];
    if (!identity?.localId) return json({ error: "Invalid account." }, 401);
    const uid = identity.localId;
    const profile = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!profile.ok)
      return json({ error: "Owner verification required." }, 403);
    const fields = (await profile.json()).fields;
    const isLandlord =
      fields?.role?.stringValue === "landlord" &&
      fields?.disabled?.booleanValue !== true;
    const isAdmin = fields?.role?.stringValue === "admin";
    if (!isLandlord && !isAdmin)
      return json(
        { error: "Only active property owners and administrators may upload property photos." },
        403,
      );
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Photo is missing." }, 400);
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 3 * 1024 * 1024) {
        await reader.cancel();
        return json({ error: "Photo exceeds the 3 MB compressed limit." }, 413);
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    if (
      bytes.length < 12 ||
      bytes.toString("ascii", 0, 4) !== "RIFF" ||
      bytes.toString("ascii", 8, 12) !== "WEBP"
    )
      return json({ error: "Invalid WebP image." }, 415);
    const timestamp = Math.floor(Date.now() / 1000),
      public_id = `dormpath/${uid}/${randomUUID()}`;
    const params = {
      overwrite: "false",
      public_id,
      timestamp: String(timestamp),
      upload_preset: preset,
    };
    const sign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    const signature = createHash("sha256")
      .update(sign + secret)
      .digest("hex");
    const body = new FormData();
    for (const [k, v] of Object.entries(params)) body.set(k, v);
    body.set("signature", signature);
    body.set("api_key", key);
    body.set(
      "file",
      new Blob([bytes], { type: "image/webp" }),
      "property.webp",
    );
    const upload = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`,
      { method: "POST", body, signal: AbortSignal.timeout(25000) },
    );
    if (!upload.ok)
      return json(
        {
          error:
            "Image provider rejected the upload. Check the signed preset and account quota.",
        },
        502,
      );
    const result = await upload.json();
    return json({ url: result.secure_url });
  } catch {
    return json(
      { error: "Upload could not complete. Please retry when connected." },
      502,
    );
  }
}
export const config = {
  path: "/.netlify/functions/upload",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
