const newsService = require('../services/newsService');

const newsController = {
  // GET /api/news?symbol=NIFTY&limit=12
  async getNews(req, res, next) {
    try {
      const { symbol, q, limit } = req.query;
      const payload = await newsService.fetchNews({
        symbol,
        query: q,
        limit
      });

      res.status(200).json({
        success: true,
        data: payload
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = newsController;
