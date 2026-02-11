const express = require('express');
const marketController = require('../controllers/marketController');

const router = express.Router();

// GET /api/market/market-data?symbol=NIFTY
// Public endpoint - no authentication required
router.get('/market-data', marketController.getMarketAnalysis);

module.exports = router;