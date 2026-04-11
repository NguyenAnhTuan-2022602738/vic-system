/**
 * Repository cache dự báo — lưu trữ lịch sử dự báo.
 * Dùng cho dashboard thống kê và đánh giá độ chính xác.
 */

import mongoose from 'mongoose';

const forecastCacheSchema = new mongoose.Schema(
  {
    // Tham số dự báo
    horizon: { type: Number, required: true },
    // Kết quả dự báo
    expected_return: { type: Number, required: true },
    uncertainty: { type: Number, required: true },
    probability_gain: { type: Number },
    var_95: { type: Number },
    recommendation: { type: String, enum: ['BUY', 'HOLD', 'AVOID'] },
    // Đã điều chỉnh theo tin tức hay chưa
    is_adjusted: { type: Boolean, default: false },
    sentiment_score: { type: Number, default: null },
    // Tín hiệu giao dịch (Phase 08)
    trading_signal: {
      action: { type: String, enum: ['BUY', 'SELL', 'HOLD'] },
      confidence: { type: Number },
      stop_loss: { type: Number },
      take_profit: { type: Number },
      risk_level: { type: String, enum: ['Low', 'Medium', 'High'] }
    },
    // Lợi nhuận thực tế — cập nhật sau khi hết horizon
    actual_return: { type: Number, default: null },
    // Trạng thái
    status: { type: String, enum: ['pending', 'verified', 'expired'], default: 'pending' },
  },
  { timestamps: true }
);

export const ForecastCache = mongoose.model('ForecastCache', forecastCacheSchema);
