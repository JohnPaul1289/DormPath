# DormPath

A mobile-first room finder for Tuguegarao City, built with vanilla JavaScript, Vite, Firebase Authentication / Firestore, Cloudinary, Leaflet and OpenStreetMap. Uses the supplied `Domi AI.png` mascot. There are no seeded listings, simulated messages, passwords, service secrets or paid AI APIs.

## Current state

The source and production build are implemented. **This is not a live, launch-verified service yet.** You said the Firebase and Cloudinary accounts have not been created. Until configured, the UI shows honest empty states and account operations report that services are unavailable.

Implemented: public discovery/search/filters/map, detail galleries and costs, email/password accounts, student and owner dashboards, verified-owner property forms and photo uploads, moderation, atomic room/vacancy management, pause/archive/delete, private messaging, message pagination, read status, unread conversation counts, blocking/reporting, favorites/comparison, room requests and private offers, viewing requests/confirmation, on-open vacancy checks, local DOMI suggestions, themes, service worker, IndexedDB public cache and opt-in private history/pending drafts.

Not included in the core launch: automated push/background vacancy notifications, a full-text search service, payments/Pro activation, downloadable browser LLM, in-app identity document collection, and self-service account erasure. See `VALIDATION.md` for test evidence and limits. Pro remains deferred until the core passes real-service acceptance testing; it must never restrict essential owner features or student access.

## Run locally

Install Node.js 22 or newer. From this directory:

```powershell
npm ci
Copy-Item .env.example .env.local
# Edit .env.local with your Firebase web app values.
npm run dev
```

Open the URL Vite prints, normally `http://127.0.0.1:5173`. Restart Vite after changing environment values. `npm run build` creates `dist`; `npm run preview` serves the production build on port 4173. Vite does not run Netlify functions. For end-to-end photo testing use `npx netlify-cli dev` after configuring environment variables, or test a Netlify deploy preview.

## 1. Firebase setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/). Start on Spark; this app does not require Firebase Cloud Functions or Firebase Storage.
2. Register a **Web app**. Copy `apiKey`, `authDomain`, `projectId`, and `appId` into the corresponding `VITE_FIREBASE_*` values in `.env.local` and Netlify's build environment. These web identifiers are public; Firestore rules provide access control.
3. In Authentication → Sign-in method, enable **Email/Password**. Configure the verification and password-reset email templates and your support address.
4. Add `localhost` and your exact Netlify/custom domain to Authentication → Settings → Authorized domains. Do not assume localhost is automatically included.
5. Create a **Cloud Firestore Standard database**, choose a suitable nearby region (for example Singapore), and start in **production/locked mode**. Never select permissive test rules for a deployed site.
6. Deploy the included rules and indexes before using the app:

```powershell
npx firebase-tools@15 login
npx firebase-tools@15 deploy --only firestore:rules,firestore:indexes --project YOUR_FIREBASE_PROJECT_ID
```

7. Wait for the composite indexes to finish building. A missing-index error is an integration error, not an empty database.
8. Configure Authentication abuse protection, password policy, email-enumeration protection and authorized domains. For a public launch, register Firebase App Check with reCAPTCHA Enterprise, set `VITE_APPCHECK_SITE_KEY`, observe valid traffic first, then enable Firestore enforcement. Verify provider quotas before enabling. Do not commit App Check debug tokens.

The rules deny unspecified access. Admin privileges use the signed Firebase Auth `admin` custom claim. `users.role` is immutable after signup; `verified` and `disabled` are administrator-controlled. A landlord cannot self-verify. Administrators do not get access to private conversations through these rules.

Sources: [Firebase rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions), [custom claims](https://firebase.google.com/docs/auth/admin/custom-claims), [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).

## 2. Bootstrap the first administrator

1. Register an ordinary account in DormPath. Obtain its UID from Firebase Authentication. Do not put an `admin` field in the profile; it has no authority.
2. Use a trusted operator workstation with Application Default Credentials for this Firebase project. Prefer `gcloud auth application-default login` with an authorized project administrator. If a service-account credential is unavoidable, keep it outside this repository and set `GOOGLE_APPLICATION_CREDENTIALS` only in your local shell. Never use a VITE variable or upload the credential to the site.
3. The administrative script is isolated from the web build:

```powershell
Push-Location scripts/admin
npm install
node grant-admin.mjs FIREBASE_USER_UID FIREBASE_PROJECT_ID
Pop-Location
```

4. Sign out and back in. The Admin console navigation now appears. Review identity and ownership evidence using your established private verification process, then verify the landlord in Users. Review and approve their listing separately.

Suspending an account blocks app reads/writes that require an active account. Also pause its published properties as part of moderation. For account compromise, revoke Auth refresh tokens / disable the Auth account using the Firebase console. Review `auditLogs`; app moderation is batched with an audit entry. Console/Admin SDK changes bypass client rules and need separate operational audit practices.

## 3. Cloudinary signed uploads

1. Create a Cloudinary account and note the **cloud name**, **API key** and **API secret**. Keep the secret server-side only.
2. Create a **signed** upload preset named `dormpath_signed`. Restrict allowed formats to WebP; set a maximum file size of 3 MB, sensible maximum image dimensions and image-only content. Disable unsigned uploads. Apply metadata stripping via the preset if desired.
3. In Netlify, set these environment variables for **Functions/runtime**:

| Variable | Value |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Same project as the frontend |
| `FIREBASE_WEB_API_KEY` | Firebase web API key used by the token lookup endpoint |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret — never a `VITE_` variable |
| `CLOUDINARY_UPLOAD_PRESET` | `dormpath_signed` |

4. Deploy the Netlify function. An active, verified owner can now upload from Add/Edit Property. The browser decodes and re-encodes images to WebP at a maximum 1,600-pixel edge. The function verifies the Firebase token with Google, reads the owner profile using the caller's token/rules, checks content type, streamed size and WebP magic bytes, generates a SHA-256 signature and uploads to Cloudinary. Neither the API secret nor upload signature reaches the browser.
5. The function has a 20-request / 60-second IP/domain rate limit. Test the deployed platform's rate limiting and confirm the account quota settings. Configure API-key restrictions to allow the server-side Identity Toolkit lookup; do not apply browser-referrer-only restrictions to a key used by this function.

The app allows eight photos per property. Removing a photo detaches it from the listing; it does not delete the Cloudinary asset. Failed form saves can leave orphan images. Periodically review the `dormpath/<uid>/` folders in Cloudinary and delete only confirmed orphans to conserve free storage.

Sources: [Cloudinary signatures](https://cloudinary.com/documentation/authentication_signatures), [Netlify function configuration](https://docs.netlify.com/build/functions/configuration/), [Netlify rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/).

## 4. Deploy to Netlify

1. Put this project in your own Git repository. Commit the lockfile, source, `netlify.toml`, Firebase rules/indexes and public assets. Do **not** commit `.env.local`, credentials, `.tools`, `node_modules`, or private screenshots/data.
2. In Netlify, import that repository. Select its root as the base directory, `npm run build` as the build command, and `dist` as the publish directory. The included configuration points functions to `netlify/functions`.
3. Set the four `VITE_FIREBASE_*` variables for **build time**, optional App Check key, and the six function variables above for **runtime**. Set Node.js to a supported 22+ version if your account's default is older.
4. Deploy. Add the resulting domain to Firebase's authorized domains and recheck email action links. Deploy the Firestore rules/indexes using the command above; Netlify does not deploy them automatically.
5. Use two ordinary accounts, one verified landlord and a separate administrator for the acceptance checks in `VALIDATION.md`. Test a deploy preview before making the launch public.
6. Replace the launch-contact note on the About page with your real support email and add your actual privacy/contact/retention policy. Establish an owner-verification and account-deletion process before collecting real users.

Do not use a static drag-and-drop `dist` upload alone: it will not provision the upload function. Deploy the repository or use Netlify CLI from the project root with `npx netlify-cli deploy --build` for a preview; publish only after verification.

No infrastructure purchase is necessary to begin. Free plans have finite quotas and may change. Monitor [Netlify plan usage](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), Firebase usage and Cloudinary usage. Avoid automatic paid top-ups. Build frequency, public reads, images and uploads all consume resources; unlimited records at the app level do not imply unlimited service capacity.

## Data and query model

| Collection | Relationships / access |
| --- | --- |
| `users/{uid}` | Private profile; self reads, name-only self updates; admin moderation |
| `users/{uid}/blocks/{otherUid}` | Private block list; checked by message rules |
| `properties/{propertyId}` | `ownerId`; published records public, pending records owner/admin only |
| `rooms/{roomId}` | `propertyId`, `ownerId`; capacity and availability; transaction updates parent totals |
| `conversations/{propertyId_studentUid}` | Immutable two-person participants; property/student/owner IDs; read timestamps |
| `conversations/{id}/messages/{stableId}` | Immutable message text and authenticated sender; server timestamp |
| `favorites/{uid_propertyId}` | Private user/property reference |
| `studentRequests/{id}` | Public open requests; requester display name, preferences and move-in date |
| `viewingRequests/{id}` | Conversation participants; student requests, owner confirms |
| `notifications/{id}` | Private recipient; administrator-created notices |
| `reports/{id}` | Reporting user and admins; moderation status |
| `subscriptions/{id}` | Read-only reserved collection; billing deferred |
| `auditLogs/{id}` | Admin-only, append-only moderation record |

Public property searches load 24 records at a time with a cursor. Filters run over **loaded** records and the UI says so; load more to broaden the search. This avoids an expensive combinatorial index set but is not city-wide full-text search. Chat loads the latest 50 messages, subscribes only to the open conversation, and offers older-history pagination. Other management views initially use bounded queries; their limits are documented in `VALIDATION.md`. There is no subscription-based record creation cap.

Room writes and aggregate changes are atomic, validated against the post-transaction room record. Owner edits return properties to pending moderation. Starting property prices/types are owner-maintained summaries: update them when changing the room mix. Server timestamps mark writes and vacancy confirmations.

## Offline behavior

Production builds precache the app shell and generated JS/CSS. Public first-page listings and their sync time go into IndexedDB. Cached availability is always marked stale. Photos, external fonts and map tiles are not guaranteed offline.

Private cache is **off by default**. Profile settings explain the shared-device risk before opt-in. Enabled devices store opened conversations and offline pending drafts. The app retries drafts when it receives an online event or the user signs in, using the original message ID and an idempotent transaction. Failed drafts remain pending; no remote-delivery success is simulated. This is foreground retry, not guaranteed background sync while the browser is closed.

Logout clears private IndexedDB data and the opt-in preference. The UI and Firestore rules still require authentication; public cached listings remain. Do not enable private caching on shared devices. Saved favorites are loaded from Firestore; full offline favorites editing is not implemented.

## Checks

```powershell
npm test
npm run build
npm audit
```

Firestore integration tests require Java 21+, Node 22+ and network access for the Firebase emulator download. They use `demo-dormpath`, never your production project:

```powershell
npm run test:rules
```

See `VALIDATION.md` for what actually ran, acceptance procedures and known limits.
