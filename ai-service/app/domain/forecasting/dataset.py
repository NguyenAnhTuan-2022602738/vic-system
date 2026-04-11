"""
Dataset PyTorch cho mẫu huấn luyện cổ phiếu VIC.
"""

import numpy as np
import torch
from torch.utils.data import Dataset


class VICStockDataset(Dataset):
    """
    Dataset cho huấn luyện Conditional LSTM.

    Mỗi mẫu: (chuỗi_60_ngày, horizon, lợi_nhuận_thực_tế)
    """

    def __init__(self, samples: list[dict]):
        """
        Tham số:
            samples: Danh sách dict từ feature_builder.create_sequences()
                Mỗi dict có keys: sequence, horizon, target_return
        """
        self.sequences = [s["sequence"] for s in samples]
        self.horizons = [s["horizon"] for s in samples]
        self.targets = [s["target_return"] for s in samples]

    def __len__(self) -> int:
        return len(self.sequences)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Trả về:
            sequence: (60, num_features)
            horizon: (1,)

            target: (1,)
        """
        sequence = torch.tensor(self.sequences[idx], dtype=torch.float32)
        horizon = torch.tensor([self.horizons[idx]], dtype=torch.float32)
        target = torch.tensor([self.targets[idx]], dtype=torch.float32)

        return sequence, horizon, target
