const Anime = require('../models/Anime');

/**
 * GET /api/stream/:slug/:episode
 * Returns the saved video URL from MongoDB for the given anime slug
 */
async function getStreamUrl(req, res) {
  const { slug } = req.params;

  try {
    const anime = await Anime.findOne({ 
      slug: { $regex: slug, $options: 'i' } 
    });

    if (!anime) {
      return res.status(404).json({ success: false, message: 'Anime not found' });
    }

    const videoUrl = anime.videoUrl;

    if (!videoUrl) {
      return res.status(404).json({ success: false, message: 'No video URL available' });
    }

    let type = 'embed';
    if (videoUrl.includes('.m3u8')) type = 'm3u8';
    if (videoUrl.includes('.mp4'))  type = 'mp4';

    console.log(`✅ Stream URL served for: ${anime.title} [${type}]`);

    return res.json({ success: true, url: videoUrl, type, title: anime.title });

  } catch (err) {
    console.error('❌ streamController error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to get stream URL' });
  }
}

module.exports = { getStreamUrl };