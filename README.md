<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d2452fec-4ed3-46c7-b403-72244e2da296

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install --legacy-peer-deps`
2. Start the app and the shortener API together:
   `npm run dev`
3. Open http://localhost:3000

Short links redirect through `http://localhost:3000/s/<code>` and count as clicks. QR codes point at `http://localhost:3000/q/<code>` and count as scans. Both are stored in `data/store.json`.
