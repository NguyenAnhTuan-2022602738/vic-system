import numpy as np
import sys
import os

# Thêm root dir vào path
sys.path.append(os.getcwd())

from app.services.market_data_service import MarketDataService
from app.services.forecast_service import ForecastService
from app.domain.forecasting.manual_linear_regression import ManualLinearRegression
from app.domain.forecasting.manual_rf import ManualRandomForest

def test_market_data_service():
    print("\n--- Testing Phase 05: MarketDataService (Real Data/Synthetic) ---")
    service = MarketDataService()
    df = service.get_vic_history()
    print(f"Dataframe size: {len(df)}")
    print(f"Latest date: {df['date'].max() if not df.empty else 'N/A'}")
    assert not df.empty, "Market data should not be empty"
    print("✅ MarketDataService works correctly (Synthetic Fallback active).")

def test_manual_lr():
    print("\n--- Testing Phase 06: ManualLinearRegression Logic ---")
    # y = 2x + 1
    X = np.array([[1], [2], [3], [4], [5]], dtype=float)
    y = np.array([3, 5, 7, 9, 11], dtype=float)
    
    model = ManualLinearRegression(learning_rate=0.01, iterations=1000)
    model.train(X, y)
    
    test_x = np.array([[6]], dtype=float)
    pred = model.predict(test_x)
    print(f"Input: 6, Target: 13, Prediction: {pred[0]:.4f}")
    assert abs(pred[0] - 13) < 0.5, "LR prediction is too far off"
    print("✅ ManualLinearRegression logic verified.")

def test_manual_rf():
    print("\n--- Testing Phase 06: ManualRandomForest Logic ---")
    # Tăng số lượng mẫu để bagging ổn định hơn
    X = np.array([[1], [1.1], [1.2], [1.9], [2], [2.1], [10], [10.1], [11], [11.5]], dtype=float)
    y = np.array([2, 2, 2, 2.1, 2.1, 2.1, 20, 20.5, 21, 21.5], dtype=float)
    
    model = ManualRandomForest(n_estimators=10, max_depth=3)
    model.train(X, y)
    
    test_x = np.array([[1.5], [10.5]], dtype=float)
    preds = model.predict(test_x)
    print(f"Input 1.5 -> Pred: {preds[0]:.4f} (Target ~2)")
    print(f"Input 10.5 -> Pred: {preds[1]:.4f} (Target ~20.5)")
    assert preds[0] < 5 and preds[1] > 15, "RF logic incorrect"
    print("✅ ManualRandomForest logic verified.")

def test_forecast_integration():
    print("\n--- Testing Phase 06: ForecastService Integration ---")
    service = ForecastService()
    result = service.predict(horizon=5)
    
    print(f"Result keys: {result.keys()}")
    print(f"Expected Return: {result['expected_return']}")
    
    assert "comparison" in result, "Comparison data missing in result"
    comparison = result['comparison']
    print(f"Comparison models count: {len(comparison)}")
    for model in comparison:
        print(f" - {model['name']}: {model['expected_return']}")
        
    assert any(m['name'] == 'Multimodal LSTM (Adj)' for m in comparison), "LSTM missing"
    assert any(m['name'] == 'Random Forest (Manual)' for m in comparison), "RF missing"
    assert any(m['name'] == 'Linear Regression (Manual)' for m in comparison), "LR missing"
    print("✅ ForecastService multi-model integration verified.")

if __name__ == "__main__":
    try:
        test_market_data_service()
        test_manual_lr()
        test_manual_rf()
        test_forecast_integration()
        print("\n🏆 ALL PHASE 05 & 06 TESTS PASSED!")
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        sys.exit(1)
