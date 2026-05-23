const { getFreshEmbedUrl } = require('../utils/streamScraper');

/**
 * GET /api/stream/:slug/:episode
 * Returns a fresh embed/stream URL for the given anime slug and episode number
 */
async function getStreamUrl(req, res) {
  const { slug, episode } = req.params;
  const episodeIndex = parseInt(episode) || 0;

  try {
    const result = await getFreshEmbedUrl(slug, episodeIndex);

    if (result.success && result.embedUrl) {
      return res.json({
        success: true,
        url: result.embedUrl,
        type: 'm3u8' // HLS stream
      });
    }

    // Fallback to embed iframe URL
    return res.json({
      success: true,
      url: result.fallbackUrl,
      type: 'embed' // use as iframe src
    });

  } catch (err) {
    console.error('❌ streamController error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to get stream URL'
    });
  }
}

module.exports = { getStreamUrl };