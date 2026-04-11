/**
 * Repository giao dịch — Mongoose model cho nhật ký giao dịch.
 */

import mongoose from 'mongoose';

const tradeLogSchema = new mongoose.Schema(
  {
    entry_date: { type: Date, required: true, default: Date.now },
    symbol: { type: String, default: 'VIC' }, // Mã cổ phiếu
    action: { type: String, enum: ['BUY', 'SELL', 'HOLD'], default: 'BUY' }, // Mã giao dịch
    entry_price: { type: Number, required: true }, // Giá vào lệnh thực tế
    exit_price: { type: Number, default: null }, // Giá thoát lệnh
    stop_loss: { type: Number, default: 0 }, // Cắt lỗ
    take_profit: { type: Number, default: 0 }, // Chốt lời
    quantity: { type: Number, default: 100 }, // Khối lượng
    
    // So sánh với AI
    horizon: { type: Number, required: true },
    predicted_mu: { type: Number, required: true },
    predicted_sigma: { type: Number, required: true },
    
    // Kết quả thực tế
    actual_return: { type: Number, default: null },
    pnl: { type: Number, default: null },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' }, // Trạng thái lệnh
    notes: { type: String, default: '' }, // Ghi chú cá nhân

  },
  {
    timestamps: true,
  }
);

export const TradeLog = mongoose.model('TradeLog', tradeLogSchema);
