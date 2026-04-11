"""
Bộ chuẩn hóa đặc trưng — fit và áp dụng normalization.
Lưu trữ tham số scaler để đảm bảo nhất quán giữa train và inference.
"""

import json
import os

import numpy as np
import pandas as pd


class FeatureScaler:
    """
    Bộ chuẩn hóa MinMax cho các đặc trưng.
    Lưu/tải tham số scaling sang JSON để tái sử dụng.
    """

    def __init__(self):
        self.min_vals: dict[str, float] = {}
        self.max_vals: dict[str, float] = {}
        self.feature_cols: list[str] = []
        self._fitted = False

    def fit(self, df: pd.DataFrame, feature_cols: list[str]) -> "FeatureScaler":
        """
        Fit scaler trên dữ liệu huấn luyện.

        Tham số:
            df: DataFrame huấn luyện
            feature_cols: Các cột cần scale

        Trả về:
            self
        """
        self.feature_cols = feature_cols
        for col in feature_cols:
            self.min_vals[col] = float(df[col].min())
            self.max_vals[col] = float(df[col].max())
        self._fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Áp dụng scaling lên DataFrame.

        Tham số:
            df: DataFrame cần biến đổi

        Trả về:
            DataFrame đã scale (giá trị trong [0, 1])
        """
        if not self._fitted:
            raise RuntimeError("Scaler chưa được fit. Gọi fit() trước.")

        df = df.copy()
        for col in self.feature_cols:
            if col in df.columns:
                range_val = self.max_vals[col] - self.min_vals[col]
                if range_val > 0:
                    df[col] = (df[col] - self.min_vals[col]) / range_val
                else:
                    df[col] = 0.0
        return df

    def fit_transform(self, df: pd.DataFrame, feature_cols: list[str]) -> pd.DataFrame:
        """Fit và transform trong một bước."""
        self.fit(df, feature_cols)
        return self.transform(df)

    def save(self, path: str = "models/scaler.json") -> None:
        """Lưu tham số scaler ra file JSON."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        data = {
            "feature_cols": self.feature_cols,
            "min_vals": self.min_vals,
            "max_vals": self.max_vals,
        }
        with open(path, "w") as f:
            json.dump(data, f, indent=2)

    def load(self, path: str = "models/scaler.json") -> "FeatureScaler":
        """Tải tham số scaler từ file JSON."""
        with open(path, "r") as f:
            data = json.load(f)
        self.feature_cols = data["feature_cols"]
        self.min_vals = data["min_vals"]
        self.max_vals = data["max_vals"]
        self._fitted = True
        return self
