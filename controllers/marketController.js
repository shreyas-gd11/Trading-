const marketService = require('../services/marketService');

const marketController = {
  // GET /api/market/market-data?symbol=NIFTY
  async getMarketAnalysis(req, res, next) {
    try {
      const { symbol } = req.query;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          message: 'Symbol parameter is required'
        });
      }

      // Get complete market analysis
      const analysis = await marketService.analyzeMarket(symbol);

      res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = marketController;