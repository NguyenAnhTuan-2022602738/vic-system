/**
 * Repository cache tin tức — Mongoose model cho lưu trữ kết quả phân tích.
 * Tránh gọi lại AI service cho cùng một bài tin.
 */

import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    normalized_title: { type: String, index: true },
    sentiment_score: { type: Number, required: true },
    impact_weight: { type: Number, required: true },
    reasoning: { type: String },
    category: { type: String },
    source: { type: String },
    url: { type: String },
    published_at: { type: Date },
    updated_at: { type: Date }
  },
  { timestamps: false, collection: 'news' } // Chỉ định rõ đọc từ collection 'news' của AI Service
);

export const NewsCache = mongoose.model('News', newsSchema);
