// Persistence for the single "current watchlist upload" record.
//
// This is deliberately a flat JSON file on disk rather than a workaround
// like localStorage/window.storage: it's real server-side state that every
// client hits through the API below, and it survives process restarts.
// Swapping this module for SQLite/Postgres later only touches this file.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'dataset.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.dataset)) return null;
    return parsed;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    console.error('Failed to read dataset store:', err);
    return null;
  }
}

function writeStore(payload) {
  ensureDataDir();
  const tmpFile = DATA_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(payload));
  fs.renameSync(tmpFile, DATA_FILE); // atomic on POSIX, avoids a half-written file if the process dies mid-write
}

module.exports = { readStore, writeStore };
