import numpy as np
from app.core.logger import logger

class ManualDecisionTree:
    """Cây quyết định đơn giản dùng cho bài toán hồi quy."""
    
    def __init__(self, max_depth=5, min_samples_split=2):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.tree = None

    def train(self, X, y, depth=0):
        n_samples, n_features = X.shape
        
        # Điều kiện dừng
        if depth >= self.max_depth or n_samples < self.min_samples_split:
            return np.mean(y)
        
        # Tìm điểm chia tốt nhất (Best Split)
        best_feat, best_threshold = self._best_split(X, y)
        if best_feat is None:
            return np.mean(y)
            
        # Chia dữ liệu
        left_idx = X[:, best_feat] < best_threshold
        right_idx = ~left_idx
        
        if np.sum(left_idx) == 0 or np.sum(right_idx) == 0:
            return np.mean(y)

        # Đệ quy tạo cây
        return {
            'feature': best_feat,
            'threshold': best_threshold,
            'left': self.train(X[left_idx], y[left_idx], depth + 1),
            'right': self.train(X[right_idx], y[right_idx], depth + 1)
        }

    def _best_split(self, X, y):
        best_mse = float('inf')
        best_feat, best_threshold = None, None
        
        n_samples, n_features = X.shape
        
        # Thử một số đặc trưng ngẫu nhiên (n_features)
        for feat in range(n_features):
            thresholds = np.unique(X[:, feat])
            # Giới hạn số lượng threshold thử nghiệm để nhanh hơn
            if len(thresholds) > 10:
                thresholds = np.random.choice(thresholds, 10, replace=False)
                
            for t in thresholds:
                left_y = y[X[:, feat] < t]
                right_y = y[X[:, feat] >= t]
                
                if len(left_y) > 0 and len(right_y) > 0:
                    mse = np.var(left_y) * len(left_y) + np.var(right_y) * len(right_y)
                    if mse < best_mse:
                        best_mse = mse
                        best_feat = feat
                        best_threshold = t
        return best_feat, best_threshold

    def predict_one(self, x, node):
        if not isinstance(node, dict):
            return node
        
        if x[node['feature']] < node['threshold']:
            return self.predict_one(x, node['left'])
        else:
            return self.predict_one(x, node['right'])


class ManualRandomForest:
    """Rừng ngẫu nhiên"""
    
    def __init__(self, n_estimators=10, max_depth=5):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.trees = []
        
    def train(self, X, y):
        self.trees = []
        for i in range(self.n_estimators):
            # Bootstrap sampling
            indices = np.random.choice(len(X), len(X), replace=True)
            X_sample = X[indices]
            y_sample = y[indices]
            
            tree = ManualDecisionTree(max_depth=self.max_depth)
            tree_model = tree.train(X_sample, y_sample)
            self.trees.append((tree, tree_model))
            # logger.info(f"RF Training - Tree {i+1}/{self.n_estimators} done.")
            
        logger.info("Manual Random Forest trained successfully.")
        
    def predict(self, X):
        predictions = []
        for x in X:
            tree_preds = [tree.predict_one(x, model) for tree, model in self.trees]
            predictions.append(np.mean(tree_preds))
        return np.array(predictions)
