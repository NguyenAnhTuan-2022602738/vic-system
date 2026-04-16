import torch
import os
import sys

# Add path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.forecast_service import ForecastService
from app.domain.forecasting.hybrid_model import HybridConditionalLSTM

def verify_system():
    print("🔍 DEBUG: Đang kiểm tra hệ thống ForecastService...")
    service = ForecastService()
    
    if service.model is not None and isinstance(service.model, HybridConditionalLSTM):
        print("✅ SUCCESS: ForecastService đã nạp đúng kiến trúc Hybrid mớii!")
        
        # Check if the weights are loaded (not just default)
        # Try a dummy predict
        try:
            res = service.predict(horizon=2)
            print(f"📈 DEBUG: Dự báo thử nghiệm thành công. Expected Return: {res['expected_return']:.4%}")
            print(f"📊 DEBUG: So sánh mô hình: {res['comparison']}")
        except Exception as e:
            print(f"❌ ERROR: Lỗi khi chạy inference: {e}")
    else:
        print("❌ FAILED: ForecastService chưa nạp đúng mô hình Hybrid.")

if __name__ == "__main__":
    verify_system()
