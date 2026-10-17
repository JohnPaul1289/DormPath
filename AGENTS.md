# DormPath project instructions

- For every Firebase-related task, first look for and read the appropriate official Firebase agent skills under `.agents/skills/`. Apply those skills to the task; do not rely on memory alone.
- Use the existing Firebase project `dormpath`. Do not create a replacement project.
- The backend is Firebase Authentication and Cloud Firestore. Support email/password and Google sign-in.
- Keep student features free. Preserve the Netlify and Cloudinary architecture unless the user requests a change.
- Never infer administrator or owner-verification privileges from editable client fields. Preserve the Firestore security boundaries and run the isolated emulator tests after security changes.
- Keep service credentials and login tokens out of source, logs, and chat. Firebase web-app configuration is public; retrieve its actual values from the registered Firebase web app rather than inventing them.
