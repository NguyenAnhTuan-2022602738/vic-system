/**
 * Kết nối MongoDB qua Mongoose.
 */

import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = async () => {
  try {
    // Thử kết nối thật
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Đã kết nối MongoDB');
  } catch (error) {
    console.error('⚠️ Kết nối MongoDB thất bại:', error.message);
    console.log('💡 Đang chạy ở chế độ MOCK DATABASE (Dữ liệu sẽ không được lưu).');
    // Không exit(1) để hệ thống vẫn chạy được các phần khác
  }
};
