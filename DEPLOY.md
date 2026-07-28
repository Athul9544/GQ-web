# Deploying to Vercel

The whole site runs on Vercel, admin portal included. You sign in at
`/admin` on the live site and publish from there — no local server needed.

## How it works

Vercel has no writable disk and no memory shared between requests, so the two
things `server.js` keeps locally had to move:

| Local (`server.js`) | Live (`api/`) |
| --- | --- |
| posts in `data/posts.json` on disk | posts committed to the GitHub repo |
| images in `assets/img/uploads/` | images committed to the GitHub repo |
| sessions in an in-memory `Map` | stateless HMAC-signed tokens |

Publishing a post commits it to `Athul9544/GQ-web`, which triggers a Vercel
redeploy. The blog page reads `/api/posts` first and falls back to the committed
`data/posts.json`, so a new post appears immediately rather than waiting for
that redeploy to finish.

`server.js` still works for local editing and is excluded from the deploy — a
`server.js` in the project root makes Vercel detect a Node server app and fail
the build with "No entrypoint found".

## Required environment variables

Only two are required. Set them in **Vercel → Settings → Environment
Variables** with **Production** ticked, then redeploy — variables are applied
at build time, so an existing deployment never picks them up.

| Variable | What to use |
| --- | --- |
| `ADMIN_PASSWORD` | The password you want for `/admin`. |
| `GITHUB_TOKEN` | A GitHub token that can write to the repo. |

Three are optional: `SESSION_SECRET` (derived from `ADMIN_PASSWORD` when
unset), `GITHUB_REPO` (`Athul9544/GQ-web`) and `GITHUB_BRANCH` (`main`).

**Check `/api/status` first if anything misbehaves.** It answers even when
nothing is configured, and reports which variables are present plus the
project, commit and branch actually serving the request — which is how you
confirm the variables landed on the right project and that a redeploy has
picked them up.

### Creating the GitHub token

GitHub → **Settings → Developer settings → Personal access tokens →
Fine-grained tokens → Generate new token**:

- **Repository access:** Only select repositories → `Athul9544/GQ-web`
- **Permissions:** Repository permissions → **Contents: Read and write**
- Copy the token once — GitHub will not show it again.

The token can write to this repository, so treat it like a password. It lives
only in Vercel's environment variables, never in the repo.

## Publishing a post

1. Go to `/admin` on the live site and sign in.
2. Add, edit or delete posts.

Each change commits to the repo and triggers a redeploy. Text appears on the
blog straight away; **an uploaded image needs the redeploy to finish (about a
minute) before it loads**, because images are served as static files.

Images are capped at **3 MB**. Vercel rejects request bodies over 4.5 MB before
the API runs, and base64 encoding inflates a file by about a third.

## Editing locally instead

`node server.js` still serves the site and admin at `http://localhost:5500`,
writing to disk as before. Commit `data/posts.json` and `assets/img/uploads/`
and push when done.

Don't edit in both places without pulling first — the live admin commits
directly to `main`, so a local copy goes stale as soon as you publish online.

## What is where

| Deployed | Local only |
| --- | --- |
| `index/training/contact/blog/privacy` pages | `server.js` — the local CMS backend |
| `admin.html`, `assets/js/admin.js`, `assets/css/admin.css` | `tools/` scripts |
| `api/` — login, session, posts | `data/admin-password.txt` |
| `assets/` and `data/posts.json` | |

## Custom domain

**Settings → Domains → Add**, enter `goldenqube.com`, follow the DNS
instructions. Vercel issues the HTTPS certificate automatically. Note that
`goldenqube.com` currently points at a WordPress site behind Cloudflare, so its
DNS has to be moved before it will serve this project.
