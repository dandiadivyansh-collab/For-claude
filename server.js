const path = require('path');
const express = require('express');
const { readStore, writeStore } = require('./storage');

const app = express();
const PORT = process.env.PORT || 3000;
// Org security policy: always bind to localhost, never all interfaces.
// Put a reverse proxy in front of this for anyone outside this machine to
// reach the dashboard link.
const HOST = process.env.HOST || '127.0.0.1';

app.use(express.json({ limit: '25mb' })); // watchlist exports can carry long ticket summary text
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/dataset', (req, res) => {
  const store = readStore();
  if (!store) return res.json({ dataset: null, meta: null });
  res.json(store);
});

app.post('/api/upload', (req, res) => {
  const { dataset, meta } = req.body || {};
  if (!Array.isArray(dataset) || dataset.length === 0) {
    return res.status(400).json({ ok: false, reason: 'dataset must be a non-empty array' });
  }
  if (!meta || typeof meta !== 'object') {
    return res.status(400).json({ ok: false, reason: 'meta is required' });
  }
  try {
    writeStore({ dataset, meta });
    res.json({ ok: true, meta });
  } catch (err) {
    console.error('Failed to persist uploaded dataset:', err);
    res.status(500).json({ ok: false, reason: 'server could not save the dataset' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Repeat Offender Watchlist dashboard listening on http://${HOST}:${PORT}`);
});
