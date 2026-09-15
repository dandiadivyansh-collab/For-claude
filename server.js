const path = require('path');
const express = require('express');
const { readStore, writeStore } = require('./storage');
const { basicAuthGate } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;
// Default stays localhost-only for local dev. On a platform like Render, the
// app has to bind 0.0.0.0 inside its own isolated container for the
// platform's edge/router to reach it at all — that override is set
// explicitly in render.yaml, not defaulted here.
const HOST = process.env.HOST || '127.0.0.1';

const authEnabled = Boolean(process.env.DASHBOARD_USER && process.env.DASHBOARD_PASSWORD);
if (!authEnabled) {
  console.warn('WARNING: DASHBOARD_USER/DASHBOARD_PASSWORD not set — running with no access gate. Set both before exposing this beyond your own machine.');
}

app.use(express.json({ limit: '25mb' })); // watchlist exports can carry long ticket summary text
app.use(basicAuthGate());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/dataset', (req, res) => {
  const store = readStore();
  if (!store) return res.json({ dataset: null, citySummary: null, meta: null });
  res.json(store);
});

app.post('/api/upload', (req, res) => {
  const { dataset, citySummary, meta } = req.body || {};
  if (!Array.isArray(dataset) || dataset.length === 0) {
    return res.status(400).json({ ok: false, reason: 'dataset must be a non-empty array' });
  }
  if (!meta || typeof meta !== 'object') {
    return res.status(400).json({ ok: false, reason: 'meta is required' });
  }
  try {
    writeStore({ dataset, citySummary: citySummary || null, meta });
    res.json({ ok: true, meta });
  } catch (err) {
    console.error('Failed to persist uploaded dataset:', err);
    res.status(500).json({ ok: false, reason: 'server could not save the dataset' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Repeat Offender Watchlist dashboard listening on http://${HOST}:${PORT}`);
  console.log('Dataset is stored on local disk (storage.js). On a host without a persistent disk, a redeploy or restart can wipe it — if the dashboard unexpectedly shows "No data uploaded yet," that\'s why; just re-upload.');
});
