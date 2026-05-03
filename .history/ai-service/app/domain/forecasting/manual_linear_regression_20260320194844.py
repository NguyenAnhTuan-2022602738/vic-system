import numpy as np
from app.core.logger import logger

class ManualLinearRegression:
    """Hồi quy tuyến tính triển khai thủ công bằng Gradient Descent."""
    
    def __init__(self, learning_rate=0.01, iterations=1000):
        self.lr = learning_rate
        self.iterations = iterations
        self.weights = None
        self.bias = None
        
    def train(self, X, y):
        """
        Huấn luyện mô hình.
        X: numpy array shape (n_samples, n_features)
        y: numpy array shape (n_samples,)
        """
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0
        
        for i in range(self.iterations):
            # Dự đoán
            y_pred = np.dot(X, self.weights) + self.bias
            
            # Tính gradient
            dw = (1 / n_samples) * np.dot(X.T, (y_pred - y))
            db = (1 / n_samples) * np.sum(y_pred - y)
            
            # Cập nhật tham số
            self.weights -= self.lr * dw
            self.bias -= self.lr * db
            
            if i % 200 == 0:
                loss = np.mean((y_pred - y) ** 2)
                # logger.info(f"LR Training - Iter {i}: Loss {loss:.6f}")
                
        logger.info("Manual Linear Regression trained successfully.")
        
    def predict(self, X):
        return np.dot(X, self.weights) + self.bias
