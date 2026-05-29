const express = require('express');
const router = express.Router();
const { getStreamUrl } = require('../controllers/streamController');

// ── Proxy route MUST come before /:slug/:episode ────────────────
// (otherwise Express matches "proxy" as a slug and this never runs)
router.get('/proxy', async (req, res) => {
  const { url, referer } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    const targetUrl = decodeURIComponent(url);

    // Bug 2 fix: use caller-supplied referer, or fall back to megaplay.
    // Never derive it from the target URL — the CDN checks where the
    // *player page* is, not where the stream file itself is hosted.
    const spoofedReferer = referer
      ? decodeURIComponent(referer)
      : 'https://megaplay.buzz/';
    const spoofedOrigin = new URL(spoofedReferer).origin;

    const response = await fetch(targetUrl, {
      headers: {
        'Referer':         spoofedReferer,
        'Origin':          spoofedOrigin,
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':          '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error:      'Upstream fetch failed',
        status:     response.status,
        statusText: response.statusText,
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // m3u8 playlist — rewrite every segment/sub-playlist URL through proxy
    // and forward the same referer so .ts chunks also pass the hotlink check
    if (targetUrl.includes('.m3u8')) {
      const text = await response.text();
      const base = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return trimmed;

        const absoluteUrl = trimmed.startsWith('http') ? trimmed : base + trimmed;

        // Pass the same referer so nested .m3u8 and .ts requests also work
        return `/api/stream/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(spoofedReferer)}`;
      }).join('\n');

      return res.send(rewritten);
    }

    // .ts segments and other binary — pipe directly
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy request failed', detail: err.message });
  }
});

// ── Existing route (after /proxy so it doesn't swallow it) ─────
router.get('/:slug/:episode', getStreamUrl);

module.exports = router;