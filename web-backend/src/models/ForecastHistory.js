import mongoose from 'mongoose';

const forecastHistorySchema = new mongoose.Schema({
  symbol: { type: String, default: 'VIC', required: true },
  timestamp: { type: Date, default: Date.now },
  target_date: { type: Date, required: true }, // Ngày hiệu lực của dự báo T+2 (sau 3 phiên)
  horizon: { type: Number, default: 3 }, // 3 ngày
  
  // Kết quả từ AI (LSTM Model)
  expected_return: { type: Number, required: true }, // % LN kỳ vọng (Sau điều chỉnh)
  lstm_prediction: { type: Number, default: 0 }, // % LN dự báo gốc từ LSTM
  base_uncertainty: { type: Number, default: 0.02 }, // Sigma gốc
  adjusted_uncertainty: { type: Number, default: 0.03 }, // Sigma sau điều chỉnh
  risk_var: { type: Number, required: true }, // VaR 95%
  win_rate: { type: Number, required: true }, // Xác suất Gain
  sharpe_ratio: { type: Number, required: true },
  impact_weight: { type: Number, default: 0.15 }, // Trọng số ảnh hưởng của tin tức
  
  // Kết quả phân tích tin tức (Sentiment)
  sentiment_score: { type: Number, required: true }, // Từ -1 đến 1
  
  // Quyết định cuối cùng sau Fusion
  final_action: { type: String, enum: ['BUY', 'SELL', 'HOLD', 'AVOID', 'WATCH'], required: true },
  confidence: { type: Number, required: true }, // Độ tự tin của quyết định cuối cùng

  // Mục tiêu hành động (Mới bổ sung)
  stop_loss: { type: Number, default: 0 },
  take_profit: { type: Number, default: 0 },
  data_points_used: { type: Number, default: 60 },
  last_price_used: { type: Number, required: true }, // Giá đóng cửa T-1
  latest_news_analyzed: { type: Number, default: 0 }, // Số bài báo được quét
  
  // Dữ liệu so sánh đa mô hình (MỚI)
  comparison_data: [{
    name: { type: String },
    expected_return: { type: Number },
    mae: { type: Number }
  }]

}, {
  timestamps: true // Tự động có createdAt, updatedAt
});

// Index để load trang nhanh nhất lấy ngày gần đây
forecastHistorySchema.index({ timestamp: -1 });

const ForecastHistory = mongoose.model('ForecastHistory', forecastHistorySchema);
export default ForecastHistory;
