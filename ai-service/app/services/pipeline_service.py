"""
Dịch vụ Pipeline: Gom nhóm toàn bộ việc crawl dữ liệu và dự báo thông qua ForecastService.
"""

import time
from datetime import datetime, timedelta
from app.core.logger import logger
from app.services.market_data_service import MarketDataService
from app.services.forecast_service import ForecastService

class PipelineService:
    def __init__(self):
        self.market_service = MarketDataService()
        self.forecast_service = ForecastService()

    def run_pipeline(self) -> dict:
        """Thực thi toàn bộ luồng T+2 Forecast Pipeline."""
        logger.info("[Pipeline] Bắt đầu chạy T+2 Forecast Pipeline...")

        # 1. Cập nhật dữ liệu giá (VNDirect) - Đảm bảo CSV có tới T-1
        logger.info("[Pipeline] Bước 1: Cập nhật dữ liệu từ VNDirect...")
        self.market_service.update_csv_if_needed()
        
        # 2. Sử dụng ForecastService để chạy dự báo T+2 (horizon=3)
        # ForecastService đã xử lý: build_features, scaling, LSTM, Sentiment Fusion, Risk VaR.
        logger.info("[Pipeline] Bước 2: Chạy ForecastService Inference (Horizon=3, Force Refresh)...")
        forecast_data = self.forecast_service.predict(horizon=3, target_return=0.05, force_refresh=True)

        # 3. Lấy giá đóng cửa gần nhất từ CSV
        df_history = self.market_service.get_vic_history()
        last_price = float(df_history.iloc[-1]['close']) if not df_history.empty else 0.0

        # Mapping kết quả về schema Pipeline (tương thích với ForecastHistory model ở backend)
        trading_signal = forecast_data.get("trading_signal", {})
        result = {
            "expected_return": forecast_data.get("expected_return", 0),
            "lstm_prediction": forecast_data.get("lstm_prediction", 0),
            "base_uncertainty": forecast_data.get("base_uncertainty", 0.02),
            "risk_var": forecast_data.get("var_95", 0),
            "win_rate": forecast_data.get("probability_gain", 0),
            "sharpe_ratio": round(forecast_data.get("expected_return", 0) / (forecast_data.get("uncertainty", 1) + 1e-6), 2),
            "sentiment_score": forecast_data.get("sentiment_score", 0),
            "impact_weight": forecast_data.get("impact_weight", 0.15),
            "adjusted_uncertainty": forecast_data.get("uncertainty", 0.03),
            "final_action": forecast_data.get("recommendation", "HOLD"),
            "confidence": trading_signal.get("confidence", 0.5),
            "stop_loss": trading_signal.get("stop_loss", 0),
            "take_profit": trading_signal.get("take_profit", 0),
            "last_price_used": last_price,
            "latest_news_analyzed": len(forecast_data.get("news", [])),
            "comparison": forecast_data.get("comparison", []) # MỚI: Dữ liệu so sánh đa mô hình
        }


        logger.info(f"[Pipeline] Hoàn tất. Kết luận: {result['final_action']} (Confidence: {result['confidence']})")
        return result
