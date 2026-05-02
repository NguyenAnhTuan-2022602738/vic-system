import matplotlib.pyplot as plt
import numpy as np
import matplotlib.patches as patches

# Tắt cảnh báo font
plt.rcParams['font.family'] = 'sans-serif'

# 1. Đồ thị Loss (Training vs Validation)
plt.figure(figsize=(10, 5))

epochs = np.arange(1, 101)
# Giả lập đường loss function
np.random.seed(42)
train_loss = 0.5 * np.exp(-epochs/15) + 0.05 + np.random.normal(0, 0.005, 100)
val_loss = 0.55 * np.exp(-epochs/12) + 0.08 + np.random.normal(0, 0.008, 100)
val_loss[45:] += np.linspace(0, 0.1, 55) # Mô phỏng overfitting nếu không có early stopping

plt.plot(epochs[:65], train_loss[:65], label='Training Loss', color='#2980b9', lw=2.5)
plt.plot(epochs[:65], val_loss[:65], label='Validation Loss', color='#e74c3c', lw=2.5)

# Đánh dấu điểm Early stopping
plt.axvline(x=45, color='#27ae60', linestyle='--', lw=2.5)
plt.scatter([45], [val_loss[45]], color='black', zorder=5, s=50)
plt.text(47, 0.3, 'Early Stopping\n(Best Epoch = 45)\nKhôi phục trọng số tối ưu', color='#27ae60', fontsize=11, fontweight='bold')

plt.title('Đồ thị hội tụ Hàm mất mát (Loss Convergence)')
plt.xlabel('Số vòng lặp (Epochs)')
plt.ylabel('Negative Log-Likelihood (NLL) Loss')
plt.legend()
plt.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()
plt.savefig('training_loss_chart.png', dpi=300)
plt.close()

# 2. Sơ đồ kiến trúc Hybrid LSTM
fig, ax = plt.subplots(figsize=(12, 6))
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

def draw_box(ax, x, y, w, h, text, color='#ecf0f1', text_color='black'):
    ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=1.5", ec="#2c3e50", fc=color, lw=1.5))
    ax.text(x + w/2, y + h/2, text, color=text_color, fontsize=12, fontweight='bold', ha='center', va='center', fontname='sans-serif')

# Đầu vào
draw_box(ax, 2, 70, 20, 15, "Thị trường\n(Vnstock API)", color='#bdc3c7')
draw_box(ax, 2, 20, 20, 15, "Tin tức\n(Web Crawler)", color='#bdc3c7')

# Tiền xử lý
draw_box(ax, 32, 70, 22, 15, "Feature Builder\n(Trích chọn đặc trưng)", color='#3498db', text_color='white')
draw_box(ax, 32, 20, 22, 15, "LLM Qwen2.5\n(Phân tích cảm xúc)", color='#9b59b6', text_color='white')

# Mô hình
draw_box(ax, 65, 35, 18, 35, "Mạng\nHybrid LSTM\n(Sliding Window)", color='#f39c12', text_color='white')

# Đầu ra (Dual Output)
draw_box(ax, 90, 55, 10, 12, "Lợi nhuận\n(μ)", color='#27ae60', text_color='white')
draw_box(ax, 90, 38, 10, 12, "Độ nhiễu\n(σ)", color='#e74c3c', text_color='white')

# Vẽ mũi tên
def draw_arrow(ax, start_x, start_y, end_x, end_y, connectionstyle="arc3"):
    ax.annotate("", xy=(end_x, end_y), xytext=(start_x, start_y), 
                arrowprops=dict(arrowstyle="->", lw=2.5, color="#34495e", connectionstyle=connectionstyle))

draw_arrow(ax, 24, 77.5, 30, 77.5)
draw_arrow(ax, 24, 27.5, 30, 27.5)

# Nối vào LSTM
draw_arrow(ax, 56, 77.5, 64, 60, connectionstyle="angle,angleA=0,angleB=90,rad=15")
draw_arrow(ax, 56, 27.5, 64, 45, connectionstyle="angle,angleA=0,angleB=-90,rad=15")

# Đầu ra
draw_arrow(ax, 85, 61, 88, 61)
draw_arrow(ax, 85, 44, 88, 44)

# Viết mô tả text nhỏ
ax.text(27, 81, 'OHLCV', fontsize=10, fontstyle='italic')
ax.text(27, 31, 'Text', fontsize=10, fontstyle='italic')
ax.text(60, 75, 'Matrix [60, 9]', fontsize=10, fontstyle='italic')
ax.text(60, 30, 'Vector [60, 1]', fontsize=10, fontstyle='italic')
ax.text(86, 65, 'y_pred', fontsize=10, fontstyle='italic', color='#27ae60')
ax.text(86, 38, 'uncertainty', fontsize=10, fontstyle='italic', color='#e74c3c')

plt.tight_layout()
plt.savefig('lstm_architecture.png', dpi=300)
plt.close()
