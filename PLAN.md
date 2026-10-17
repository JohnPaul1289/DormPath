# Implementation plan

1. Build a responsive vanilla JavaScript/Vite application, using the provided DOMI asset, real empty states, and accessible navigation.
2. Add Firebase Authentication, Firestore repository operations, server-enforced verified-owner/admin permissions, property and room inventory, search, map and private chat.
3. Add favorites/comparison, room requests, viewing requests, notifications and opt-in offline drafts with stable message IDs.
4. Add a Netlify authenticated upload proxy with server-side validation and Cloudinary signed uploads; secrets stay server-side.
5. Provide rules, indexes, configuration and deployment documentation. Verify build, validation, security rules and UI as tooling permits. Clearly distinguish local checks from credentials-dependent integration checks.

Structure: src/{main,api,domain,offline}.js; src/style.css; public/{domi.png,sw.js,manifest.webmanifest}; netlify/functions; firestore.rules; firestore.indexes.json; tests; scripts; README.md.

Optional Pro billing and local LLM downloads are deferred until the core is verified with a live backend, per the requested phase order.
