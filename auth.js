// Minimal HTTP Basic Auth gate. Configured via DASHBOARD_USER / DASHBOARD_PASSWORD
// env vars so this repo never has a hardcoded credential in it. If either is
// unset (e.g. local development), the gate is skipped — see the startup
// warning in server.js.

const crypto = require('crypto');

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function basicAuthGate() {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;
  const enabled = Boolean(user && pass);

  return function (req, res, next) {
    if (!enabled) return next();

    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      let decoded = '';
      try {
        decoded = Buffer.from(encoded, 'base64').toString('utf8');
      } catch {
        decoded = '';
      }
      const sep = decoded.indexOf(':');
      if (sep !== -1) {
        const reqUser = decoded.slice(0, sep);
        const reqPass = decoded.slice(sep + 1);
        if (timingSafeStringEqual(reqUser, user) && timingSafeStringEqual(reqPass, pass)) {
          return next();
        }
      }
    }
    res.set('WWW-Authenticate', 'Basic realm="Repeat Offender Watchlist"');
    res.status(401).send('Authentication required');
  };
}

module.exports = { basicAuthGate };
