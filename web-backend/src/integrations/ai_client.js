/**
 * Client HTTP giao tiếp với AI Service.
 * Kết nối với dịch vụ AI Python qua REST API.
 */

import axios from 'axios';
import { env } from '../config/env.js';

const aiClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Gửi yêu cầu dự báo tới dịch vụ AI.
 * @param {object} params - Các tham số dự báo
 * @returns {Promise<object>} Dữ liệu dự báo
 */
export const requestForecast = async ({ horizon, target_return = 0.05, alpha = 0.05, beta = 0.2 }) => {
  const response = await aiClient.post('/api/v1/forecast', {
    horizon,
    target_return,
    alpha,
    beta,
  });
  return response.data;
};

/**
 * Lấy tin tức mới nhất từ dịch vụ AI.
 * @param {number} limit - Số lượng tin tức
 * @param {boolean} forceRefresh - Ép cào mới (bypass cache) hay không
 * @returns {Promise<object>} Danh sách tin tức kèm cảm xúc
 */
export const requestLatestNews = async (limit = 5, forceRefresh = false) => {
  const response = await aiClient.get('/api/v1/news/latest', {
    params: { limit, force_refresh: forceRefresh },
  });
  return response.data;
};

/**
 * Gửi yêu cầu phân tích tin tức tới dịch vụ AI.
 * @param {string} text - Nội dung tin tức cần phân tích
 * @returns {Promise<object>} Dữ liệu phân tích tâm lý
 */
export const requestNewsAnalysis = async (text) => {
  const response = await aiClient.post('/api/v1/news/analyze', { text });
  return response.data;
};

/**
 * Gửi yêu cầu dự báo đã điều chỉnh tới dịch vụ AI.
 * @param {number} horizon - Số ngày dự báo
 * @param {string} newsText - Nội dung tin tức để điều chỉnh
 * @returns {Promise<object>} Dữ liệu dự báo đã điều chỉnh
 */
export const requestAdjustedForecast = async (horizon, newsText) => {
  const response = await aiClient.post('/api/v1/forecast/adjusted', {
    horizon,
    news_text: newsText,
  });
  return response.data;
};

/**
 * Gửi yêu cầu dự báo quá khứ (Backfill) tới dịch vụ AI.
 * @param {object} params - Các tham số dự báo kèm base_date
 */
export const requestBackfill = async ({ 
  base_date, 
  horizon = 3, 
  target_return = 0.05, 
  alpha = 0.05, 
  beta = 0.2,
  manual_sentiment = null 
}) => {
  const response = await aiClient.post('/api/v1/forecast/backfill', {
    base_date,
    horizon,
    target_return,
    alpha,
    beta,
    manual_sentiment
  });
  return response.data;
};

/**
 * Gửi yêu cầu kéo bù tin tức lịch sử tới dịch vụ AI.
 * @param {string} date - Ngày cần cào bù (YYYY-MM-DD)
 */
export const requestNewsBackfill = async (date) => {
  const response = await aiClient.post('/api/v1/news/backfill', {
    target_date: date
  });
  return response.data;
};

/**
 * Lấy lịch sử thị trường (Hỗ trợ lọc theo mốc thời gian).
 */
export const requestMarketHistory = async (start_date = '2024-01-01', end_date = null) => {
  const response = await aiClient.get('/api/v1/market/history', {
    params: { start_date, end_date },
  });
  return response.data;
};

/**
 * Lấy dự báo cho nhiều khung thời gian.
 */
export const requestMultiHorizonForecast = async (target_return = 0.05) => {
  const response = await aiClient.get('/api/v1/forecast/multi-horizon', {
    params: { target_return },
  });
  return response.data;
};

/**
 * Lấy hiệu suất chiến thuật.
 */
export const requestPerformanceMetrics = async () => {
  const response = await aiClient.get('/api/v1/forecast/performance');
  return response.data;
};

/**
 * Lấy Volume Profile.
 */
export const requestVolumeProfile = async (bins = 10) => {
  const response = await aiClient.get('/api/v1/market/volume-profile', {
    params: { bins },
  });
  return response.data;
};

/**
 * Gọi luồng Pipeline tự động cập nhật dữ liệu và dự báo T+2.
 */
export const requestForecastPipeline = async () => {
  const response = await aiClient.post('/api/v1/forecast/pipeline', {}, { timeout: 60000 }); // Pipeline có thể lâu do crawl
  return response.data;
};

export default aiClient;
