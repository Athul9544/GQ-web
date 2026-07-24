#!/usr/bin/env node
/**
 * Golden Qube — static site + blog CMS.
 *
 *   node server.js            (defaults to port 5500)
 *   set PORT=8080 & node server.js
 *   set ADMIN_PASSWORD=... & node server.js
 *
 * No npm dependencies. Images arrive as data URLs in the JSON body and are
 * written to assets/img/uploads, which avoids hand-rolling multipart parsing.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5500;
const DATA_DIR = path.join(ROOT, 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const PASSWORD_FILE = path.join(DATA_DIR, 'admin-password.txt');
const UPLOAD_DIR = path.join(ROOT, 'assets', 'img', 'uploads');

/* Password comes from the environment first, then data/admin-password.txt, so
   it survives restarts without needing an env var set every time. That file
   sits in data/, which is never served over HTTP. */
function loadPassword() {
  if (process.env.ADMIN_PASSWORD) return { value: process.env.ADMIN_PASSWORD, from: 'ADMIN_PASSWORD' };
  try {
    const stored = fs.readFileSync(PASSWORD_FILE, 'utf8').trim();
    if (stored) return { value: stored, from: 'data/admin-password.txt' };
  } catch { /* not set yet */ }
  return { value: 'goldenqube', from: 'built-in default' };
}

const { value: PASSWORD, from: PASSWORD_SOURCE } = loadPassword();
const USING_DEFAULT_PASSWORD = PASSWORD_SOURCE === 'built-in default';

const MAX_BODY = 12 * 1024 * 1024;          // 12 MB, enough for a large photo
const IMAGE_TYPES = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg',
  'image/webp': '.webp', 'image/gif': '.gif'
};
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, '[]', 'utf8');

/* ----------------------------------------------------------------- storage */

function readPosts() {
  try {
    const parsed = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePosts(posts) {
  // Write to a temp file first so a crash mid-write cannot truncate the store.
  const tmp = POSTS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(posts, null, 2), 'utf8');
  fs.renameSync(tmp, POSTS_FILE);
}

/* -------------------------------------------------------------------- auth */

const sessions = new Map();                  // token -> expiry timestamp
const SESSION_MS = 8 * 60 * 60 * 1000;

function issueToken() {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + SESSION_MS);
  return token;
}

function validToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expiry = sessions.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) { sessions.delete(token); return false; }
  return true;
}

// Constant-time compare so the password cannot be guessed by timing.
function passwordMatches(candidate) {
  const a = Buffer.from(String(candidate));
  const b = Buffer.from(PASSWORD);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ------------------------------------------------------------------ helpers */

function send(res, status, payload, headers = {}) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60) || 'post';
}

/** Decode a data URL onto disk and return its public path. */
function saveImage(dataUrl, slug) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || '');
  if (!match) return null;

  const ext = IMAGE_TYPES[match[1].toLowerCase()];
  if (!ext) throw new Error('unsupported image type: ' + match[1]);

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 6 * 1024 * 1024) throw new Error('image larger than 6 MB');

  const name = `${Date.now()}-${slug}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  return `assets/img/uploads/${name}`;
}

function removeImage(publicPath) {
  if (!publicPath || !publicPath.startsWith('assets/img/uploads/')) return;
  const file = path.join(ROOT, publicPath);
  // Confirm the resolved path is still inside the upload folder.
  if (!file.startsWith(UPLOAD_DIR)) return;
  fs.existsSync(file) && fs.unlinkSync(file);
}

function cleanPost(body, existing) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  if (!title) throw new Error('Title is required');
  if (!description) throw new Error('Description is required');

  const slug = slugify(title);
  let image = existing ? existing.image : null;

  if (body.image === null) {                       // explicit removal
    removeImage(image);
    image = null;
  } else if (typeof body.image === 'string' && body.image.startsWith('data:')) {
    const saved = saveImage(body.image, slug);
    if (saved) { removeImage(image); image = saved; }
  }

  return {
    title,
    description,
    image,
    category: String(body.category || '').trim() || 'Digital Marketing'
  };
}

/* ------------------------------------------------------------------ routing */

async function api(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean);   // ['api','posts',id?]
  const resource = parts[1];
  const id = parts[2];

  if (resource === 'login' && req.method === 'POST') {
    const body = await readBody(req);
    if (!passwordMatches(body.password)) {
      return send(res, 401, { error: 'Incorrect password' });
    }
    return send(res, 200, { token: issueToken() });
  }

  if (resource === 'session' && req.method === 'GET') {
    return send(res, 200, { valid: validToken(req) });
  }

  if (resource !== 'posts') return send(res, 404, { error: 'Unknown endpoint' });

  if (req.method === 'GET') {
    const posts = readPosts().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return send(res, 200, posts);
  }

  // Everything past this point changes data and needs a valid session.
  if (!validToken(req)) return send(res, 401, { error: 'Not signed in' });

  if (req.method === 'POST') {
    const fields = cleanPost(await readBody(req), null);
    const posts = readPosts();
    const now = Date.now();
    const post = { id: crypto.randomBytes(8).toString('hex'), ...fields, createdAt: now, updatedAt: now };
    posts.push(post);
    writePosts(posts);
    return send(res, 201, post);
  }

  if (req.method === 'PUT') {
    const posts = readPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index < 0) return send(res, 404, { error: 'Post not found' });
    const fields = cleanPost(await readBody(req), posts[index]);
    posts[index] = { ...posts[index], ...fields, updatedAt: Date.now() };
    writePosts(posts);
    return send(res, 200, posts[index]);
  }

  if (req.method === 'DELETE') {
    const posts = readPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index < 0) return send(res, 404, { error: 'Post not found' });
    removeImage(posts[index].image);
    const [removed] = posts.splice(index, 1);
    writePosts(posts);
    return send(res, 200, { deleted: removed.id });
  }

  return send(res, 405, { error: 'Method not allowed' });
}

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  if (!path.extname(rel)) rel += '.html';          // /contact -> /contact.html

  const file = path.join(ROOT, rel);
  // Never serve anything outside the project, or the data folder.
  if (!file.startsWith(ROOT) || file.startsWith(DATA_DIR)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1>404</h1><p>Not found. <a href="/">Go home</a></p>');
    }
    const ext = path.extname(file).toLowerCase();
    // Markup, styles and scripts must never be served stale — a cached copy of
    // an edited file is indistinguishable from the edit not working.
    const isCode = ['.html', '.css', '.js', '.json'].includes(ext);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': isCode ? 'no-store, must-revalidate' : 'public, max-age=3600'
    });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith('/api/')) {
    try {
      await api(req, res, url);
    } catch (err) {
      send(res, 400, { error: err.message || 'Request failed' });
    }
    return;
  }

  serveStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log(`\n  Golden Qube running at http://localhost:${PORT}`);
  console.log(`  Admin portal            http://localhost:${PORT}/admin`);
  console.log(`  Posts stored in         data/posts.json`);
  console.log(`  Admin password from     ${PASSWORD_SOURCE}`);
  if (USING_DEFAULT_PASSWORD) {
    console.log(`\n  Still using the built-in default password. Change it with:`);
    console.log(`    node tools/set-password.js "your-password"\n`);
  } else {
    console.log('');
  }
});
