const axios = require('axios');

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL;

// Create a video entry in Bunny Stream
const createVideo = async (title) => {
  const res = await axios.post(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
    { title },
    { headers: { AccessKey: BUNNY_API_KEY, 'Content-Type': 'application/json' } }
  );
  return res.data;
};

// Upload video to Bunny Stream
const uploadVideo = async (videoId, fileBuffer) => {
  await axios.put(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    fileBuffer,
    {
      headers: {
        AccessKey: BUNNY_API_KEY,
        'Content-Type': 'application/octet-stream'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }
  );
  return `${BUNNY_CDN_URL}/${videoId}/playlist.m3u8`;
};

// Delete video from Bunny Stream
const deleteVideo = async (videoId) => {
  await axios.delete(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    { headers: { AccessKey: BUNNY_API_KEY } }
  );
};

module.exports = { createVideo, uploadVideo, deleteVideo, BUNNY_CDN_URL };