import re
import unicodedata
from app.infrastructure.mongodb import mongodb
from datetime import datetime, timezone, timedelta
from app.core.logger import logger

class NewsRepository:
    """Quản lý lưu trữ và truy vấn tin tức vĩnh viễn."""
    
    def __init__(self):
        self.collection_name = "news"

    def _normalize_title(self, title: str) -> str:
        """Chuẩn hóa tiêu đề: bỏ dấu, lowercase, xóa ký tự đặc biệt."""
        if not title: return ""
        # Bỏ dấu tiếng Việt
        title = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode('utf-8')
        # Chuyển thường và xóa ký tự đặc biệt
        title = title.lower()
        title = re.sub(r'[^a-z0-9\s]', '', title)
        # Xóa khoảng trắng thừa
        return " ".join(title.split())

    async def save_news(self, news_items: list[dict]):
        """Lưu danh sách tin tức vào DB, bao gồm lọc trùng lặp thông minh."""
        db = mongodb.get_db()
        collection = db[self.collection_name]
        
        saved_count = 0
        updated_count = 0
        skipped_count = 0
        
        now = datetime.now(timezone.utc)
        since_24h = now - timedelta(hours=24)
        
        for item in news_items:
            try:
                title = item.get("title", "")
                norm_title = self._normalize_title(title)
                url = item.get("url", "")
                
                # 1. Kiểm tra trùng lặp tiêu đề trong 24h qua
                # Tìm bài báo có cùng tiêu đề chuẩn hóa nhưng URL khác nhau
                duplicate = await collection.find_one({
                    "normalized_title": norm_title,
                    "published_at": {"$gte": since_24h.isoformat()},
                    "url": {"$ne": url}
                })
                
                if duplicate:
                    # logger.debug(f"Bỏ qua tin trùng lặp tiêu đề: {title[:50]}...")
                    skipped_count += 1
                    continue

                # 2. Thực hiện Upsert dựa trên URL
                update_data = {k: v for k, v in item.items() if k != "_id"}
                update_data["normalized_title"] = norm_title
                update_data["updated_at"] = now
                
                result = await collection.update_one(
                    {"url": url},
                    {"$set": update_data},
                    upsert=True
                )
                
                if result.upserted_id:
                    saved_count += 1
                elif result.modified_count > 0:
                    updated_count += 1
            except Exception as e:
                logger.error(f"Lỗi khi lưu bài tin {item.get('title')}: {e}")
        
        if saved_count > 0 or updated_count > 0 or skipped_count > 0:
            logger.info(f"💾 Tin tức: +{saved_count} mới, ~{updated_count} cập nhật, -{skipped_count} trùng bài.")
        return saved_count + updated_count

    async def get_latest_news(self, limit: int = 10, page: int = 1, category: str = None, hours_limit: int = None):
        """Lấy tin tức mới nhất từ DB, có hỗ trợ phân trang (Pagination)."""
        db = mongodb.get_db()
        collection = db[self.collection_name]
        
        query = {}
        if category:
            query["category"] = category
            
        if hours_limit:
            since = datetime.now(timezone.utc) - timedelta(hours=hours_limit)
            query["published_at"] = {"$gte": since.isoformat()}
            
        # Tính toán phân trang
        skip = (max(1, page) - 1) * limit
        
        cursor = collection.find(query).sort("published_at", -1).skip(skip).limit(limit)
        items = await cursor.to_list(length=limit)
        total = await collection.count_documents(query)
        
        return items, total

    async def count_news(self):
        """Đếm tổng số tin tức đang có."""
        db = mongodb.get_db()
        return await db[self.collection_name].count_documents({})
