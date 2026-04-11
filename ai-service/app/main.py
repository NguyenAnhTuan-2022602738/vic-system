"""
VIC AI Service — Ứng dụng FastAPI
Hệ thống Dự báo Xác suất Có điều kiện Đa phương thức
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logger import logger
from app.api.routes import forecast, news, health, market


def create_app() -> FastAPI:
    """Tạo và cấu hình ứng dụng FastAPI."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Hệ thống Dự báo Lợi nhuận Cổ phiếu VIC",
    )

    # Cấu hình CORS cho phép frontend truy cập
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Đăng ký các route
    app.include_router(health.router, tags=["Health"])
    app.include_router(forecast.router, prefix="/api/v1", tags=["Forecast"])
    app.include_router(news.router, prefix="/api/v1", tags=["News"])
    app.include_router(market.router, prefix="/api/v1", tags=["Market (Phase 05)"])

    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} đã khởi động")

    return app


app = create_app()
