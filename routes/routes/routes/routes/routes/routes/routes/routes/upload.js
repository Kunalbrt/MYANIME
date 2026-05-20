const express = require('express');
const router = express.Router();
const { uploadThumbnail, uploadVideo, uploadAvatar, deleteFromCloudinary } = require('../utils/cloudinary');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect, requireAdmin);

router.post('/thumbnail', uploadThumbnail.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path, publicId: req.file.filename });
});

router.post('/video', uploadVideo.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path, publicId: req.file.filename });
});

router.post('/avatar', uploadAvatar.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path });
});

router.delete('/:publicId', async (req, res) => {
  const { publicId } = req.params;
  const { resourceType } = req.body;
  await deleteFromCloudinary(publicId, resourceType || 'image');
  res.json({ success: true, message: 'Deleted' });
});

module.exports = router;