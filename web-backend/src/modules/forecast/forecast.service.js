/**
 * Dịch vụ dự báo — gọi API dịch vụ AI và lưu lịch sử.
 */

import { 
  requestAdjustedForecast,
  requestMultiHorizonForecast,
  requestPerformanceMetrics,
  requestBackfill,
  requestMarketHistory
} from '../../integrations/ai_client.js';
import { telegramService } from '../../integrations/telegram.service.js';
import { ForecastCache } from './forecast.repository.js';
import ForecastHistory from '../../models/ForecastHistory.js';

export const forecastService = {
  // === STATEFUL T+2 FORECAST PIPELINE === //

  /**
   * Kích hoạt AI service xử lý pipeline toàn diện (update dữ liệu, dự báo, lưu DB)
   */
  async triggerPipeline() {
    // Gọi sang module Python AI (Sẽ mất thời gian do crawl và chạy model)
    const { requestForecastPipeline } = await import('../../integrations/ai_client.js');
    const response = await requestForecastPipeline();
    // response đã là body từ FastAPI: { success: true, data: { expected_return, ... } }
    const data = response.data; 

    console.log(`[Forecast Service] Lưu trữ kết quả Pipeline dự báo vào CSDL...`);

    // Lưu phiên bản chạy pipeline này vào bảng History
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);

    const historyRecord = await ForecastHistory.create({
      symbol: 'VIC',
      target_date: targetDate,
      horizon: 3,
      expected_return: data.expected_return,
      lstm_prediction: data.lstm_prediction || 0,
      base_uncertainty: data.base_uncertainty || 0.02,
      adjusted_uncertainty: data.adjusted_uncertainty || 0.03,
      risk_var: data.risk_var,
      win_rate: data.win_rate,
      sharpe_ratio: data.sharpe_ratio,
      impact_weight: data.impact_weight || 0.15,
      sentiment_score: data.sentiment_score,
      final_action: data.final_action,
      confidence: data.confidence,
      stop_loss: data.stop_loss || 0,
      take_profit: data.take_profit || 0,
      last_price_used: data.last_price_used,
      latest_news_analyzed: data.latest_news_analyzed || 5,
      comparison_data: data.comparison || [] // MỚI: Dữ liệu so sánh lưu vào DB
    });


    console.log(`✅ [Forecast Service] Đã lưu bản ghi dự báo mới: ID=${historyRecord._id}`);

    return historyRecord;
  },

  /**
   * Truy xuất dự báo T+2 mới nhất được tính toán (không thay đổi qua các lần refresh)
   */
  async getLatestPipeline() {
    const latest = await ForecastHistory.findOne().sort({ timestamp: -1 });
    // Trả về null nếu chưa có, không throw Error gây lỗi 500
    return latest || null;
  },

  // === OLD ENDPOINTS === //
  async forecast({ horizon, target_return, alpha, beta }) {
    const aiResponse = await requestForecast({ horizon, target_return, alpha, beta });
    // aiResponse = { success, data: { horizon, expected_return, ... } }
    const data = aiResponse.data;

    // Lưu vào lịch sử dự báo
    await ForecastCache.create({
      horizon,
      expected_return: data.expected_return,
      uncertainty: data.uncertainty,
      probability_gain: data.probability_gain,
      var_95: data.var_95,
      recommendation: data.recommendation,
      trading_signal: data.trading_signal,
    });

    // Phase 09 - Gửi cảnh báo Telegram nếu có tín hiệu mạnh
    if (data.trading_signal && ['BUY', 'SELL'].includes(data.trading_signal.action)) {
      telegramService.sendAlert(data, data.trading_signal).catch(err => {
        console.error("Lỗi khi gửi cảnh báo Telegram background:", err.message);
      });
    }

    return data;
  },

  async adjustedForecast(horizon, newsText) {
    const aiResponse = await requestAdjustedForecast(horizon, newsText);
    // aiResponse = { success: true, data: { original_mu, adjusted_mu, ... } }
    
    console.log(`[Forecast Service] Chạy giả lập thành công cho tin: ${newsText.substring(0, 30)}...`);
    
    // TRẢ VỀ TOÀN BỘ RESPONSE (Frontend sẽ bóc tách .data sau)
    return aiResponse;
  },

  async getMultiHorizon(target_return) {
    const aiResponse = await requestMultiHorizonForecast(target_return);
    // aiResponse = { success, data: { horizons: [...] } }
    return aiResponse.data;
  },

  async getPerformance() {
    const aiResponse = await requestPerformanceMetrics();
    // aiResponse = { success, data: { symbol, history, metrics } }
    return aiResponse.data;
  },

  async getHistory(limit = 20) {
    return await ForecastCache.find()
      .sort({ createdAt: -1 })
      .limit(limit);
  },

  /**
   * ĐỐI CHIẾU LỊCH SỬ (FLASHBACK MODE)
   * Lấy dự báo cũ (hoặc backfill) và so sánh với giá thực tế T+3.
   */
  async getHistoryComparison(dateString) {
    const requestedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate >= today) {
      return { 
        forecast: null, 
        actual: null, 
        message: "Chế độ Flashback chỉ hỗ trợ dữ liệu lịch sử trước ngày hôm nay." 
      };
    }

    console.log(`[Flashback] Khởi mào đối chiếu cho ngày: ${dateString}`);
    
    // 1. Kiểm tra xem ngày này đã có bản ghi trong ForecastHistory chưa
    const searchDate = new Date(dateString);
    const startOfDay = new Date(searchDate.setHours(0,0,0,0));
    const endOfDay = new Date(searchDate.setHours(23,59,59,999));

    let forecast = await ForecastHistory.findOne({
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    // 2. CƠ CHẾ BACKFILL: Nếu chưa có, gọi AI Service làm bù
    if (!forecast) {
      console.log(`[Flashback] ⚠️ Không tìm thấy dự báo cũ cho ngày ${dateString}. Đang chạy Backfill...`);
      try {
        const aiResponse = await requestBackfill({ base_date: dateString });
        const data = aiResponse.data;

        // Lưu bản ghi mới vào DB
        const targetDate = new Date(dateString);
        targetDate.setDate(targetDate.getDate() + 3);

        forecast = await ForecastHistory.create({
          symbol: 'VIC',
          timestamp: new Date(dateString), // Đặt đúng ngày quá khứ
          target_date: targetDate,
          horizon: 3,
          expected_return: data.expected_return,
          lstm_prediction: data.lstm_prediction || 0,
          risk_var: data.var_95,
          win_rate: data.probability_gain,
          sharpe_ratio: 1.5, // Default
          sentiment_score: data.sentiment_score,
          final_action: data.recommendation,
          confidence: data.confidence || 0.75,
          last_price_used: data.last_price_used || 0
        });
        console.log(`[Flashback] ✅ Đã tạo bản ghi Backfill thành công: ID=${forecast._id}`);
      } catch (err) {
        console.error(`[Flashback] Lỗi khi chạy Backfill:`, err.message);
        throw new Error(`Không thể chạy dự báo bù cho ngày ${dateString}`);
      }
    }

    // 3. ĐỐI CHIẾU VỚI GIÁ THỰC TẾ
    // Lấy lịch sử giá (start_date từ ngày chọn đến nay)
    const marketResponse = await requestMarketHistory(dateString);
    const history = marketResponse.data;

    if (!history || history.length < 1) {
      return { forecast, actual: null, message: "Không tìm thấy dữ liệu giá thực tế" };
    }

    // Tìm giá Entry (ngày T) và giá Exit (sau 2 phiên giao dịch - tổng 3 phiên T, T+1, T+2)
    const entryPrice = history[0].close;
    // index 2 là phiên thứ 3 (T+2)
    const exitPrice = history.length >= 3 ? history[2].close : history[history.length - 1].close;
    const actualReturn = (exitPrice - entryPrice) / entryPrice;

    // Tính toán độ chính xác
    const error = Math.abs(forecast.expected_return - actualReturn);
    const isCorrectDirection = (forecast.expected_return > 0 && actualReturn > 0) || (forecast.expected_return < 0 && actualReturn < 0);

    return {
      forecast: {
        ...forecast.toObject(),
        expected_return_str: (forecast.expected_return * 100).toFixed(2) + '%',
        uncertainty: Math.abs(forecast.risk_var || forecast.adjusted_uncertainty || forecast.base_uncertainty || 0),
        uncertainty_str: '±' + Math.abs((forecast.risk_var || forecast.adjusted_uncertainty || forecast.base_uncertainty || 0) * 100).toFixed(2) + '%'
      },
      actual: {
        entry_price: entryPrice,
        exit_price: exitPrice,
        actual_return: actualReturn,
        actual_return_str: (actualReturn * 100).toFixed(2) + '%',
        exit_date: history.length >= 3 ? history[2].date : history[history.length-1].date
      },
      accuracy: {
        error_margin: (error * 100).toFixed(2) + '%',
        direction_hit: isCorrectDirection,
        score: Math.max(0, 100 - (error * 500)).toFixed(0) // Điểm số vui vẻ 0-100
      }
    };
  }
};
