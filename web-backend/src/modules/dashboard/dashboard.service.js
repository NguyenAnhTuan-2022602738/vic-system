/**
 * Module thống kê dashboard.
 * Cung cấp tổng quan hệ thống: số dự báo, tin tức, giao dịch.
 */

import { ForecastCache } from '../forecast/forecast.repository.js';
import { NewsCache } from '../news/news.repository.js';
import { TradeLog } from '../trade/trade.repository.js';

export const dashboardService = {
  /**
   * Lấy thống kê tổng quan hệ thống.
   */
  async getStats() {
    const [
      totalForecasts,
      totalNews,
      totalTrades,
      recentForecasts,
      buyCount,
      holdCount,
      avoidCount,
    ] = await Promise.all([
      ForecastCache.countDocuments(),
      NewsCache.countDocuments(),
      TradeLog.countDocuments(),
      ForecastCache.find().sort({ createdAt: -1 }).limit(5),
      ForecastCache.countDocuments({ recommendation: 'BUY' }),
      ForecastCache.countDocuments({ recommendation: 'HOLD' }),
      ForecastCache.countDocuments({ recommendation: 'AVOID' }),
    ]);

    return {
      counts: {
        forecasts: totalForecasts,
        news_analyzed: totalNews,
        trades: totalTrades,
      },
      recommendations: {
        buy: buyCount,
        hold: holdCount,
        avoid: avoidCount,
      },
      recent_forecasts: recentForecasts,
    };
  },
};
