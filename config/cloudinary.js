// ============================================
//  Config: Cloudinary
// ============================================

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── Image/Thumbnail Storage ───────────────────
const thumbnailStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'myanime/thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1280, height: 720, crop: 'fill', quality: 'auto' }]
  }
});

// ── Video Storage ─────────────────────────────
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'myanime/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mkv', 'avi', 'webm', 'mov'],
    chunk_size: 6000000,    // 6MB chunks for large files
    eager: [
      { streaming_profile: 'full_hd', format: 'm3u8' }  // HLS streaming
    ],
    eager_async: true
  }
});

// ── Avatar Storage ────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'myanime/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill', quality: 'auto' }]
  }
});

// ── Multer Uploaders ──────────────────────────
const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }  // 5MB max
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }  // 2GB max
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }  // 2MB max
});

/**
 * Delete a resource from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};

module.exports = {
  cloudinary,
  uploadThumbnail,
  uploadVideo,
  uploadAvatar,
  deleteFromCloudinary
};