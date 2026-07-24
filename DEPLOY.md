# Deploying to Vercel

This is the **git-based** setup: the live site is static (fast, free), and you
publish blog posts by running the admin locally and pushing the result.

## Why it works this way

Vercel runs static files and serverless functions — it has **no persistent
writable disk**. The blog CMS (`server.js`) writes posts and images to disk, so
it can't run live on Vercel. Instead:

- The five pages, the reviews section, animations, chatbot — all static, deploy fine.
- The blog reads `data/posts.json` as a static file, so **posts you commit show up live**.
- You write posts with the admin **locally**, then commit and push. Vercel redeploys.

The server, tools and admin portal are excluded from the deploy (`.vercelignore`)
because they only make sense locally.

## One-time setup

1. Put the project in a Git repo and push it to GitHub (or GitLab/Bitbucket):

   ```powershell
   cd "c:\Users\HP\Desktop\GQ Web\goldenqube-local"
   git init
   git add .
   git commit -m "Golden Qube site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/goldenqube.git
   git push -u origin main
   ```

   `.gitignore` keeps the admin password out of the repo.

2. On [vercel.com](https://vercel.com): **Add New → Project → Import** your repo.
   Framework preset: **Other**. Root directory: leave as is. Click **Deploy**.

   `vercel.json` handles the rest — clean URLs (`/training`, not `/training.html`)
   and cache headers. No build command is needed.

Your site is live at `https://your-project.vercel.app` in about a minute.

## Publishing a blog post

Each time you want to add, edit or delete a post:

```powershell
cd "c:\Users\HP\Desktop\GQ Web\goldenqube-local"
node server.js
```

1. Open <http://localhost:5500/admin> and sign in.
2. Add, edit or delete posts as usual.
3. Stop the server (Ctrl+C), then commit and push what changed:

   ```powershell
   git add data/posts.json assets/img/uploads
   git commit -m "New blog post: <title>"
   git push
   ```

Vercel redeploys automatically and the post is live within a minute.

## What is where

| Runs on Vercel (deployed) | Runs locally only |
| --- | --- |
| `index/training/contact/blog/privacy` pages | `server.js` — the CMS backend |
| `assets/` (css, js, images, uploads) | `admin.html`, `admin.js`, `admin.css` |
| `data/posts.json` (read as a static file) | `tools/` scripts |
| `assets/data/reviews.json` (Google reviews) | `data/admin-password.txt` |

## Custom domain

In the Vercel project: **Settings → Domains → Add**, enter `goldenqube.com`,
and follow the DNS instructions. Vercel issues the HTTPS certificate automatically.

## If you later want a live admin on the deployed site

That needs a database and blob storage (Vercel KV + Vercel Blob, or a host with a
real disk like Render or Railway running `server.js` unchanged). Ask and it can be
wired up — it's a bigger change than this git-based flow.
