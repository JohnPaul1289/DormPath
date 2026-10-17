# Validation and launch handoff

Checked on 17 October 2026 (Asia/Manila).

## Results

| Check | Result |
| --- | --- |
| Production Vite build | Passed; Firebase auth, Firestore, core, icons and map split into separate chunks |
| Domain, UI-helper and upload-boundary tests | 19 passed |
| Firestore emulator integration / abuse tests | 21 passed against isolated Standard-edition `demo-dormpath` |
| npm dependency audit | 0 reported vulnerabilities after removing the app-local Firebase CLI and pinning a patched gRPC transitive dependency |
| Secrets | No service credentials supplied or embedded; `.env.example` contains empty values |
| Visual / browser interaction check | Not completed: the in-app browser timed out on the local preview; Chrome was unavailable |
| Real Firebase Auth and email flows | Not run live: existing local configuration points to dormpath; no replacement project created |
| Real Cloudinary photo upload | Not run live: provider credentials and deployed uploads were not verified |
| Netlify deployment, function runtime / rate limit | Not run live: hosting configuration and enforcement were not verified |
| Real multi-device chat and offline browser reconnection | Not run; stable-ID retry and conversation permission logic passed emulator tests |

The Firestore suite covers bounded public queries, private profile access, self-verification/role escalation, atomic permit approval, tenant rejection of admin actions, cross-owner writes, administrative moderation, unverified-owner rejection, message privacy (including admin non-access), sender spoofing, blocking, invalid occupancy, unsafe photo URLs, suspension, valid owner property/room creation and publication, aggregate consistency, valid signup/favorites, viewing participants and duplicate-safe delivery.

A portable Temurin Java 21 runtime was downloaded under ignored `.tools/java` to run the emulator. It did not change the system Java installation. To rerun using it in PowerShell:

```powershell
$dormJava = Get-ChildItem -LiteralPath .tools/java -Directory | Select-Object -First 1
$env:JAVA_HOME = $dormJava.FullName
$env:PATH = "$($dormJava.FullName)\bin;$env:PATH"
npm run test:rules
```

Tests intentionally generate permission-denied log lines when verifying abuse rejection. The pass/fail summary is the result to check.

## Acceptance checks after setup

Use separate browser sessions for a tenant, verified landlord and administrator. Start with a private Netlify preview.

1. Register both account roles; verify the email links, password reset, login, logout and session restoration. Confirm no success is reported for invalid credentials or disconnected services.
2. Confirm an unverified landlord cannot create a property or upload media. Submit ownership, business permit, barangay clearance and fire-safety references. Bootstrap admin using the trusted operator script. Approve only from Permit Reviews after checking the evidence.
3. Upload real JPEG, PNG and WebP photos. Verify compression and Cloudinary paths. Reject wrong formats, oversized content, anonymous requests and suspended accounts. Confirm that provider failure leaves the form unsaved.
4. Create a pending property. Confirm guests cannot see it. Add rooms, approve as admin, and confirm the listing becomes searchable. Change the description and confirm it returns to moderation.
5. Open room inventory in two owner sessions; mark spaces occupied concurrently. Verify neither negative availability nor lost updates occurs. Reconfirm vacancy and inspect the server timestamp.
6. Check school/barangay search, room type, price and combined amenities filters. Load another search page. Verify map pins and real directions. Cross-check starting listing prices/types against room inventory.
7. Save rooms, compare deposit/advance/utilities, and check saved-place vacancy notifications. Publish a Kwarto Wanted request and send a matching offer from a verified owner. No tenant charge or paywall should appear.
8. Send messages in both directions, inspect read status and unread conversation counts, load older history, request and confirm a viewing. Use a third account and a direct SDK call to attempt unauthorized conversation access.
9. Block the other participant. Confirm further messages are denied. Report a suspicious listing and resolve it as admin. Inspect audit entries. Pause published listings when suspending an owner.
10. In a **production build**, enable private offline storage on a test device, open a conversation and favorite details, then go offline. Check the stale-data banner. Queue a message, reconnect, and confirm exactly one delivery. Repeat after closing and reopening the app, signing back in, and retrying after a connection failure. Test two open tabs too. Private cache must disappear after logout.
11. Test 360px, 390px, 768px and desktop layouts, both themes, keyboard navigation, dialog focus, error announcements, screen-reader labels, visible focus and reduced motion. Check long real property names and multiple photos for overflow.
12. Check PWA installation on target Android/iOS devices; confirm the first installed shell opens offline. The manifest includes 3D DOMI maskable 192px/512px PNG icons. External map tiles, fonts and uncached photos are not guaranteed offline.

## Scope and operational limits

- Public search loads 24 properties at a time. Search/filter matches apply to the records loaded so far, not an indexed full-text search over every property.
- Owner property and room management fetch records in 100-record cursor batches, with no record-creation subscription cap. Large portfolios will consume more reads; a future viewport-based page UI should replace eager aggregation at scale.
- The initial inbox shows 30 recent conversations; history inside a conversation supports 50-message pagination. Older conversations can be reopened from their original property when it remains published. Full inbox pagination is still needed for larger usage.
- Favorites and admin collection screens initially read up to 100 records; room requests show the latest 30. These require additional UI pagination before growing beyond the initial launch size. Alerts check the first 20 favorites on opening the screen; there is no push delivery or background matching service.
- Owner-maintained `minPrice` and `roomTypes` summaries should be reviewed whenever room prices/types change. Capacity and availability totals are enforced atomically by rules.
- Offline favorites and conversations are available only after opt-in and after loading those pages. Offline favorites edits are not queued. Pending messages retry in the foreground; closed-browser background delivery is not promised.
- Private IndexedDB data is not independently encrypted. It is opt-in, scoped by UID and cleared on logout, but shared devices remain unsuitable.
- Public records are intentionally readable. Bounded queries, validation, owner verification, optional App Check, suspended-account checks and upload rate limits reduce abuse but do not eliminate scraping or authenticated write spam. Add per-user server-enforced write quotas before unrestricted high-volume launch. Monitor usage and moderation during the initial rollout.
- Permit reference details are stored in a private landlord application and reviewed by an administrator. Sensitive identity scans are not accepted as public listing photos. Before launch, add the real support contact, retention/privacy policy and account/data-deletion procedure. No contact identity has been invented.
- The signed Cloudinary upload preset and Netlify rate-limit behavior need deployed verification. Removed/unattached Cloudinary images require periodic orphan cleanup.
- Optional ₱50/30-day Pro payments, aggregated demand analytics, payment evidence review, expiry/renewal processing, saved quick replies and local LLM downloads are deliberately deferred until the core is verified. The subscriptions collection is reserved/read-only.

These limits are not represented as completed functionality in the UI or deployment claim. Complete the live-service and browser checks before describing this as production-ready.

## Final local hardening pass — 17 October 2026

- Fixed OSM root tile host in Netlify CSP, minPrice map labels, missing image fallbacks, map disposal and visible tile failure/loading states. Removed invented property coordinates. Raster map tilt is not a 3D building tour.
- Added session/local Firebase persistence through Remember me, verification resend, unverified-session exclusion and verified-email Firestore action checks. Signup cannot grant owner verification; publication requires verified owners and admin review. Google profile initialization uses a transaction to avoid role creation races.
- Added form busy states, duplicate submission guards, initial branded loading, DOMI question/history limits, full-screen controls, viewport layout adjustments, keyboard focus and reduced-motion styling. Alerts moved from the desktop sidebar to the top bar.
- Used the existing DOMI asset for branding/favicon/PWA. Updated wordmark and raised sidebar treatments. No Get Started action remains.
- Removed unconditional verified-listing labels, marked illustrative landing examples, clarified loaded admin counts, and removed the unconfirmed privacy email/compliance guarantee.
- Uploads reject unverified emails and failed profile checks. App Check headers are forwarded to Firestore. Production acceptance of invalid App Check tokens still requires verification with enforcement enabled in Firebase.

### Still required before deployment approval

Live email delivery, Google sign-in on the deployed authorized domain, App Check token acceptance/enforcement, real Cloudinary uploads, mobile/desktop visual review and multi-account end-to-end flows have NOT passed in this session. A public privacy contact is still missing. Existing local reCAPTCHA site key presence is not evidence of successful enforcement. No production deployment or rules publication was performed. The map dependency still produces a bundle-size warning.

## Latest UI and map verification

- Production build, 19 application tests and 21 fresh Standard-edition Firestore emulator tests pass, including the new atomic landlord permit approval path.
- Browser verified: privacy opens in a modal without leaving login; the 2D fallback renders real Tuguegarao tiles; Back to home is present; DOMI is chat-only. No real credentials or signup were submitted. WebGL 3D rendering remains unverified in this browser.
- Added the explicit MapLibre Vite worker, OpenFreeMap vector buildings with mapped heights, saved-coordinate directions, all-page published listing retrieval, and pagination regression tests. Buildings depend on source coverage; this is not a verified property survey.
- Resend verification is hidden until an unverified-email error. Remember me saves the email/preference after successful email login and chooses persistent Firebase login; passwords are not stored. Explicit logout still ends the session.
- Five failed password attempts trigger a 60-second device cooldown. This can be bypassed by clearing browser storage and is not a server rate limit. Firebase/App Check production enforcement still requires validation.
- Netlify configuration is present (npm run build, dist, netlify/functions), but no local linked-site metadata was found. Production environment settings, domains, email delivery, reCAPTCHA enforcement, uploads, operator privacy contact and retention/deletion process remain launch blockers.
- Outcome: suitable for a controlled preview after configuring its environment; NOT verified ready for unrestricted public launch.
