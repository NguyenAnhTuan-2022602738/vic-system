import asyncio
import os
import sys

# Thêm đường dẫn project vào path
sys.path.append(os.getcwd())

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def verify_v3():
    print("--- Dang ket noi toi Database de xac minh News Analyst v3 ---")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]
    col = db["news"]
    
    # Lấy 3 tin mới nhất từ CafeF
    items = await col.find({"source": "CafeF"}).sort("published_at", -1).limit(3).to_list(length=3)
    
    if not items:
        print("!!! Khong tim thay tin tuc nao trong Database !!!")
        return

    print("=== Da tim thay tin tuc moi. Chi tiet cac ban ghi ===")
    for i, item in enumerate(items):
        print(f"\n--- [Bai {i+1}] ---")
        print(f"Tieu de: {item.get('title')}")
        print(f"Thoi gian (ISO): {item.get('published_at')}")
        print(f"Co Full Noi dung: {'CO' if item.get('full_content') else 'KHONG'}")
        
        # In một đoạn nội dung
        content = item.get('full_content', '')
        if content:
            # Clean Vietnamese for terminal display if needed
            print(f"Noi dung (trich): {content[:150]}...")
            
        # In giải thích AI
        print(f"AI Giai thich (Reasoning): {item.get('reasoning', 'Chua co phan tich AI')}")
        print(f"Diem Sentiment: {item.get('sentiment_score', 0.0)}")
        print(f"Loc trung (Normalized): {item.get('normalized_title')[:50]}...")

if __name__ == "__main__":
    asyncio.run(verify_v3())
