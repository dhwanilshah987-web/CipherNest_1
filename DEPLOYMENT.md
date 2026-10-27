# Deploy SecureBlock Cloud

This is a Vite + React + TypeScript frontend. The current project stores its vault in the browser using IndexedDB and uses the Web Crypto API. It does not require a backend server for the included demo functionality. Browser storage is local to each browser/device; it is not shared cloud storage unless you separately implement and configure a real storage backend.

## Run locally

1. Install Node.js 20 or newer (Node 22 LTS is a good choice) and npm.
2. Extract this project and open a terminal in the folder containing `package.json`.
3. Run:

   ```bash
   npm ci
   npm run dev
   ```

4. Open the local URL printed by Vite (usually `http://localhost:5173`).
5. Run checks before submitting:

   ```bash
   npm test
   npm run build
   ```

## Deploy to Vercel (simple static hosting)

1. Create a Git repository and push the project folder to GitHub, GitLab, or Bitbucket. Do not upload `node_modules`.
2. Sign in to Vercel and choose **Add New → Project**.
3. Import the repository.
4. Use these build settings:
   - Framework preset: **Vite**
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Output directory: `dist`
5. Select **Deploy**. Vercel will provide an HTTPS URL.
6. Test all routes and features on the deployed URL, including upload, object listing, block inspection, download/verify, activity, and settings.

## Deploy to Netlify

1. Push the project to a Git repository and import it in Netlify.
2. Set build command to `npm run build` and publish directory to `dist`.
3. Deploy, then test the published HTTPS URL.

## Important notes

- Use HTTPS in production. Web Crypto functionality and secure browser behavior depend on a secure context; localhost is treated specially by browsers for development.
- IndexedDB data remains in the user's browser profile. It is not automatically backed up, synced to another device, or stored in an AWS bucket.
- If the browser's site data is cleared, the local vault may be lost. Export a backup through the application's available settings before clearing browser data.
- Never put AWS access keys, secret keys, or other credentials in frontend source code or Vite environment variables exposed to the browser. A real AWS integration should use a backend or appropriately scoped temporary credentials and a carefully configured bucket policy.
- If a deploy reports a build failure, use Node.js 20+ and rerun `npm ci` before `npm run build`.
