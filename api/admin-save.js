// Vercel serverless function: validate admin password + commit new prices to GitHub
// Required env vars (set in Vercel dashboard -> Settings -> Environment Variables):
//   ADMIN_PASSWORD  — the password the admin types in /admin
//   GH_TOKEN        — a GitHub Personal Access Token with "Contents: Read and write" on
//                     the PenguinMC/craft-website repo
//
// Once the commit lands, Vercel auto-redeploys and the new prices.json is live.

const REPO = 'PenguinMC/craft-website';
const FILE_PATH = 'data/prices.json';
const BRANCH = 'main';

// Whitelist of allowed price keys so an attacker can't smuggle other fields in
const ALLOWED_KEYS = new Set([
  'ppl_aircraft_hourly',
  'ppl_cfi_hourly',
  'advanced_cfi_hourly',
  'da42_wet_hourly',
  'sim_hourly',
  'discovery_flight',
  'accel_ifr',
  'accel_cpl',
  'accel_multi',
  'accel_cfi',
  'accel_cfii',
  'accel_mei',
]);

module.exports = async (req, res) => {
  // CORS / preflight
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Parse body (Vercel auto-parses JSON when Content-Type is application/json,
  // but be defensive in case it's a string)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Missing body' });

  const { password, prices } = body;

  // Auth
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Server not configured: ADMIN_PASSWORD missing' });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  // Validate prices payload
  if (!prices || typeof prices !== 'object') {
    return res.status(400).json({ error: 'Missing prices object' });
  }
  const cleaned = {};
  for (const key of ALLOWED_KEYS) {
    const val = prices[key];
    if (val === undefined || val === null || val === '') {
      return res.status(400).json({ error: `Missing price for ${key}` });
    }
    const num = Number(val);
    if (!Number.isFinite(num) || num < 0 || num > 1000000) {
      return res.status(400).json({ error: `Invalid value for ${key}` });
    }
    cleaned[key] = num;
  }

  // GitHub commit
  const token = process.env.GH_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Server not configured: GH_TOKEN missing' });
  }

  try {
    // Get current SHA
    const getUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const getRes = await fetch(getUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'craft-admin',
      },
    });
    if (!getRes.ok) {
      const t = await getRes.text();
      return res.status(502).json({ error: 'GitHub get failed', details: t.slice(0, 300) });
    }
    const current = await getRes.json();

    // Encode new content as base64
    const newJson = JSON.stringify(cleaned, null, 2) + '\n';
    const newContent = Buffer.from(newJson, 'utf8').toString('base64');

    const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'craft-admin',
      },
      body: JSON.stringify({
        message: 'Admin: update prices',
        content: newContent,
        sha: current.sha,
        branch: BRANCH,
        committer: { name: 'CRAFT Admin', email: 'admin@flycraftchs.com' },
      }),
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      return res.status(502).json({ error: 'GitHub commit failed', details: t.slice(0, 300) });
    }

    return res.status(200).json({ success: true, prices: cleaned });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e).slice(0, 300) });
  }
};
