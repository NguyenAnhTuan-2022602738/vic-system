import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.append(os.getcwd())

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def debug_news_display():
    print("--- Debugging News Display System ---")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]
    col = db["news"]
    
    # 1. Check total count
    total = await col.count_documents({})
    print(f"1. Total news in DB: {total}")
    
    # 2. Check news in last 24h
    since_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    recent = await col.count_documents({"published_at": {"$gte": since_24h.isoformat()}})
    print(f"2. News in last 24h: {recent}")
    
    # 3. Check categories
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
    cats = await col.aggregate(pipeline).to_list(length=10)
    print(f"3. Content by categories: {cats}")
    
    # 4. Check if news have full_content and reasoning
    v3_news = await col.count_documents({"full_content": {"$exists": True, "$ne": ""}})
    print(f"4. News with Full Content (v3): {v3_news}")
    
    # 5. Check actual latest items
    latest = await col.find().sort("published_at", -1).limit(5).to_list(length=5)
    print("\n--- Top 5 Latest News ---")
    for i, news in enumerate(latest):
        print(f"[{i+1}] {news.get('title')[:60]}... ({news.get('published_at')})")

if __name__ == "__main__":
    asyncio.run(debug_news_display())
