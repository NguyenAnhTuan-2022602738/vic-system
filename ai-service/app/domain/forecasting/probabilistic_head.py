"""
Hàm mất mát Gaussian NLL và tiện ích huấn luyện cho Conditional LSTM.
"""

import torch
import torch.nn as nn


class GaussianNLLLoss(nn.Module):
    """
    Hàm mất mát Negative Log-Likelihood cho phân phối Gaussian.

    Với μ và σ dự đoán, và giá trị thực y:
    NLL = 0.5 * [log(σ²) + (y - μ)² / σ²] + 0.5 * log(2π)

    Hàm này khuyến khích:
    - μ gần với lợi nhuận thực tế
    - σ được hiệu chuẩn đúng (không quá lớn, không quá nhỏ)
    """

    def __init__(self, eps: float = 1e-6):
        super().__init__()
        self.eps = eps

    def forward(
        self,
        mu: torch.Tensor,
        sigma: torch.Tensor,
        target: torch.Tensor,
    ) -> torch.Tensor:
        """
        Tính hàm mất mát Gaussian NLL.

        Tham số:
            mu: (batch, 1) giá trị trung bình dự đoán
            sigma: (batch, 1) độ lệch chuẩn dự đoán (phải dương)
            target: (batch, 1) lợi nhuận thực tế

        Trả về:
            Giá trị loss (scalar)
        """
        # Đảm bảo sigma dương
        sigma = sigma.clamp(min=self.eps)

        # NLL = 0.5 * [log(σ²) + (y - μ)² / σ²]
        nll = 0.5 * (torch.log(sigma ** 2) + ((target - mu) ** 2) / (sigma ** 2))

        return nll.mean()
