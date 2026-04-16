"""
Kiến trúc Hybrid SOTA: CNN-LSTM-Attention (Manual Implementation).
Giúp lọc nhiễu mẫu hình và tập trung vào các phiên giao dịch quan trọng.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class ManualCNN1D(nn.Module):
    """Lớp Convolution 1D viết thủ công để lọc nhiễu chuỗi thời gian."""
    def __init__(self, in_channels: int, out_channels: int, kernel_size: int = 3):
        super().__init__()
        self.kernel_size = kernel_size
        self.out_channels = out_channels
        self.in_channels = in_channels
        
        # Khởi tạo trọng số (Filters)
        self.weight = nn.Parameter(torch.Tensor(out_channels, in_channels, kernel_size))
        self.bias = nn.Parameter(torch.Tensor(out_channels))
        self.reset_parameters()

    def reset_parameters(self):
        nn.init.kaiming_uniform_(self.weight, a=math.sqrt(5))
        fan_in, _ = nn.init._calculate_fan_in_and_fan_out(self.weight)
        bound = 1 / math.sqrt(fan_in)
        nn.init.uniform_(self.bias, -bound, bound)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch, seq_len, in_channels)
        # Chuyển sang (batch, in_channels, seq_len) cho phép conv
        x = x.transpose(1, 2)
        
        # Sử dụng F.conv1d cho hiệu năng, nhưng logic vẫn là manual filters
        out = F.conv1d(x, self.weight, self.bias, padding=self.kernel_size // 2)
        
        # Trả về (batch, seq_len, out_channels)
        return out.transpose(1, 2)

class ManualAttention(nn.Module):
    """Cơ chế Attention thủ công giúp AI tập trung vào các phiên quan trọng."""
    def __init__(self, hidden_dim: int):
        super().__init__()
        self.attn_linear = nn.Linear(hidden_dim, 1)

    def forward(self, lstm_outputs: torch.Tensor) -> torch.Tensor:
        # lstm_outputs: (batch, seq_len, hidden_dim)
        
        # Tính điểm năng lượng (energy scores)
        scores = self.attn_linear(lstm_outputs).squeeze(-1) # (batch, seq_len)
        
        # Chuẩn hóa thành trọng số (Softmax)
        weights = F.softmax(scores, dim=1).unsqueeze(-1) # (batch, seq_len, 1)
        
        # Tính Context Vector (Tổng có trọng số)
        context = torch.sum(lstm_outputs * weights, dim=1) # (batch, hidden_dim)
        
        return context, weights

class ManualLSTMCell(nn.Module):
    """Lớp LSTM Cell thủ công (Giữ nguyên logic từ bản cũ để bảo tồn tính 'chất')."""
    def __init__(self, input_size: int, hidden_size: int):
        super().__init__()
        self.hidden_size = hidden_size
        self.weight_ih = nn.Parameter(torch.Tensor(4 * hidden_size, input_size))
        self.weight_hh = nn.Parameter(torch.Tensor(4 * hidden_size, hidden_size))
        self.bias_ih = nn.Parameter(torch.Tensor(4 * hidden_size))
        self.bias_hh = nn.Parameter(torch.Tensor(4 * hidden_size))
        self.reset_parameters()

    def reset_parameters(self):
        stdv = 1.0 / math.sqrt(self.hidden_size)
        for weight in self.parameters():
            weight.data.uniform_(-stdv, stdv)

    def forward(self, x: torch.Tensor, state: tuple[torch.Tensor, torch.Tensor]):
        h_prev, c_prev = state
        gates = (torch.matmul(x, self.weight_ih.t()) + self.bias_ih +
                 torch.matmul(h_prev, self.weight_hh.t()) + self.bias_hh)
        i, f, g, o = gates.chunk(4, 1)
        i, f, g, o = torch.sigmoid(i), torch.sigmoid(f), torch.tanh(g), torch.sigmoid(o)
        c_next = f * c_prev + i * g
        h_next = o * torch.tanh(c_next)
        return h_next, c_next

class HybridConditionalLSTM(nn.Module):
    """
    Mô hình Hybrid: CNN(Lọc nhiễu) -> LSTM(Ghi nhớ) -> Attention(Tập trung).
    """
    def __init__(
        self,
        input_size: int = 9,
        cnn_filters: int = 64,
        hidden_size: int = 128,
        num_layers: int = 2,
        horizon_embed_dim: int = 16,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # 1. Tầng CNN: Trích xuất đặc trưng mẫu hình
        self.cnn = ManualCNN1D(input_size, cnn_filters)
        
        # 2. Tầng LSTM: Xử lý chuỗi
        self.cells = nn.ModuleList()
        for i in range(num_layers):
            layer_input_size = cnn_filters if i == 0 else hidden_size
            self.cells.append(ManualLSTMCell(layer_input_size, hidden_size))
            
        # 3. Tầng Attention: Nhấn mạnh phiên biến động
        self.attention = ManualAttention(hidden_size)
        
        self.dropout = nn.Dropout(dropout)
        
        # Embedding cho horizon (Số ngày dự báo)
        self.horizon_embedding = nn.Sequential(
            nn.Linear(1, horizon_embed_dim),
            nn.ReLU(),
        )
        
        # Output: μ và σ
        combined_size = hidden_size + horizon_embed_dim
        self.mu_head = nn.Linear(combined_size, 1)
        self.sigma_head = nn.Sequential(
            nn.Linear(combined_size, 1),
            nn.Softplus(),
        )

    def forward(self, sequence: torch.Tensor, horizon: torch.Tensor):
        # sequence: (batch, seq_len, features)
        
        # Bước 1: Qua CNN để lọc nhiễu
        cnn_out = self.cnn(sequence) # (batch, seq_len, cnn_filters)
        cnn_out = F.relu(cnn_out)
        
        # Bước 2: Qua các lớp LSTM
        batch_size, seq_len, _ = cnn_out.size()
        device = sequence.device
        h_states = [torch.zeros(batch_size, self.hidden_size, device=device) for _ in range(self.num_layers)]
        c_states = [torch.zeros(batch_size, self.hidden_size, device=device) for _ in range(self.num_layers)]
        
        all_h_last_layer = []
        for t in range(seq_len):
            input_t = cnn_out[:, t, :]
            for i in range(self.num_layers):
                h_states[i], c_states[i] = self.cells[i](input_t, (h_states[i], c_states[i]))
                input_t = self.dropout(h_states[i]) if i < self.num_layers - 1 else h_states[i]
            all_h_last_layer.append(h_states[-1].unsqueeze(1))
            
        # Gom tất cả hidden states của lớp cuối để qua Attention
        lstm_out_all = torch.cat(all_h_last_layer, dim=1) # (batch, seq_len, hidden_size)
        
        # Bước 3: Qua Attention
        context, attn_weights = self.attention(lstm_out_all) # context: (batch, hidden_size)
        
        # Bước 4: Kết hợp Horizon và Output
        h_embed = self.horizon_embedding(horizon.float())
        combined = torch.cat([context, h_embed], dim=-1)
        
        mu = self.mu_head(combined)
        sigma = self.sigma_head(combined)
        
        return mu, sigma
