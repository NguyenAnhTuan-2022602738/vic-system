"""
Các route API cho phân tích tin tức.
Bao gồm: phân tích đơn lẻ, phân tích hàng loạt, lấy tin mới nhất.
"""

from fastapi import APIRouter, Depends
from app.api.schemas.news_schema import (
    NewsAnalyzeRequest,
    NewsAnalyzeResponse,
    AdjustedForecastRequest,
    AdjustedForecastResponse,
)
from app.core.dependencies import get_news_service, get_forecast_service
from app.services.news_service import NewsService
from app.services.forecast_service import ForecastService

router = APIRouter()


@router.post("/news/analyze", response_model=NewsAnalyzeResponse)
async def analyze_news(
    request: NewsAnalyzeRequest,
    service: NewsService = Depends(get_news_service),
):
    """
    Phân tích tin tức để đánh giá tâm lý và mức ảnh hưởng.
    Sử dụng cache — gọi LLM chỉ khi chưa có kết quả.
    """
    result = service.analyze(text=request.text)
    return NewsAnalyzeResponse(success=True, data=result)


@router.post("/news/batch")
async def analyze_news_batch(
    request: dict,
    service: NewsService = Depends(get_news_service),
):
    """
    Phân tích hàng loạt danh sách tin tức.
    Nhận danh sách articles, trả kết quả phân tích cho từng bài.
    """
    articles = request.get("articles", [])
    results = service.analyze_batch(articles)
    return {"success": True, "data": results}


@router.get("/news/latest")
async def get_latest_news(
    limit: int = 5,
    force_refresh: bool = False,
    service: NewsService = Depends(get_news_service),
):
    """
    Lấy và phân tích tin tức VIC mới nhất.
    Tự động scrape từ các nguồn tin và chạy phân tích tâm lý.
    """
    results = service.fetch_and_analyze(limit=limit, force_refresh=force_refresh)
    return {"success": True, "data": results, "count": len(results)}


@router.post("/news/backfill")
async def backfill_news(
    request: dict,
    service: NewsService = Depends(get_news_service),
):
    """
    Kéo bù tin tức lịch sử cho một ngày cụ thể (Flashback Mode).
    """
    target_date = request.get("target_date")
    if not target_date:
        return {"success": False, "message": "Missing target_date"}
        
    results = service.backfill_historical_news(target_date)
    return {"success": True, "data": results, "count": len(results)}


from app.core.logger import logger

@router.post("/forecast/adjusted", response_model=AdjustedForecastResponse)
async def get_sandbox_adjusted_forecast(
    request: AdjustedForecastRequest,
    news_service: NewsService = Depends(get_news_service),
    forecast_service: ForecastService = Depends(get_forecast_service),
):
    """
    Tạo dự báo đã điều chỉnh theo tâm lý tin tức giả lập (Sandbox Mode).
    """
    try:
        logger.info(f"[Sandbox] Bắt đầu chạy kịch bản: {request.news_text[:50]}...")
        
        # 1. Lấy dự báo kỹ thuật gốc (Original) - dùng cache nếu có
        original = forecast_service.predict(horizon=request.horizon, force_refresh=False)
        
        # 2. Phân tích kịch bản tin tức
        sentiment_result = news_service.analyze(text=request.news_text)
        manual_score = sentiment_result["sentiment_score"]
        
        # 3. Chạy dự báo đã điều chỉnh (Adjusted)
        adjusted = forecast_service.predict(
            horizon=request.horizon,
            manual_sentiment=manual_score
        )
        
        # 4. Đóng gói dữ liệu khớp 100% với AdjustedForecastData schema
        data = {
            "original_mu": original["expected_return"],
            "original_sigma": original["uncertainty"],
            "adjusted_mu": adjusted["expected_return"],
            "adjusted_sigma": adjusted["uncertainty"],
            "sentiment_score": manual_score,
            "impact_weight": 0.5, # Mặc định cho kịch bản giả lập
            "probability_gain": adjusted["probability_gain"],
            "var_95": adjusted["var_95"],
            "recommendation": adjusted["recommendation"]
        }
        
        logger.info(f"[Sandbox] Chạy thành công. Adjusted Mu: {data['adjusted_mu']}")
        return AdjustedForecastResponse(success=True, data=data)

    except Exception as e:
        logger.error(f"[Sandbox] Lỗi nghiêm trọng: {str(e)}", exc_info=True)
        return AdjustedForecastResponse(success=False, data=None) # Lỗi sẽ được bắt ở Frontend
