"""
Schema Pydantic cho API Tin tức.
"""

from pydantic import BaseModel, Field
from typing import Optional


class NewsAnalyzeRequest(BaseModel):
    """Schema request cho phân tích tin tức."""
    text: str = Field(..., description="Nội dung bài tin tức cần phân tích")


class NewsAnalyzeData(BaseModel):
    """Kết quả phân tích tin tức."""
    sentiment_score: float = Field(..., description="Điểm tâm lý [-1, 1]")
    impact_weight: float = Field(..., description="Trọng số ảnh hưởng [0, 1]")
    summary: str = Field(..., description="Tóm tắt phân tích")


class NewsAnalyzeResponse(BaseModel):
    """Schema response cho phân tích tin tức."""
    success: bool = True
    data: NewsAnalyzeData


class AdjustedForecastRequest(BaseModel):
    """Request dự báo điều chỉnh theo tin tức."""
    horizon: int = Field(..., ge=1, le=30)
    news_text: str = Field(..., description="Nội dung tin tức để điều chỉnh")
    target_return: Optional[float] = Field(default=0.05)


from app.api.schemas.forecast_schema import ForecastData

class AdjustedForecastData(ForecastData):
    """Dữ liệu dự báo đã điều chỉnh (Kế thừa đầy đủ từ ForecastData)."""
    # Các trường bổ sung cho so sánh Sandbox
    original_mu: float
    original_sigma: float
    adjusted_mu: float
    adjusted_sigma: float


class AdjustedForecastResponse(BaseModel):
    """Response dự báo đã điều chỉnh."""
    success: bool = True
    data: Optional[AdjustedForecastData] = None
