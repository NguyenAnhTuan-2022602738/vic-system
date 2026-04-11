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


class AdjustedForecastData(BaseModel):
    """Dữ liệu dự báo đã điều chỉnh."""
    # Dự báo gốc
    original_mu: float
    original_sigma: float
    # Dự báo đã điều chỉnh
    adjusted_mu: float
    adjusted_sigma: float
    # Phân tích tin tức
    sentiment_score: float
    impact_weight: float
    # Chỉ số rủi ro (đã điều chỉnh)
    probability_gain: float
    var_95: float
    recommendation: str


class AdjustedForecastResponse(BaseModel):
    """Response dự báo đã điều chỉnh."""
    success: bool = True
    data: AdjustedForecastData
