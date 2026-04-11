"""
Dependency Injection cho FastAPI.
Quản lý các service singleton.
"""

from app.services.forecast_service import ForecastService
from app.services.news_service import NewsService


# Các instance singleton
_forecast_service: ForecastService | None = None
_news_service: NewsService | None = None


def get_forecast_service() -> ForecastService:
    """Lấy hoặc tạo ForecastService singleton."""
    global _forecast_service
    if _forecast_service is None:
        _forecast_service = ForecastService()
    return _forecast_service


def get_news_service() -> NewsService:
    """Lấy hoặc tạo NewsService singleton."""
    global _news_service
    if _news_service is None:
        _news_service = NewsService()
    return _news_service
