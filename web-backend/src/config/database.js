/**
 * Kết nối MongoDB qua Mongoose.
 */

import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = async () => {
  try {
    console.log('📡 Đang kết nối tới MongoDB Atlas...');
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Chờ 10s
    });
    console.log('✅ Đã kết nối MongoDB thành công!');
  } catch (error) {
    console.error('❌ LỖI KẾT NỐI DATABASE:', error.message);
    console.log('💡 GỢI Ý: Kiểm tra whitelist IP trên MongoDB Atlas hoặc đường truyền mạng.');
  }
};

