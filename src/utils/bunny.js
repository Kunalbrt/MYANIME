const axios = require('axios');

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;

const createVideo = async (title) => {
  const response = await axios.post(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
    { title },
    {
      headers: {
        AccessKey: BUNNY_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

const uploadVideo = async (videoId, buffer) => {
  await axios.put(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    buffer,
    {
      headers: {
        AccessKey: BUNNY_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  );
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
};

const deleteVideo = async (videoId) => {
  await axios.delete(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      headers: {
        AccessKey: BUNNY_API_KEY,
      },
    }
  );
};

module.exports = { createVideo, uploadVideo, deleteVideo };