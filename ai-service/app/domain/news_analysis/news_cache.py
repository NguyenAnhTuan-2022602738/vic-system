"""
Bộ nhớ đệm (cache) cho kết quả phân tích tin tức.
Tránh gọi LLM lặp lại cho cùng một bài tin.
"""

import hashlib
import json
import os
from datetime import datetime, timedelta
from app.core.logger import logger


# Thư mục lưu cache cục bộ
CACHE_DIR = "cache/news"


def _make_hash(text: str) -> str:
    """Tạo hash từ nội dung tin tức để làm key."""
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def get_cached_analysis(text: str, max_age_hours: int = 24) -> dict | None:
    """
    Lấy kết quả phân tích từ cache nếu còn hạn.

    Tham số:
        text: Nội dung tin tức
        max_age_hours: Thời gian cache tối đa (giờ)

    Trả về:
        Dict kết quả phân tích hoặc None nếu cache miss
    """
    cache_key = _make_hash(text)
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")

    if not os.path.exists(cache_file):
        return None

    try:
        with open(cache_file, "r", encoding="utf-8") as f:
            cached = json.load(f)

        # Kiểm tra thời hạn cache
        cached_time = datetime.fromisoformat(cached.get("cached_at", ""))
        if datetime.now() - cached_time > timedelta(hours=max_age_hours):
            logger.info(f"Cache hết hạn cho: {cache_key[:8]}...")
            return None

        logger.info(f"Cache hit: {cache_key[:8]}...")
        return cached.get("result")

    except (json.JSONDecodeError, ValueError, KeyError):
        return None


def save_to_cache(text: str, result: dict) -> None:
    """
    Lưu kết quả phân tích vào cache.

    Tham số:
        text: Nội dung tin tức
        result: Kết quả phân tích (sentiment, impact, v.v.)
    """
    os.makedirs(CACHE_DIR, exist_ok=True)

    cache_key = _make_hash(text)
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")

    cache_data = {
        "text_preview": text[:100],
        "result": result,
        "cached_at": datetime.now().isoformat(),
    }

    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2)

    logger.info(f"Đã lưu cache: {cache_key[:8]}...")
