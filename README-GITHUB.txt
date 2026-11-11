WellaUSChecker V1 — GitHub Pages edition

PUBLISH:
1. Create a public GitHub repository named WellaUSChecker (or any name).
2. Upload the CONTENTS of the docs folder to the repository root (index.html, style.css, renderer.js, startup.js, web-bridge.js, fonts/).
3. Open Settings → Pages.
4. Under Build and deployment choose Deploy from a branch.
5. Select branch main and folder / (root), then Save.
6. Wait for GitHub Pages to publish the site.

BROWSER EDITION NOTES:
- Interface is shared with the Electron app.
- Settings and verified usernames are stored in this browser's localStorage. They do not sync between devices or browsers.
- CSV export downloads a file. Results folder action downloads a JSON backup.
- Public profile checks use browser fetch. Many social platforms block browser requests with CORS or anti-bot protection; those results are UNKNOWN, never falsely marked available. Open the profile and verify in the platform's official username settings.
- AVAILABLE is only set after the user manually confirms the platform accepted the username.
- GitHub Pages is static hosting; it does not run a private server or bypass platform restrictions.
