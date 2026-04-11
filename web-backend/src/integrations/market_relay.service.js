/**
 * Market Relay Service - Cung cấp giá VIC gần như thời gian thực qua SSI iBoard Query API.
 * Đây là phương án ổn định nhất khi WebSocket bị chặn DNS/Firewall.
 */

import axios from 'axios';

class MarketRelayService {
  constructor() {
    this.ioServer = null;
    this.symbol = 'VIC';
    this.pollInterval = 2000; // 2 giây/lần
    this.timer = null;
    this.lastPrice = 0;
    this.isRunning = false;
  }

  /**
   * Khởi động trạm trung chuyển dữ liệu.
   */
  start(ioServer) {
    this.ioServer = ioServer;
    if (this.isRunning) return;

    this.isRunning = true;
    console.log(`📡 Đang khởi động luồng giá Real-time cho ${this.symbol} (Nguồn: SSI iBoard)...`);
    
    // Bắt đầu vòng lặp quét dữ liệu
    this._poll();
  }

  stop() {
    this.isRunning = false;
    if (this.timer) clearTimeout(this.timer);
  }

  async _poll() {
    if (!this.isRunning) return;

    try {
      // API Query của SSI iBoard - Trả về thông tin chi tiết mã chứng khoán
      const url = `https://iboard-query.ssi.com.vn/stock/${this.symbol.toUpperCase()}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Origin': 'https://iboard.ssi.com.vn',
          'Referer': 'https://iboard.ssi.com.vn/'
        },
        timeout: 5000
      });

      if (response.data && response.data.code === 'SUCCESS') {
        this._processData(response.data.data);
      }
    } catch (err) {
      // console.warn(`⚠️ Lỗi khi quét giá SSI: ${err.message}`);
    }

    // Lên lịch quét lần tiếp theo
    this.timer = setTimeout(() => this._poll(), this.pollInterval);
  }

  /**
   * Xử lý và mapping dữ liệu SSI
   */
  _processData(stockInfo) {
    const matchedPrice = parseFloat(stockInfo.matchedPrice || stockInfo.price || stockInfo.lastPrice || 0);
    const change = parseFloat(stockInfo.priceChange || stockInfo.change || 0);
    
    // Trích xuất O-H-L cho biểu đồ nến
    const open = parseFloat(stockInfo.openPrice || stockInfo.open || matchedPrice);
    const high = parseFloat(stockInfo.highestPrice || stockInfo.highest || matchedPrice);
    const low = parseFloat(stockInfo.lowestPrice || stockInfo.lowest || matchedPrice);

    if (matchedPrice > 0 && (matchedPrice !== this.lastPrice || this.lastPrice === 0)) {
      this.lastPrice = matchedPrice;

      const payload = {
        symbol: this.symbol,
        price: matchedPrice,
        change: change,
        open: open,
        high: high,
        low: low,
        timestamp: new Date().getTime(),
        source: 'ssi_query'
      };

      console.log(`[SSI] Cập nhật giá ${this.symbol}: ${payload.price.toLocaleString()} VNĐ (O: ${open}, H: ${high}, L: ${low})`);

      if (this.ioServer) {
        this.ioServer.emit('price_update', payload);
      }
    }
  }
}

export const marketRelayService = new MarketRelayService();
