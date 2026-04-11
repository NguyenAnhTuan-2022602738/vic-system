"""
Hàm tiện ích đánh giá mô hình (Evaluation Metrics).
"""

import numpy as np

def calculate_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Tính Mean Absolute Error."""
    if len(y_true) == 0:
        return 0.0
    return float(np.mean(np.abs(y_true - y_pred)))

def calculate_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Tính Root Mean Squared Error."""
    if len(y_true) == 0:
        return 0.0
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

def calculate_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Tính Mean Absolute Percentage Error."""
    if len(y_true) == 0:
        return 0.0
    # Tránh chia cho 0
    y_true_safe = np.where(y_true == 0, 1e-10, y_true)
    return float(np.mean(np.abs((y_true - y_pred) / y_true_safe)) * 100)

def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Đánh giá tổng hợp các chỉ số."""
    return {
        "mae": calculate_mae(y_true, y_pred),
        "rmse": calculate_rmse(y_true, y_pred),
        "mape": calculate_mape(y_true, y_pred)
    }
