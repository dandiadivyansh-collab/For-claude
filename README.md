# Repeat Offender Watchlist Dashboard

City-wise dashboard for the Call Insights Repeat Offender Watchlist. One
person uploads the daily export; everyone who opens the dashboard's URL
sees that same data, with no upload step of their own.

## How it works

- `public/index.html` — the dashboard UI. All CSV/Excel parsing runs in the
  browser (unchanged from the original standalone version). After parsing,
  it POSTs the parsed dataset to the server instead of holding it only in
  that tab.
- `server.js` — a small Express server exposing:
  - `GET /api/dataset` — the most recently uploaded dataset (or `null` if
    nothing has been uploaded yet).
  - `POST /api/upload` — stores a newly parsed dataset, overwriting the
    previous one.
- `storage.js` — persists the current dataset to `data/dataset.json` on
  disk. It survives server restarts. No login/password gate: anyone who
  can reach the server can view, and anyone can upload (there's exactly
  one uploader in practice, per the brief).

Every open tab polls `GET /api/dataset` every 20 seconds; if newer data
shows up while someone's mid-session, they get a "newer data is available"
banner instead of being yanked out from under them.

## Running it

```bash
npm install
npm start
```

By default the server binds to `127.0.0.1:3000` only (`HOST`/`PORT` env
vars override this). Binding to localhost only is intentional — for anyone
off this machine to reach the same link, put a reverse proxy (nginx,
Caddy, an internal load balancer, etc.) in front of it. That reverse proxy
is also where you'd add network-level access restriction (e.g. Zomato-only
VPN/IP allowlist) if the dashboard needs to be restricted to a specific
audience — this repo doesn't attempt that on its own since it's not free-
public.

## What's not built yet

Per the brief, the trend view (per-city, per-week issue volume chart) and
the WoW/MoM/QoQ trend cards are follow-up work, gated on confirming this
upload-and-sync flow works end to end first.
