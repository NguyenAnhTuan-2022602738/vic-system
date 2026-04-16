/**
 * VIC Web Backend — Ứng dụng Express
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import http from 'node:http';
import { Server } from 'socket.io';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error_handler.js';
import { marketRelayService } from './integrations/market_relay.service.js';
import forecastRoutes from './modules/forecast/forecast.routes.js';
import newsRoutes from './modules/news/news.routes.js';
import tradeRoutes from './modules/trade/trade.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import marketRoutes from './modules/market/market.routes.js';
import assistantRoutes from './modules/assistant/assistant.routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Khởi tạo Socket.io với cấu hình CORS đồng nhất
const ioServer = new Server(server, {
  cors: {
    origin: env.CORS_ORIGINS,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({ origin: env.CORS_ORIGINS }));
app.use(express.json());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, // Tăng lên 1000 để Dashboard dữ liệu lớn chạy mượt
  })
);

// Đăng ký các route
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', service: 'vic-web-backend' } });
});

app.use('/api/v1/forecast', forecastRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/trades', tradeRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/market', marketRoutes);
app.use('/api/v1/assistant', assistantRoutes);

// Middleware xử lý lỗi (phải đặt cuối cùng)
app.use(errorHandler);

// Quản lý Socket.io connections
ioServer.on('connection', (socket) => {
  console.log(`🔌 Một client đã kết nối Socket: ${socket.id}`);
  
  socket.on('disconnect', () => {
    // console.log(`🔌 Client đã ngắt kết nối: ${socket.id}`);
  });
});

// Khởi động server
const start = async () => {
  await connectDatabase();
  
  // Khởi động trạm trung chuyển VNDIRECT
  marketRelayService.start(ioServer);

  server.listen(env.PORT, () => {
    console.log(`🚀 VIC Web Backend đang chạy tại port ${env.PORT}`);
    console.log(`📡 WebSocket Server sẵn sàng phục vụ!`);
  });
};

start().catch(console.error);

export default app;
