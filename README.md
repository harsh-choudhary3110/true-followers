# True Followers

Compare your Instagram **followers** and **following** entirely in your browser. Find who
doesn't follow you back, who you don't follow back, your mutuals, and track unfollowers over
time — with **no login, no server, and no data ever leaving your device**.

## How it works

Instagram's API doesn't expose follower lists, and scraping violates their terms. Instead,
True Followers uses your **official data export**:

1. Request your info from Instagram in **JSON** format ("Followers and following").
2. Download the ZIP Instagram emails you.
3. Drop the ZIP into True Followers — it reads `followers_*.json` and `following.json` locally
   and computes the comparison in your browser.

## Features

- Who doesn't follow you back / who you don't follow back / mutuals / pending requests
- Search, sort, and CSV export for every list
- Follower/following/mutual counts and ratio
- Unfollower-over-time tracking via local snapshots (stored in your browser only)
- Light/dark mode, responsive, landing page + step-by-step export guide + FAQ

## Tech

React + Vite + TypeScript + Tailwind CSS. State via Zustand, ZIP parsing via JSZip. Ships as a
static site — deploy the `dist/` folder to any static host.

## Development

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm test         # run the parser/diff unit tests
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

There's a `public/sample-instagram-export.zip` you can drop into the upload page to try the
tool without a real export.

## Privacy

There is no backend. All parsing and comparison happens client-side in JavaScript. Snapshots
for unfollower tracking are stored in `localStorage` on your device only.

Not affiliated with Instagram or Meta.
