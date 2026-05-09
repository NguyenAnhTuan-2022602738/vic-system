"""
Các route API cho dự báo.
"""

from fastapi import APIRouter, Depends
from app.api.schemas.forecast_schema import ForecastRequest, ForecastResponse, MultiHorizonResponse, PerformanceResponse, FlashbackRequest
from app.core.dependencies import get_forecast_service
from app.services.forecast_service import ForecastService
from app.services.pipeline_service import PipelineService
from typing import Any, Dict
from pydantic import BaseModel

class PipelineResponse(BaseModel):
    success: bool
    data: Dict[str, Any]

router = APIRouter()

@router.post("/forecast/pipeline", response_model=PipelineResponse)
async def trigger_forecast_pipeline():
    """
    Thực thi 1 lần pipeline cập nhật giá, tin tức và dự báo mô hình để kết luận tự động T+2.
    """
    svc = PipelineService()
    result = await svc.run_pipeline()
    return PipelineResponse(success=True, data=result)

@router.post("/forecast", response_model=ForecastResponse)
async def create_forecast(
    request: ForecastRequest,
    service: ForecastService = Depends(get_forecast_service),
):
    """
    Tạo dự báo xác suất cho cổ phiếu VIC.
    """
    result = await service.predict(
        horizon=request.horizon,
        target_return=request.target_return or 0.05,
        alpha=request.alpha or 0.05,
        beta=request.beta or 0.2
    )
    return ForecastResponse(success=True, data=result)


@router.post("/forecast/backfill", response_model=ForecastResponse)
async def backfill_forecast(
    request: FlashbackRequest,
    service: ForecastService = Depends(get_forecast_service),
):
    """
    Tạo dự báo bù cho một ngày trong quá khứ (Backfill).
    """
    result = await service.predict(
        horizon=request.horizon,
        target_return=request.target_return or 0.05,
        alpha=request.alpha or 0.05,
        beta=request.beta or 0.2,
        manual_sentiment=request.manual_sentiment,
        base_date=request.base_date,
        force_refresh=True # Luôn chạy mới khi backfill
    )
    return ForecastResponse(success=True, data=result)


@router.get("/forecast/multi-horizon", response_model=MultiHorizonResponse)
async def get_multi_horizon_forecast(
    target_return: float = 0.05,
    service: ForecastService = Depends(get_forecast_service),
):
    """Lấy dự báo cho nhiều khung thời gian (1, 3, 5, 7, 10, 14, 21 ngày)."""
    horizons = [1, 3, 5, 7, 10, 14, 21]
    results = await service.predict_multi_horizon(horizons=horizons, target_return=target_return)
    return MultiHorizonResponse(success=True, data={"horizons": results})


@router.get("/forecast/performance", response_model=PerformanceResponse)
async def get_strategy_performance(
    days: int = 30,
    service: ForecastService = Depends(get_forecast_service),
):
    """Lấy dữ liệu hiệu suất chiến thuật so với benchmark thông qua backtest."""
    result = service.get_performance_metrics(days=days)
    return PerformanceResponse(success=True, data=result)

