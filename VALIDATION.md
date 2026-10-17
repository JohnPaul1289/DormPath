# Validation and launch handoff

Checked on 17 October 2026 (Asia/Manila).

## Results

| Check | Result |
| --- | --- |
| Production Vite build | Passed; Firebase auth, Firestore, core, icons and map split into separate chunks |
| Domain and upload-boundary tests | 9 passed |
| Firestore emulator integration / abuse tests | 17 passed against isolated `demo-dormpath` |
| npm dependency audit | 0 reported vulnerabilities after removing the app-local Firebase CLI and pinning a patched gRPC transitive dependency |
| Secrets | No service credentials supplied or embedded; `.env.example` contains empty values |
| Visual / browser interaction check | Not completed: browser tool rejected access to the local URL under its URL policy |
| Real Firebase Auth and email flows | Not run: Firebase project not yet created |
| Real Cloudinary photo upload | Not run: Cloudinary account and preset not yet created |
| Netlify deployment, function runtime / rate limit | Not run: hosting account/project not configured |
| Real multi-device chat and offline browser reconnection | Not run; stable-ID retry and conversation permission logic passed emulator tests |

The Firestore suite covers bounded public queries, private profile access, self-verification/role escalation, cross-owner writes, administrative moderation, unverified-owner rejection, message privacy (including admin non-access), sender spoofing, blocking, invalid occupancy, unsafe photo URLs, suspension, valid owner property/room creation and publication, aggregate consistency, valid signup/favorites, viewing participants and duplicate-safe delivery.

A portable Temurin Java 21 runtime was downloaded under ignored `.tools/java` to run the emulator. It did not change the system Java installation. To rerun using it in PowerShell:

```powershell
$dormJava = Get-ChildItem -LiteralPath .tools/java -Directory | Select-Object -First 1
$env:JAVA_HOME = $dormJava.FullName
$env:PATH = "$($dormJava.FullName)\bin;$env:PATH"
npm run test:rules
```

Tests intentionally generate permission-denied log lines when verifying abuse rejection. The pass/fail summary is the result to check.

## Acceptance checks after setup

Use separate browser sessions for a student, verified landlord and administrator. Start with a private Netlify preview.

1. Register both account roles; verify the email links, password reset, login, logout and session restoration. Confirm no success is reported for invalid credentials or disconnected services.
2. Confirm an unverified landlord cannot create a property or upload a photo. Bootstrap admin using the trusted operator script. Verify the owner after reviewing actual evidence.
3. Upload real JPEG, PNG and WebP photos. Verify compression and Cloudinary paths. Reject wrong formats, oversized content, anonymous requests and suspended accounts. Confirm that provider failure leaves the form unsaved.
4. Create a pending property. Confirm guests cannot see it. Add rooms, approve as admin, and confirm the listing becomes searchable. Change the description and confirm it returns to moderation.
5. Open room inventory in two owner sessions; mark spaces occupied concurrently. Verify neither negative availability nor lost updates occurs. Reconfirm vacancy and inspect the server timestamp.
6. Check school/barangay search, room type, price and combined amenities filters. Load another search page. Verify map pins and real directions. Cross-check starting listing prices/types against room inventory.
7. Save rooms, compare deposit/advance/utilities, and check saved-place vacancy notifications. Publish a Kwarto Wanted request and send a matching offer from a verified owner. No student charge or paywall should appear.
8. Send messages in both directions, inspect read status and unread conversation counts, load older history, request and confirm a viewing. Use a third account and a direct SDK call to attempt unauthorized conversation access.
9. Block the other participant. Confirm further messages are denied. Report a suspicious listing and resolve it as admin. Inspect audit entries. Pause published listings when suspending an owner.
10. In a **production build**, enable private offline storage on a test device, open a conversation and favorite details, then go offline. Check the stale-data banner. Queue a message, reconnect, and confirm exactly one delivery. Repeat after closing and reopening the app, signing back in, and retrying after a connection failure. Test two open tabs too. Private cache must disappear after logout.
11. Test 360px, 390px, 768px and desktop layouts, both themes, keyboard navigation, dialog focus, error announcements, screen-reader labels, visible focus and reduced motion. Check long real property names and multiple photos for overflow.
12. Check PWA installation on target Android/iOS devices; confirm the first installed shell opens offline. The manifest includes SVG and 192px/512px PNG icons. External map tiles, fonts and uncached photos are not guaranteed offline.

## Scope and operational limits

- Public search loads 24 properties at a time. Search/filter matches apply to the records loaded so far, not an indexed full-text search over every property.
- Owner property and room management fetch records in 100-record cursor batches, with no record-creation subscription cap. Large portfolios will consume more reads; a future viewport-based page UI should replace eager aggregation at scale.
- The initial inbox shows 30 recent conversations; history inside a conversation supports 50-message pagination. Older conversations can be reopened from their original property when it remains published. Full inbox pagination is still needed for larger usage.
- Favorites and admin collection screens initially read up to 100 records; room requests show the latest 30. These require additional UI pagination before growing beyond the initial launch size. Alerts check the first 20 favorites on opening the screen; there is no push delivery or background matching service.
- Owner-maintained `minPrice` and `roomTypes` summaries should be reviewed whenever room prices/types change. Capacity and availability totals are enforced atomically by rules.
- Offline favorites and conversations are available only after opt-in and after loading those pages. Offline favorites edits are not queued. Pending messages retry in the foreground; closed-browser background delivery is not promised.
- Private IndexedDB data is not independently encrypted. It is opt-in, scoped by UID and cleared on logout, but shared devices remain unsuitable.
- Public records are intentionally readable. Bounded queries, validation, owner verification, optional App Check, suspended-account checks and upload rate limits reduce abuse but do not eliminate scraping or authenticated write spam. Add per-user server-enforced write quotas before unrestricted high-volume launch. Monitor usage and moderation during the initial rollout.
- Verification evidence is reviewed through an operator process, not uploaded into this app. Before launch, add the real support contact, retention/privacy policy and account/data-deletion procedure. No contact identity has been invented.
- The signed Cloudinary upload preset and Netlify rate-limit behavior need deployed verification. Removed/unattached Cloudinary images require periodic orphan cleanup.
- Optional ₱50/30-day Pro payments, aggregated demand analytics, payment evidence review, expiry/renewal processing, saved quick replies and local LLM downloads are deliberately deferred until the core is verified. The subscriptions collection is reserved/read-only.

These limits are not represented as completed functionality in the UI or deployment claim. Complete the live-service and browser checks before describing this as production-ready.
