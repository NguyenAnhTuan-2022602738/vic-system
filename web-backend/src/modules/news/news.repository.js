/**
 * Repository cache tin tức — Mongoose model cho lưu trữ kết quả phân tích.
 * Tránh gọi lại AI service cho cùng một bài tin.
 */

import mongoose from 'mongoose';

const newsCacheSchema = new mongoose.Schema(
  {
    // Nội dung tin tức (cắt 500 ký tự đầu để tiết kiệm)
    text_preview: { type: String, required: true },
    // Hash MD5 của nội dung đầy đủ — dùng làm key tìm kiếm
    text_hash: { type: String, required: true, unique: true, index: true },
    // Kết quả phân tích
    sentiment_score: { type: Number, required: true },
    impact_weight: { type: Number, required: true },
    summary: { type: String },
    // Nguồn tin
    source: { type: String },
    url: { type: String },
    // Thời gian công bố gốc của bài báo
    published_at: { type: Date },
    // Thời gian hết hạn cache — mặc định 48 giờ để lưu trữ được lâu hơn
    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

export const NewsCache = mongoose.model('NewsCache', newsCacheSchema);
