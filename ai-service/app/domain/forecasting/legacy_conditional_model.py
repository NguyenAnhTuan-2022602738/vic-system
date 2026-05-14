"""
Mô hình LSTM Có điều kiện cho dự báo xác suất.
Nhận horizon linh hoạt thông qua horizon embedding.
"""

import torch
import torch.nn as nn


import math
import torch
import torch.nn as nn


class ManualLSTMCell(nn.Module):
    """Lớp LSTM Cell được viết bằng logic Equations."""

    def __init__(self, input_size: int, hidden_size: int):
        super().__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size

        # W_ih, W_hh, b_ih, b_hh cho tất cả 4 cổng (i, f, g, o)
        self.weight_ih = nn.Parameter(torch.Tensor(4 * hidden_size, input_size))
        self.weight_hh = nn.Parameter(torch.Tensor(4 * hidden_size, hidden_size))
        self.bias_ih = nn.Parameter(torch.Tensor(4 * hidden_size))
        self.bias_hh = nn.Parameter(torch.Tensor(4 * hidden_size))

        self.reset_parameters()

    def reset_parameters(self):
        stdv = 1.0 / math.sqrt(self.hidden_size)
        for weight in self.parameters():
            weight.data.uniform_(-stdv, stdv)

    def forward(
        self, x: torch.Tensor, state: tuple[torch.Tensor, torch.Tensor]
    ) -> tuple[torch.Tensor, torch.Tensor]:
        h_prev, c_prev = state

        # Tính toán các cổng (i, f, g, o)
        gates = (
            torch.matmul(x, self.weight_ih.t())
            + self.bias_ih
            + torch.matmul(h_prev, self.weight_hh.t())
            + self.bias_hh
        )

        i_gate, f_gate, g_gate, o_gate = gates.chunk(4, 1)

        i_gate = torch.sigmoid(i_gate)
        f_gate = torch.sigmoid(f_gate)
        g_gate = torch.tanh(g_gate)
        o_gate = torch.sigmoid(o_gate)

        # Cell state và Hidden state
        c_next = f_gate * c_prev + i_gate * g_gate
        h_next = o_gate * torch.tanh(c_next)

        return h_next, c_next


class ConditionalLSTM(nn.Module):
    """
    Mô hình LSTM cho dự báo xác suất có điều kiện.
    Sử dụng danh sách các ManualLSTMCell để hỗ trợ nhiều lớp.
    """

    def __init__(
        self,
        input_size: int = 9,
        hidden_size: int = 128,
        num_layers: int = 2,
        horizon_embed_dim: int = 16,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.dropout_p = dropout

        # Embedding cho horizon
        self.horizon_embedding = nn.Sequential(
            nn.Linear(1, horizon_embed_dim),
            nn.ReLU(),
        )

        # Danh sách các lớp LSTM thủ công
        self.cells = nn.ModuleList()
        for i in range(num_layers):
            layer_input_size = input_size if i == 0 else hidden_size
            self.cells.append(ManualLSTMCell(layer_input_size, hidden_size))

        self.dropout = nn.Dropout(dropout)

        # Đầu ra xác suất — dự đoán μ và σ
        combined_size = hidden_size + horizon_embed_dim
        self.mu_head = nn.Linear(combined_size, 1)
        self.sigma_head = nn.Sequential(
            nn.Linear(combined_size, 1),
            nn.Softplus(),  # Đảm bảo σ > 0
        )

    def forward(
        self, sequence: torch.Tensor, horizon: torch.Tensor
    ) -> tuple[torch.Tensor, torch.Tensor]:
        batch_size, seq_len, _ = sequence.size()
        device = sequence.device

        # Khởi tạo trạng thái cho mỗi lớp
        h_states = [torch.zeros(batch_size, self.hidden_size, device=device) for _ in range(self.num_layers)]
        c_states = [torch.zeros(batch_size, self.hidden_size, device=device) for _ in range(self.num_layers)]

        # Lặp qua từng bước thời gian
        for t in range(seq_len):
            input_t = sequence[:, t, :]
            
            # Chạy qua từng lớp LSTM
            for i in range(self.num_layers):
                h_states[i], c_states[i] = self.cells[i](input_t, (h_states[i], c_states[i]))
                
                # Input của lớp tiếp theo là output của lớp hiện tại (có dropout nếu không phải lớp cuối)
                if i < self.num_layers - 1:
                    input_t = self.dropout(h_states[i])
                else:
                    input_t = h_states[i]

        # Lấy hidden state cuối cùng của lớp cuối cùng
        last_h = h_states[-1]

        # Mã hóa horizon
        h_embed = self.horizon_embedding(horizon.float())

        # Kết hợp đặc trưng chuỗi + horizon
        combined = torch.cat([last_h, h_embed], dim=-1)

        # Dự đoán tham số phân phối
        mu = self.mu_head(combined)
        sigma = self.sigma_head(combined)

        return mu, sigma
