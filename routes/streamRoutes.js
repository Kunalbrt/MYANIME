const express = require('express');
const router = express.Router();
const { getStreamUrl } = require('../controllers/streamController');

// ── Existing route ──────────────────────────────────────────────
router.get('/:slug/:episode', getStreamUrl);

// ── New proxy route ─────────────────────────────────────────────
router.get('/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    const targetUrl = decodeURIComponent(url);
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': '',
        'Origin': '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream fetch failed' });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // If it's an m3u8 playlist — rewrite segment URLs to also go through proxy
    if (targetUrl.includes('.m3u8')) {
      const text = await response.text();
      const base = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const rewritten = text.split('\n').map(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return line;
        const absoluteUrl = line.startsWith('http') ? line : base + line;
        return `/api/stream/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      }).join('\n');
      return res.send(rewritten);
    }

    // For .ts segments and other binary — pipe directly
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy request failed', detail: err.message });
  }
});

module.exports = router;