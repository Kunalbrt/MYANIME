const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => res.json({ message: 'anime placeholder route works!' }));

module.exports = router;
