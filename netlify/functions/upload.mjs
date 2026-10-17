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
    return json({ error: "Photo and video uploads are not configured." }, 503);
  try {
    const rawContentType = (request.headers.get("content-type") || "").toLowerCase();
    const isJson = rawContentType.includes("application/json");
    const isVideo = rawContentType.startsWith("video/") || request.headers.get("x-resource-type") === "video";
    const isImage = rawContentType.startsWith("image/") || rawContentType === "image/webp";

    if (!isJson && !isImage && !isVideo) {
      return json({ error: "Only images (JPEG, PNG, WebP) or videos (MP4, WebM) are accepted." }, 415);
    }

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
    if (!identity.emailVerified) return json({ error: "Verify your email before uploading." }, 403);
    const uid = identity.localId;

    // Check account disabled status
    const profile = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,
      {
        headers: { Authorization: `Bearer ${token}`, ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}) },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!profile.ok) return json({ error: "Account profile could not be verified." }, 403);
    const fields = (await profile.json()).fields;
    const isDisabled = fields?.disabled?.booleanValue === true;
    const role = fields?.role?.stringValue;
    const isLandlord = role === "landlord";
    const isVerifiedLandlord = isLandlord && fields?.verified?.booleanValue === true;
    if (isDisabled)
      return json(
        { error: "Suspended accounts cannot upload media." },
        403,
      );
    if (!isLandlord) return json({ error: "Admin-approved landlords only can upload property media." }, 403);
    if (isVideo && !isVerifiedLandlord) return json({ error: "Only verified landlords can upload walkthrough videos." }, 403);

    const timestamp = Math.floor(Date.now() / 1000);
    const public_id = `dormpath/${uid}/${randomUUID()}`;

    // If client requested signature generation for direct progress upload:
    if (isJson) {
      const reqJson = await request.json().catch(() => ({}));
      const resourceType = reqJson.resourceType === "video" ? "video" : "image";
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
      return json({
        signature,
        timestamp,
        apiKey: key,
        cloudName: cloud,
        uploadPreset: preset,
        publicId: public_id,
        resourceType,
      });
    }

    // Binary upload streaming
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Media file is missing." }, 400);
    const chunks = [];
    let size = 0;
    const maxBytes = isVideo ? 40 * 1024 * 1024 : 10 * 1024 * 1024;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return json({ error: `File exceeds the ${isVideo ? "40 MB" : "10 MB"} limit.` }, 413);
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    if (bytes.length < 12) {
      return json({ error: "Invalid media file content." }, 415);
    }

    const resourceType = isVideo ? "video" : "image";
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
    const mimeType = isVideo ? (rawContentType.startsWith("video/") ? rawContentType : "video/mp4") : (rawContentType.startsWith("image/") ? rawContentType : "image/webp");
    const filename = isVideo ? "property_video.mp4" : "property_photo.webp";
    body.set(
      "file",
      new Blob([bytes], { type: mimeType }),
      filename,
    );
    const upload = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/${resourceType}/upload`,
      { method: "POST", body, signal: AbortSignal.timeout(45000) },
    );
    if (!upload.ok) {
      const errRes = await upload.json().catch(() => ({}));
      return json(
        {
          error:
            errRes?.error?.message || "Media provider rejected upload. Check signed preset and account quota.",
        },
        502,
      );
    }
    const result = await upload.json();
    return json({ url: result.secure_url || result.url });
  } catch (err) {
    return json(
      { error: err.message || "Upload could not complete. Please retry when connected." },
      502,
    );
  }
}
export const config = {
  path: "/.netlify/functions/upload",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
