const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createVideo, uploadVideo, deleteVideo } = require('../utils/bunny');
const { protect, requireAdmin } = require('../middleware/Auth');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB max
});

// ── Upload Video to Bunny.net ─────────────────
router.post('/video', protect, requireAdmin, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No video file uploaded' });

    const title = req.body.title || req.file.originalname;

    // Step 1: Create video entry in Bunny
    const videoEntry = await createVideo(title);

    // Step 2: Upload actual video file
    const videoUrl = await uploadVideo(videoEntry.guid, req.file.buffer);

    res.json({
      success: true,
      videoId: videoEntry.guid,
      videoUrl,
      message: 'Video uploaded successfully!'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Delete Video from Bunny.net ───────────────
router.delete('/video/:videoId', protect, requireAdmin, async (req, res) => {
  try {
    await deleteVideo(req.params.videoId);
    res.json({ success: true, message: 'Video deleted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
  
module.exports = router;