"""
Schema Pydantic cho API Dự báo.
"""

from pydantic import BaseModel, Field
from typing import Optional


class ForecastRequest(BaseModel):
    """Schema request cho endpoint dự báo."""
    horizon: int = Field(
        ...,
        ge=1,
        le=30,
        description="Số ngày dự báo (1-30)",
    )
    target_return: Optional[float] = Field(
        default=0.05,
        description="Ngưỡng lợi nhuận mục tiêu để tính xác suất",
    )
    alpha: Optional[float] = Field(
        default=0.05,
        description="Trọng số điều chỉnh lợi nhuận theo cảm xúc",
    )
    beta: Optional[float] = Field(
        default=0.2,
        description="Trọng số điều chỉnh rủi ro theo cảm xúc",
    )


class FlashbackRequest(ForecastRequest):
    """Schema request cho endpoint dự báo quá khứ (Backfill)."""
    base_date: str = Field(..., description="Ngày mốc để thực hiện dự báo (YYYY-MM-DD)")
    manual_sentiment: Optional[float] = Field(None, description="Điểm cảm xúc thủ công (nếu có)")


class ModelComparison(BaseModel):
    """So sánh kết quả giữa các mô hình."""
    name: str # LSTM, Random Forest, Linear Regression
    expected_return: float
    mae: float # Sai số trung bình tuyệt đối

class NewsSentiment(BaseModel):
    """Thông tin cảm xúc tin tức."""
    id: str
    title: str
    sentiment_score: float
    impact_weight: float
    source: str
    timestamp: str
    url: str

class TradingSignal(BaseModel):
    """Tín hiệu giao dịch và quản trị rủi ro."""
    action: str = Field(..., description="BUY / SELL / HOLD")
    confidence: float = Field(..., description="Độ tin cậy của tín hiệu")
    stop_loss: float = Field(..., description="Mức cắt lỗ")
    take_profit: float = Field(..., description="Mức chốt lời mục tiêu")
    risk_level: str = Field(..., description="Low / Medium / High")

class ForecastData(BaseModel):
    """Dữ liệu kết quả dự báo."""
    horizon: int
    expected_return: float = Field(..., description="μ — Lợi nhuận kỳ vọng (%)")
    uncertainty: float = Field(..., description="σ — Độ lệch chuẩn (%)")
    probability_gain: float = Field(..., description="P(Lợi nhuận > 0)")
    probability_target: float = Field(..., description="P(Lợi nhuận > mục tiêu)")
    var_95: float = Field(..., description="Giá trị rủi ro 95%")
    recommendation: str = Field(..., description="MUA / GIỮ / TRÁNH")
    sentiment_score: float = Field(default=0.0, description="Điểm cảm xúc tổng hợp")
    news: list[NewsSentiment] = Field(default=[], description="Danh sách tin tức phân tích")
    comparison: list[ModelComparison] = Field(default=[], description="So sánh giữa các mô hình")
    trading_signal: Optional[TradingSignal] = Field(default=None, description="Tín hiệu giao dịch cụ thể")


class ForecastResponse(BaseModel):
    """Schema response cho endpoint dự báo."""
    success: bool = True
    data: ForecastData

class MultiHorizonData(BaseModel):
    """Dữ liệu dự báo cho nhiều khung thời gian."""
    horizons: list[ForecastData]

class MultiHorizonResponse(BaseModel):
    """Schema response cho endpoint dự báo đa khung thời gian."""
    success: bool = True
    data: MultiHorizonData

class VolumeBin(BaseModel):
    """Một mức giá trong Volume Profile."""
    price: float
    volume: float
    type: str # support / resistance / neutral

class VolumeProfileData(BaseModel):
    """Dữ liệu Volume Profile."""
    symbol: str
    bins: list[VolumeBin]

class VolumeProfileResponse(BaseModel):
    """Schema response cho Volume Profile."""
    success: bool = True
    data: VolumeProfileData

class PerformancePoint(BaseModel):
    """Một điểm dữ liệu hiệu suất."""
    date: str
    strategy_value: float
    benchmark_value: float
    signal: Optional[str] = "HOLD"
    daily_return: Optional[float] = 0.0

class BacktestMetrics(BaseModel):
    """Các chỉ số đo lường hiệu quả Backtest."""
    total_trades: int
    win_rate: float
    profit_factor: float
    max_drawdown: float
    sharpe_ratio: float
    total_return: float

class PerformanceData(BaseModel):
    """Dữ liệu hiệu suất chiến thuật chi tiết."""
    symbol: str
    history: list[PerformancePoint]
    metrics: BacktestMetrics


class PerformanceResponse(BaseModel):
    """Schema response cho hiệu suất chiến thuật."""
    success: bool = True
    data: PerformanceData
