import matplotlib.pyplot as plt
import numpy as np
import matplotlib.patches as patches

# Tắt cảnh báo font
plt.rcParams['font.family'] = 'sans-serif'

# 1. MinMax Scaler Chart
plt.figure(figsize=(10, 4))

# Fake raw data for stock prices
np.random.seed(42)
raw_data = np.random.normal(loc=50000, scale=15000, size=1000)
scaled_data = (raw_data - np.min(raw_data)) / (np.max(raw_data) - np.min(raw_data))

plt.subplot(1, 2, 1)
plt.hist(raw_data, bins=30, color='#3498db', alpha=0.7)
plt.title('Raw Data Distribution')
plt.xlabel('Value (e.g., VND, Volume)')
plt.ylabel('Frequency')

plt.subplot(1, 2, 2)
plt.hist(scaled_data, bins=30, color='#2ecc71', alpha=0.7)
plt.title('After Min-Max Scaling')
plt.xlabel('Normalized Value [0, 1]')

plt.tight_layout()
plt.savefig('minmax_scaler_chart.png', dpi=300)
plt.close()

# 2. Sliding Window concept image
fig, ax = plt.subplots(figsize=(12, 3))
ax.set_xlim(0, 100)
ax.set_ylim(0, 10)
ax.axis('off')

# Draw time series blocks
for i in range(10, 80, 4):
    ax.add_patch(patches.Rectangle((i, 4), 3.5, 2, edgecolor='#34495e', facecolor='#bdc3c7', lw=1.5))

# Label time axis
ax.text(10, 3, 'T-60', fontsize=10, ha='center')
ax.text(64, 3, 'T-1', fontsize=10, ha='center')
ax.text(76, 3, 'T', fontsize=10, ha='center')
ax.text(80, 3, 'T+1', fontsize=10, ha='center')
ax.text(84, 3, 'T+2', fontsize=10, ha='center')

# Highlight window
ax.add_patch(patches.Rectangle((9, 3.5), 56, 3, edgecolor='#e74c3c', facecolor='none', linewidth=2.5, linestyle='--'))
ax.text(37, 7, 'Sliding Window (Size = 60)', color='#e74c3c', fontsize=12, fontweight='bold', ha='center')

# Target (T+2)
ax.add_patch(patches.Rectangle((84, 4), 3.5, 2, edgecolor='#2c3e50', facecolor='#f1c40f', lw=2))
ax.text(86, 6.5, 'Target (T+2)', color='#d35400', fontsize=12, fontweight='bold', ha='center')

# Arrow from Window to Target
plt.arrow(66, 5, 16, 0, head_width=0.5, head_length=1.5, fc='#2c3e50', ec='#2c3e50', lw=2)

plt.savefig('sliding_window_chart.png', dpi=300)
plt.close()
