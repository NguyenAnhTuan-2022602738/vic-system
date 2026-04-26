import asyncio
from app.infrastructure.mongodb import mongodb

async def check():
    mongodb.connect()
    db = mongodb.get_db()
    count = await db['news'].count_documents({})
    print(f"TOTAL_NEWS_IN_DB: {count}")
    
    if count > 0:
        item = await db['news'].find_one()
        print(f"SAMPLE_TITLE: {item.get('title')}")
        print(f"PUBLISHED_AT: {item.get('published_at')}")

if __name__ == "__main__":
    asyncio.run(check())
