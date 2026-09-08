/**
 * Golden Qube — shared helpers for the Vercel serverless admin API.
 *
 * Vercel has no writable disk and no shared memory between invocations, so the
 * two things server.js keeps locally have to live somewhere else:
 *
 *   posts + images  ->  committed to the GitHub repo via the Contents API
 *   sessions        ->  stateless HMAC-signed tokens, nothing stored
 *
 * Committing is also what publishes: each write pushes to the repo, which
 * triggers a Vercel redeploy, so the static blog picks the change up too.
 *
 * Files in /api starting with "_" are not routed by Vercel, so this stays
 * a plain module rather than an endpoint.
 */

const crypto = require('crypto');

const REPO = process.env.GITHUB_REPO || 'Athul9544/GQ-web';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/* One less variable to set. A dedicated SESSION_SECRET is still honoured, but
   deriving one from the password is enough: it is never sent to the browser,
   and the only consequence is that changing the password signs everyone out. */
const SESSION_SECRET = process.env.SESSION_SECRET || (ADMIN_PASSWORD
  ? crypto.createHash('sha256').update('gq-session:' + ADMIN_PASSWORD).digest('hex')
  : null);

const POSTS_PATH = 'data/posts.json';
const UPLOAD_DIR = 'assets/img/uploads';
const SESSION_MS = 8 * 60 * 60 * 1000;

/* Vercel rejects request bodies over 4.5 MB before our code ever runs, and a
   data URL is ~33% larger than the file it encodes. 3 MB of image is ~4 MB of
   base64, which leaves room for the rest of the JSON. admin.js enforces the
   same ceiling client-side so the user gets a message instead of a dead 413. */
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const IMAGE_TYPES = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg',
  'image/webp': '.webp', 'image/gif': '.gif'
};

/* ------------------------------------------------------------------ config */

const CONFIG_VALUES = {
  ADMIN_PASSWORD: () => ADMIN_PASSWORD,
  GITHUB_TOKEN: () => GITHUB_TOKEN
};

/* Names of the environment variables that have not been set in Vercel. Callers
   pass the ones they actually need: signing in only needs the password, so a
   missing GITHUB_TOKEN must not lock the operator out of the portal — it is
   only publishing, which commits to the repo, that cannot work without it. */
function missingConfig(needs = ['ADMIN_PASSWORD', 'GITHUB_TOKEN']) {
  return needs.filter(name => !CONFIG_VALUES[name]());
}

/* Which deployment is answering. Vercel injects these, so they need no setup —
   and they are what tells you whether the variables went to the project that
   actually serves this URL, and whether a redeploy has picked them up yet. */
function deploymentInfo() {
  return {
    project: process.env.VERCEL_PROJECT_PRODUCTION_URL || 'unknown',
    environment: process.env.VERCEL_ENV || 'unknown',
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || 'unknown',
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown'
  };
}

/** Wrap a handler so a misconfigured deploy explains itself instead of 500ing. */
function withConfig(handler, needs) {
  return async (req, res) => {
    const missing = missingConfig(needs);
    if (missing.length) {
      const at = deploymentInfo();
      return send(res, 503, {
        error: 'Admin API not configured. Set ' + missing.join(' and ') +
               ' on the Vercel project that serves ' + at.project +
               ' (tick Production), then redeploy. Now running commit ' +
               at.commit + ' on ' + at.branch + '.',
        missing,
        deployment: at
      });
    }
    try {
      await handler(req, res);
    } catch (err) {
      send(res, err.status || 400, { error: err.message || 'Request failed' });
    }
  };
}

/* ------------------------------------------------------------------ output */

function send(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

/** Vercel parses JSON bodies for us, but not when the content-type is absent. */
function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body || '{}')); }
    catch { return Promise.reject(new Error('invalid JSON')); }
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

/* -------------------------------------------------------------------- auth */

/* Stateless tokens: the expiry is carried in the token and signed, so any
   invocation can verify one without a shared session store. */
function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MS }))
    .toString('base64url');
  return payload + '.' + sign(payload);
}

function sign(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

function validToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const dot = token.lastIndexOf('.');
  if (dot < 1) return false;

  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(payload));
  if (given.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(given, expected)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

function requireAuth(req) {
  if (!validToken(req)) {
    const err = new Error('Not signed in');
    err.status = 401;
    throw err;
  }
}

/* Digest both sides first so the comparison is constant length — comparing the
   raw strings would leak the password length through timingSafeEqual throwing. */
function passwordMatches(candidate) {
  const a = crypto.createHash('sha256').update(String(candidate)).digest();
  const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

/* ------------------------------------------------------------- github i/o */

async function github(path, options = {}) {
  const res = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'goldenqube-admin',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    }
  });

  if (res.status === 404) return { status: 404, data: null };

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error('GitHub: ' + (data.message || res.status));
    err.status = res.status === 401 || res.status === 403 ? 502 : 502;
    throw err;
  }
  return { status: res.status, data };
}

/** Current posts plus the blob sha needed to write them back. */
async function readPosts() {
  const { data } = await github(POSTS_PATH + '?ref=' + BRANCH);
  if (!data) return { posts: [], sha: undefined };

  let posts = [];
  try {
    const parsed = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    if (Array.isArray(parsed)) posts = parsed;
  } catch { /* corrupt file — treat as empty rather than wedging the admin */ }

  return { posts, sha: data.sha };
}

async function writePosts(posts, sha, message) {
  await github(POSTS_PATH, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      branch: BRANCH,
      sha,
      content: Buffer.from(JSON.stringify(posts, null, 2), 'utf8').toString('base64')
    })
  });
}

/** Decode a data URL into the repo and return the public path. */
async function saveImage(dataUrl, slug) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || '');
  if (!match) return null;

  const ext = IMAGE_TYPES[match[1].toLowerCase()];
  if (!ext) throw new Error('unsupported image type: ' + match[1]);

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error('image larger than 3 MB');

  const path = UPLOAD_DIR + '/' + Date.now() + '-' + slug + ext;
  await github(path, {
    method: 'PUT',
    body: JSON.stringify({
      message: 'Upload blog image ' + slug,
      branch: BRANCH,
      content: buffer.toString('base64')
    })
  });
  return path;
}

async function removeImage(publicPath) {
  if (!publicPath || !publicPath.startsWith(UPLOAD_DIR + '/')) return;
  const { data } = await github(publicPath + '?ref=' + BRANCH);
  if (!data) return;                        // already gone

  await github(publicPath, {
    method: 'DELETE',
    body: JSON.stringify({
      message: 'Remove blog image',
      branch: BRANCH,
      sha: data.sha
    })
  });
}

/* ------------------------------------------------------------------ posts */

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60) || 'post';
}

/** Validate and normalise an incoming post, handling the image side effects. */
async function cleanPost(body, existing) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  if (!title) throw new Error('Title is required');
  if (!description) throw new Error('Description is required');

  const slug = slugify(title);
  let image = existing ? existing.image : null;

  if (body.image === null) {
    await removeImage(image);
    image = null;
  } else if (typeof body.image === 'string' && body.image.startsWith('data:')) {
    const saved = await saveImage(body.image, slug);
    if (saved) { await removeImage(image); image = saved; }
  }

  return {
    title,
    description,
    image,
    category: String(body.category || '').trim() || 'Digital Marketing'
  };
}

/* A push lands between our read and write when two edits overlap, which makes
   the sha stale. Re-read and reapply rather than failing in the user's face. */
async function updatePosts(mutate, message) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { posts, sha } = await readPosts();
    const result = await mutate(posts);
    try {
      await writePosts(posts, sha, message);
      return result;
    } catch (err) {
      const stale = /409|sha|conflict|does not match/i.test(err.message);
      if (!stale || attempt === 2) throw err;
    }
  }
}

module.exports = {
  send, readBody, requireAuth, validToken, passwordMatches, issueToken,
  withConfig, missingConfig, deploymentInfo, readPosts, updatePosts, cleanPost,
  removeImage, slugify, MAX_IMAGE_BYTES
};
