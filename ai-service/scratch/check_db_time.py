import asyncio
from app.infrastructure.mongodb import mongodb

async def check_data():
    mongodb.connect()
    db = mongodb.get_db()
    cursor = db['news'].find().sort("published_at", -1).limit(5)
    async for item in cursor:
        print("-" * 50)
        print(f"Title: {item.get('title')}")
        print(f"Published_at (Stored): {item.get('published_at')}")
        print(f"URL: {item.get('url')[:50]}...")

if __name__ == "__main__":
    asyncio.run(check_data())
