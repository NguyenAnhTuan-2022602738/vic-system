/**
 * Dịch vụ tin tức — proxy tới AI service và lưu cache MongoDB.
 */

import crypto from 'crypto';
import { requestNewsAnalysis, requestLatestNews, requestNewsBackfill } from '../../integrations/ai_client.js';
import { NewsCache } from './news.repository.js';

export const newsService = {
  /**
   * Lấy tin tức mới nhất - Ưu tiên lấy từ cache MongoDB, nếu cũ hoặc ép buộc mới gọi AI.
   * @param {number} limit - Số lượng tin tức
   * @param {boolean} force - Ép cào mới (bypass cache) hay không
   */
  async getLatest(limit = 10, force = false) {
    // 1. Kiểm tra tin tức trong cache (trong vòng 24 giờ qua, bỏ qua nếu force=true)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cachedNews = !force ? await NewsCache.find({ 
      updatedAt: { $gte: twentyFourHoursAgo } 
    }).sort({ published_at: -1 }).limit(limit) : [];

    if (!force && cachedNews.length > 0) {
      console.log(`[NewsService] 🚀 Lấy ${cachedNews.length} tin từ MongoDB Cache trong 200ms.`);
      // Có đủ tin mới trong cache
      return cachedNews.map(n => ({
        ...n.toObject(),
        id: n._id.toString(),
        title: n.text_preview,
        timestamp: n.published_at || n.createdAt,
        time_display: this.getTimeDisplay(n.published_at || n.createdAt)
      }));
    }

    // 2. Nếu không đủ, cũ hoặc force=true, gọi AI service để quét RSS mới
    try {
      console.log(`[NewsService] Calling AI Service (limit: ${limit}, force: ${force})...`);
      const response = await requestLatestNews(limit, force);
      const newsFromAI = response.data; // FastAPI trả về { success, data: [...] }
      
      console.log(`[NewsService] News array length: ${newsFromAI?.length || 0}`);

      if (!Array.isArray(newsFromAI) || newsFromAI.length === 0) {
        console.warn('[NewsService] No news to cache or invalid format.');
        return await NewsCache.find().sort({ published_at: -1 }).limit(limit);
      }

      // 3. Lưu/Cập nhật vào MongoDB (Upsert)
      const newsPromises = newsFromAI.map(async (item) => {
        try {
          const articleTitle = item.title || item.text_preview || "Tin tức VIC (Cập nhật...)";
          const textHash = crypto.createHash('md5').update(articleTitle).digest('hex');
          
          return await NewsCache.findOneAndUpdate(
            { text_hash: textHash },
            {
              text_preview: articleTitle.substring(0, 500),
              text_hash: textHash,
              sentiment_score: item.sentiment_score || 0,
              impact_weight: item.impact_weight || 1.0,
              source: item.source || "Thi trường",
              url: item.url,
              published_at: item.timestamp ? new Date(item.timestamp) : new Date(),
            },
            { upsert: true, new: true }
          );
        } catch (e) {
          console.error(`[NewsService] Failed to upsert article:`, e.message);
          return null;
        }
      });

      await Promise.all(newsPromises);

      // Trả về dữ liệu mới nhất từ DB để đồng bộ format
      const finalNews = await NewsCache.find().sort({ published_at: -1 }).limit(limit);
      return finalNews.map(n => ({
        ...n.toObject(),
        id: n._id.toString(),
        title: n.text_preview,
        timestamp: n.published_at || n.createdAt,
        time_display: this.getTimeDisplay(n.published_at || n.createdAt)
      }));
    } catch (error) {
      console.error('Error fetching/caching news:', error);
      // Nếu lỗi AI Service, cố gắng trả về dữ liệu cũ nhất có thể
      const fallbackNews = await NewsCache.find().sort({ published_at: -1 }).limit(limit);
      return fallbackNews.map(n => ({
        ...n.toObject(),
        id: n._id.toString(),
        title: n.text_preview,
        timestamp: n.published_at || n.createdAt,
        time_display: this.getTimeDisplay(n.published_at || n.createdAt)
      }));
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
