import motor.motor_asyncio
from app.core.config import settings
from app.core.logger import logger

class MongoDB:
    """Quản lý kết nối tập trung tới MongoDB Atlas."""
    
    def __init__(self):
        self.client = None
        self.db = None

    def connect(self):
        """Khởi tạo kết nối."""
        if self.client is None:
            try:
                self.client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
                self.db = self.client[settings.DATABASE_NAME]
                logger.info("✅ Đã kết nối MongoDB Atlas thành công (AI Service)")
            except Exception as e:
                logger.error(f"❌ Lỗi kết nối MongoDB: {e}")
                raise e
        return self.db

    def get_db(self):
        """Lấy instance database."""
        if self.db is None:
            return self.connect()
        return self.db

# Singleton instance
mongodb = MongoDB()
