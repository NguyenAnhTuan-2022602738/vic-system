import marketService from './market.service.js';

class MarketController {
  async getHistory(req, res, next) {
    try {
      const { startDate } = req.query;
      const data = await marketService.getHistory(startDate);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getVolumeProfile(req, res, next) {
    try {
      const bins = parseInt(req.query.bins) || 10;
      const data = await marketService.getVolumeProfile(bins);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export default new MarketController();
