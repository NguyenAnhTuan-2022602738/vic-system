import asyncio
from app.infrastructure.mongodb import mongodb
from app.core.logger import logger

async def clear_news():
    """Xóa toàn bộ tin tức trong Database."""
    try:
        mongodb.connect()
        db = mongodb.get_db()
        collection = db["news"]
        
        count = await collection.count_documents({})
        if count > 0:
            result = await collection.delete_many({})
            logger.info(f"🗑️ Đã xóa sạch {result.deleted_count} bài tin trong Database.")
        else:
            logger.info("ℹ️ Database đã trống, không có gì để xóa.")
            
    except Exception as e:
        logger.error(f"❌ Lỗi khi xóa Database: {e}")
    finally:
        # Không đóng connection vì script có thể chạy trong context khác
        pass

if __name__ == "__main__":
    asyncio.run(clear_news())
