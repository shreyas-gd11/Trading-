const express = require('express');
const newsController = require('../controllers/newsController');

const router = express.Router();

// GET /api/news?symbol=NIFTY
router.get('/', newsController.getNews);

module.exports = router;
