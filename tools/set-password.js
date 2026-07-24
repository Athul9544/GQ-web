#!/usr/bin/env node
/**
 * Set the admin portal password.
 *
 *   node tools/set-password.js "your-password"
 *
 * Writes data/admin-password.txt, which the server reads on start. That folder
 * is never served over HTTP. Restart the server for the change to take effect.
 */

const fs = require('fs');
const path = require('path');

const password = process.argv.slice(2).join(' ').trim();
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'admin-password.txt');

if (!password) {
  console.error('Usage: node tools/set-password.js "your-password"');
  console.error('Quote the password if it contains spaces or shell characters.');
  process.exit(1);
}
if (password.length < 6) {
  console.error('Use at least 6 characters.');
  process.exit(1);
}

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(FILE, password + '\n', 'utf8');

// Owner-only where the platform honours it.
try { fs.chmodSync(FILE, 0o600); } catch { /* Windows ignores this */ }

console.log('Admin password updated.');
console.log('  stored in : data/admin-password.txt');
console.log('  length    : ' + password.length + ' characters');
console.log('\nRestart the server for it to take effect:');
console.log('  node server.js');
