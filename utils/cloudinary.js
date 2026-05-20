const cloudinary = require('cloudinary').v2;
const multer = require('multer');
cloudinary.config({ cloud_name: 'dummy', api_key: 'dummy', api_secret: 'dummy' });
const uploadThumbnail = multer({ storage: multer.memoryStorage() });
const uploadVideo = multer({ storage: multer.memoryStorage() });
const uploadAvatar = multer({ storage: multer.memoryStorage() });
const deleteFromCloudinary = async (publicId, resourceType) => {};
module.exports = { cloudinary, uploadThumbnail, uploadVideo, uploadAvatar, deleteFromCloudinary };