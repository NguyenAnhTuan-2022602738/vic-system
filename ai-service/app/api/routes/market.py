"""
Routes cho dữ liệu thị trường (Market Data).
"""

from fastapi import APIRouter, HTTPException
from app.api.schemas.forecast_schema import VolumeProfileResponse
from app.services.market_data_service import MarketDataService
from app.core.logger import logger

router = APIRouter()
market_service = MarketDataService()

@router.get("/market/history")
async def get_market_history(start_date: str = "2024-01-01"):
    """Lấy dữ liệu lịch sử VIC kèm chỉ báo kỹ thuật."""
    try:
        data = market_service.get_enriched_history(start_date)
        return {
            "success": True,
            "symbol": "VIC",
            "count": len(data),
            "data": data
        }
    except Exception as e:
        logger.error(f"API Error in /market/history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market/volume-profile", response_model=VolumeProfileResponse)
async def get_volume_profile(bins: int = 10):
    """Lấy dữ liệu Volume Profile chia theo price bins."""
    try:
        data = market_service.get_volume_profile(bins=bins)
        return VolumeProfileResponse(success=True, data=data)
    except Exception as e:
        logger.error(f"API Error in /market/volume-profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))
