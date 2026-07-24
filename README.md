# Golden Qube — local rebuild

A rebuild of [goldenqube.com](https://goldenqube.com/) using the same content (copy, services,
curriculum, founders, Google reviews, FAQs, contact details). The original is WordPress +
Elementor; this is plain HTML/CSS/JS plus a small Node server that powers the blog CMS.
No npm dependencies, no build step, no framework.

## Run it

```powershell
node server.js
```

Then open <http://localhost:5500>. The server hosts the site *and* the blog CMS.

```powershell
$env:PORT = "8080"                      # different port
$env:ADMIN_PASSWORD = "your-password"   # set before exposing this anywhere
node server.js
```

A plain static server (`npx serve`) still displays every page, but the blog CMS needs
`server.js` because uploads and saved posts require a backend.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home — hero slider, services, GOAL-Based / Students / Business Owners, DMAPT, founders, stats, testimonials |
| `training.html` | Training — 3-month curriculum, tool marquee, who should enroll, trainers, careers |
| `contact.html` | Let's Connect — enquiry form, contact details, quick-contact tiles, FAQ |
| `blog.html` | Our Blog — posts published from the admin portal |
| `admin.html` | Blog CMS (also served at `/admin`) |
| `privacy-policy.html` | Privacy Policy (full text from the live site) |

`Terms & Condition` links to `#` because it does that on the live site too — no such page exists there.

## Blog CMS

Open <http://localhost:5500/admin> and sign in. The default password is `goldenqube`;
override it with `ADMIN_PASSWORD` before this goes anywhere public.

From the portal you can publish a post with a **title, description and image**, edit any post,
and delete one. Posts appear on `blog.html` immediately — no rebuild. When no posts exist the
blog page falls back to its "Articles are on the way" notice.

- Posts are stored in `data/posts.json`, written atomically via a temp file.
- Images upload as data URLs and are saved to `assets/img/uploads/`, then deleted with their post.
- Only PNG, JPG, WebP and GIF are accepted, up to 6 MB each.
- Sign-in returns a token held in server memory for 8 hours; restarting the server signs you out.
- `GET /api/posts` is public (the blog page reads it). Create, update and delete require the token.

### API

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/login` | — | Exchange the password for a token |
| `GET` | `/api/session` | — | Check whether a token is still valid |
| `GET` | `/api/posts` | — | List posts, newest first |
| `POST` | `/api/posts` | yes | Create |
| `PUT` | `/api/posts/:id` | yes | Update |
| `DELETE` | `/api/posts/:id` | yes | Delete, including its image |

## Google reviews

The testimonials on the home page render from `assets/data/reviews.json`. To refresh it with
live data from Google:

```powershell
$env:GOOGLE_MAPS_API_KEY = "your_key"
node tools/fetch-reviews.js
```

Requires "Places API (New)" enabled on the Google Cloud project, with billing attached.
Google returns **at most 5 reviews** per place, though the total count stays accurate.
Run it on a schedule — the key must never ship in browser code. If the fetch fails the
existing file is left untouched, and the page falls back to the cards in the HTML.

## Structure

```
server.js              site + CMS API (zero dependencies)
tools/fetch-reviews.js refresh Google reviews into assets/data/reviews.json
data/posts.json        blog posts (created on first run)
assets/
  css/style.css        site styles
  css/admin.css        admin portal styles
  js/main.js           icon sprite, hero slider, FAQ, reviews, chatbot, animations, blog feed
  js/admin.js          admin portal
  data/reviews.json    Google review feed
  img/                 site images
  img/tools/           brand logos for the toolkit marquee
  img/uploads/         images uploaded through the CMS
```

## Notes

- The contact form is front-end only — it shows a confirmation and sends nothing. Point it at
  your own endpoint or extend `server.js` with a mail route when you go live.
- Social links are `#` placeholders; drop the real URLs in when you have them.
- Icons are inline SVG injected from `main.js` — no icon font, no CDN, works offline.
- The chatbot is rule-based and offline: keyword matching over a knowledge base built from the
  site's own content, so it cannot invent facts. Edit the `KB` array in `main.js` to change answers.
- Text and image entrance animations are applied automatically by `main.js` and are disabled
  for visitors who prefer reduced motion.

### Before this goes public

`server.js` is built for local use and a small trusted deployment. If you host it on the open
internet, add: HTTPS, a hashed password rather than a plain environment variable, rate limiting
on `/api/login`, and a persistent session store so restarts don't sign everyone out.
