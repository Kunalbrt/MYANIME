const axios = require('axios');

const LOCAL_API = 'http://127.0.0.1:5000';

/**
 * Fetches a fresh embed URL for a given anime slug + episode index
 */
async function getFreshEmbedUrl(slug, episodeIndex = 0) {
  try {
    // Step 1: Get anime info
    const info = await axios.get(`${LOCAL_API}/api/anime/${slug}`);
    const ani_id = info.data?.ani_id;
    if (!ani_id) throw new Error('No ani_id found');

    // Step 2: Get episodes
    const epRes = await axios.get(`${LOCAL_API}/api/episodes/${ani_id}`);
    const episodes = epRes.data?.episodes || [];
    if (!episodes.length) throw new Error('No episodes found');

    const episode = episodes[episodeIndex];
    if (!episode) throw new Error(`Episode ${episodeIndex} not found`);

    // Step 3: Get servers
    const serverRes = await axios.get(`${LOCAL_API}/api/servers/${episode.token}`);
    const linkId = serverRes.data?.servers?.sub?.[0]?.link_id;
    if (!linkId) throw new Error('No link_id found');

    // Step 4: Get fresh source URL
    const sourceRes = await axios.get(`${LOCAL_API}/api/source/${linkId}`);
    const freshUrl = sourceRes.data?.sources?.[0]?.file || null;

    return {
      success: true,
      embedUrl: freshUrl,
      fallbackUrl: `https://anikai.to/embed/${slug}` // fallback if fresh fails
    };

  } catch (err) {
    console.error('❌ streamScraper error:', err.message);
    return {
      success: false,
      embedUrl: null,
      fallbackUrl: `https://anikai.to/embed/${slug}`
    };
  }
}

module.exports = { getFreshEmbedUrl };