const express = require('express');
const router = express.Router();
const { getStreamUrl } = require('../controllers/streamController');

router.get('/:slug/:episode', getStreamUrl);

module.exports = router;