/**
 * Dịch vụ tin tức — proxy tới AI service và lưu cache MongoDB.
 */

import crypto from 'crypto';
import { requestNewsAnalysis, requestLatestNews, requestNewsBackfill } from '../../integrations/ai_client.js';
import { NewsCache } from './news.repository.js';

export const newsService = {
  /**
   * @param {boolean} force - Ép cào mới (bypass cache) hay không
   * @param {number} page - Số trang
   */
  async getLatest(limit = 10, force = false, page = 1) {
    const skip = (page - 1) * limit;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Kiểm tra dữ liệu hiện có trong MongoDB của Backend
    const localNewsCount = await NewsCache.countDocuments();
    const localNews = await NewsCache.find()
      .sort({ published_at: -1 })
      .skip(skip)
      .limit(limit);

    // Xác định xem có cần gọi Robot (AI Service) không?
    // Cần gọi khi: force=true HOẶC (Trang 1 và hết hạn) HOẶC (Trang này chưa có dữ liệu trong Backend)
    const needsSync = force || 
                     (page === 1 && (localNews.length === 0 || localNews[0].updatedAt < twentyFourHoursAgo)) ||
                     (localNews.length === 0 && localNewsCount > 0 && skip < 100); // Thử lấy thêm nếu chưa quá sâu

    if (!needsSync && localNews.length > 0) {
      console.log(`[NewsService] 🏠 Phục vụ Trang ${page} trực tiếp từ Backend DB (${localNews.length} tin).`);
      return {
        news: localNews.map(n => ({
          ...n.toObject(),
          id: n._id.toString(),
          title: n.title,
          summary: n.reasoning,
          timestamp: n.published_at || n.updated_at,
          time_display: this.getTimeDisplay(n.published_at || n.updated_at)
        })),
        total_count: localNewsCount,
        page: page
      };
    }

    // 2. Đồng bộ từ Robot (AI Service)
    try {
      console.log(`[NewsService] 📡 Đồng bộ dữ liệu từ Robot cho Trang ${page}...`);
      const response = await requestLatestNews(limit, force, page);
      // requestLatestNews đã trả về trực tiếp response.data từ axios, nên response chính là payload
      const apiResult = response || {}; 
      const newsFromAI = apiResult.news || [];
      const totalCount = apiResult.total_count || localNewsCount;

      // AI Service ĐÃ tự động lưu vào bảng `news` rồi. 
      // Web-Backend chỉ việc nhận và trả về cho client, không cần save lại nữa (để tránh lặp dữ liệu và xung đột ID).

      // Trả về kết quả sau khi đã đồng bộ
      return {
        news: newsFromAI.map(n => ({
          ...n,
          title: n.title,
          summary: n.reasoning,
          timestamp: n.timestamp,
          time_display: this.getTimeDisplay(n.timestamp || new Date())
        })),
        total_count: totalCount,
        page: page
      };

    } catch (error) {
      console.error('[NewsService] ❌ Lỗi đồng bộ từ Robot:', error.message);
      // Fallback: Trả về những gì đang có trong database nội bộ
      return {
        news: localNews.map(n => ({
          ...n.toObject(),
          id: n._id.toString(),
          title: n.title,
          summary: n.reasoning,
          timestamp: n.published_at || n.updated_at,
          time_display: this.getTimeDisplay(n.published_at || n.updated_at)
        })),
        total_count: localNewsCount,
        page: page
      };
    }
  },

  /**
   * Phân tích tin tức — kiểm tra cache trước, gọi AI nếu cần.
   * @param {string} text - Nội dung tin tức
   */
  async analyze(text) {
    const textHash = crypto.createHash('md5').update(text).digest('hex');

    // Kiểm tra cache MongoDB
    const cached = await NewsCache.findOne({ text_hash: textHash });
    if (cached) {
      return {
        sentiment_score: cached.sentiment_score,
        impact_weight: cached.impact_weight,
        summary: cached.summary,
        from_cache: true,
      };
    }

    // Gọi AI service
    const response = await requestNewsAnalysis(text);
    const data = response.data;

    // Lưu vào cache MongoDB (tự xóa sau 24h nhờ TTL index)
    await NewsCache.create({
      text_preview: text.substring(0, 500),
      text_hash: textHash,
      sentiment_score: data.sentiment_score,
      impact_weight: data.impact_weight,
      summary: data.summary,
    });

    return { ...data, from_cache: false };
  },

  /**
   * Tính toán chuỗi thời gian hiển thị (X phút trước,...)
   */
  getTimeDisplay(publishedAt) {
    const now = new Date();
    const diff = now - new Date(publishedAt);
    const seconds = Math.floor(diff / 1000);

    if (isNaN(diff)) return 'vừa xong';
    if (seconds < 60) return 'vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    return `${Math.floor(seconds / 86400)} ngày trước`;
  },

  /**
   * Lấy tin tức mới nhất đã phân tích từ cache.
   * @param {number} limit - Số lượng tối đa
   */
  async getRecent(limit = 10) {
    const news = await NewsCache.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-text_hash');
    
    return news.map(n => ({
      ...n.toObject(),
      id: n._id.toString(),
      title: n.text_preview,
      timestamp: n.published_at || n.createdAt,
      time_display: this.getTimeDisplay(n.published_at || n.createdAt)
    }));
  },

  /**
   * Lấy tin tức lịch sử (Point-in-Time).
   * Lọc tất cả tin tức có ngày đăng <= date.
   * Nếu ngày chỉ định chưa có tin, gọi AI để cào bù (Backfill).
   */
  async getHistory(dateString, limit = 10) {
    const targetDate = new Date(dateString);
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    // 1. Kiểm tra xem ngày này đã có tin tức chưa
    const newsCountInRange = await NewsCache.countDocuments({
      published_at: { $gte: dayStart, $lte: dayEnd }
    });

    // 2. Nếu chưa có hoặc quá ít tin ( < 3), kích hoạt Robot cào bù
    if (newsCountInRange < 3) {
      try {
        console.log(`[NewsService] 🕵️‍♂️ Triggering News Backfill for ${dateString}...`);
        const response = await requestNewsBackfill(dateString);
        const newsFromAI = response.data;

        if (Array.isArray(newsFromAI) && newsFromAI.length > 0) {
          // Lưu tin mới cào được vào DB (Upsert)
          const upsertPromises = newsFromAI.map(async (item) => {
            const textHash = crypto.createHash('md5').update(item.title).digest('hex');
            return await NewsCache.findOneAndUpdate(
              { text_hash: textHash },
              {
                text_preview: item.title,
                text_hash: textHash,
                sentiment_score: item.sentiment_score || 0,
                impact_weight: item.impact_weight || 1.0,
                source: item.source || "CafeF (Past)",
                url: item.url,
                published_at: item.timestamp ? new Date(item.timestamp) : new Date(dateString),
              },
              { upsert: true }
            );
          });
          await Promise.all(upsertPromises);
          console.log(`[NewsService] ✅ Backfill complete. Added ${newsFromAI.length} articles.`);
        }
      } catch (error) {
        console.error(`[NewsService] ❌ Backfill failed for ${dateString}:`, error.message);
      }
    }

    // 3. Lấy dữ liệu cuối cùng (bao gồm cả tin vừa cào bù)
    const news = await NewsCache.find({
      published_at: { $lte: dayEnd }
    })
      .sort({ published_at: -1 })
      .limit(limit);
    
    return news.map(n => ({
      ...n.toObject(),
      id: n._id.toString(),
      title: n.text_preview,
      timestamp: n.published_at || n.createdAt,
      time_display: this.getTimeDisplay(n.published_at || n.createdAt)
    }));
  },
};
