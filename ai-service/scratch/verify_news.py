import asyncio
from app.infrastructure.mongodb import mongodb

async def check():
    mongodb.connect()
    db = mongodb.get_db()
    count = await db['news'].count_documents({})
    print(f"COUNT: {count}")
    item = await db['news'].find_one({"sentiment_score": {"$exists": True}})
    if item:
        print(f"HAS_SCORE: True")
        print(f"SCORE: {item.get('sentiment_score')}")
        print(f"DATE: {item.get('published_at')}")
    else:
        print("HAS_SCORE: False")

if __name__ == "__main__":
    asyncio.run(check())
