import axios from 'axios';
import { env } from '../config/env.js';

/**
 * Service tích hợp Telegram Bot để gửi cảnh báo giao dịch.
 */
export const telegramService = {
  /**
   * Khởi tạo thông báo và gửi sang Telegram API.
   * @param {object} forecastData - Kết quả dự báo chung
   * @param {object} signalData - Tín hiệu giao dịch
   */
  async sendAlert(forecastData, signalData) {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      console.log('----------------------------------------------------');
      console.log('[MOCK TELEGRAM ALERT] Tiên quyết (Token/ChatID) chưa thiết lập.');
      console.log(`Action: ${signalData?.action}`);
      console.log(`Expected Return: ${forecastData?.expected_return}`);
      console.log('----------------------------------------------------');
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      const emoji = signalData.action === 'BUY' ? '🟢' : signalData.action === 'SELL' ? '🔴' : '⚪';
      
      const message = `
*VIC TRADING ALERT ${emoji}*
*Action:* ${signalData.action} (${signalData.risk_level} Risk)
*Confidence:* ${Math.round(signalData.confidence * 100)}%

*Targets:*
• 🎯 Take Profit: ${signalData.take_profit.toLocaleString()}
• 🛡️ Stop Loss: ${signalData.stop_loss.toLocaleString()}

*Forecast Details:*
• Khả năng tăng giá (P-Gain): ${Math.round(forecastData.probability_gain * 100)}%
• Lợi nhuận kỳ vọng: ${(forecastData.expected_return * 100).toFixed(2)}%
• Điểm cảm xúc (News): ${forecastData.sentiment_score ?? 0}
      `.trim();

      await axios.post(url, {
        chat_id: env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      });

      console.log(`[Telegram] Báo động ${signalData.action} đã được gửi.`);
    } catch (error) {
      console.error('[Telegram Error] Không thể gửi cảnh báo:', error.response?.data || error.message);
    }
  }
};
