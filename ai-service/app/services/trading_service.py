from typing import Dict, Any, Optional
import math

class TradingService:
    """
    Service to generate trading signals based on Sharpe Ratio framework.
    
    References:
        - Sharpe, W.F. (1966). "Mutual Fund Performance." The Journal of Business, 39(1), 119-138.
        - Lãi suất phi rủi ro (Rf): Lãi suất tiết kiệm kỳ hạn 12 tháng tại Việt Nam (~5%/năm).
    """

    # Lãi suất phi rủi ro hàng ngày (5%/năm ÷ 252 ngày giao dịch)
    RISK_FREE_DAILY = 0.05 / 252  # ≈ 0.0198% / ngày

    def generate_signal(self, 
                       current_price: float, 
                       expected_return: float, 
                       uncertainty: float, 
                       sentiment_score: float,
                       probability_gain: float) -> Dict[str, Any]:
        """
        Generates a trading signal based on Sharpe Ratio.
        
        Công thức Sharpe Ratio:
            S = (μ_adj - Rf) / σ_adj
        
        Ngưỡng quyết định (theo chuẩn ngành tài chính):
            S > 1.0                          → BUY  (Lợi nhuận vượt trội so với rủi ro)
            S > 0.5 AND sentiment > 0        → BUY  (Chấp nhận được + sentiment xác nhận)
            S < 0                            → SELL (Lỗ so với lãi suất phi rủi ro)
            S < 0.5 AND sentiment < -0.3     → SELL (Yếu + sentiment tiêu cực mạnh)
            Còn lại                          → HOLD
        
        Args:
            current_price: Giá đóng cửa gần nhất.
            expected_return: Lợi nhuận kỳ vọng đã điều chỉnh (μ_adj, dạng thập phân).
            uncertainty: Độ bất định đã điều chỉnh (σ_adj).
            sentiment_score: Điểm cảm xúc tổng hợp (-1 đến 1).
            probability_gain: Xác suất sinh lời P(Return > 0).
            
        Returns:
            Dict chứa action, confidence, stop_loss, take_profit, risk_level, sharpe_ratio.
        """
        # ===== 1. TÍNH SHARPE RATIO =====
        # Tránh chia cho 0
        if uncertainty <= 0:
            sharpe = 10.0 if expected_return > self.RISK_FREE_DAILY else -10.0
        else:
            sharpe = (expected_return - self.RISK_FREE_DAILY) / uncertainty
        
        # ===== 2. XÁC ĐỊNH HÀNH ĐỘNG (Dynamic Volatility & Probability Thresholds) =====
        action = "HOLD"
        
        # Ngưỡng động dựa trên dữ liệu lịch sử biến động (Volatility)
        # - Thị trường giật mạnh (uncertainty cao) -> Đòi hỏi mu phải cao tương ứng mới báo MUA.
        # - Thị trường êm đềm -> mu thấp cũng báo MUA.
        dynamic_buy_threshold = 0.5 * uncertainty
        dynamic_sell_threshold = -0.5 * uncertainty

        if expected_return > dynamic_buy_threshold and probability_gain > 0.60:
            # Lợi nhuận vượt 0.5 lần rủi ro VÀ Xác suất thắng > 60% (Vượt trội)
            action = "BUY"
        elif expected_return > (0.3 * uncertainty) and probability_gain > 0.55 and sentiment_score > 0.2:
            # Biên lợi nhuận mấp mé nhưng có Tin tức tốt (Sentiment) yểm trợ
            action = "BUY"
        elif expected_return < dynamic_sell_threshold and probability_gain < 0.40:
            # Lợi nhuận âm vượt 0.5 lần rủi ro VÀ Xác suất thắng < 40% (Tức là xác suất giảm > 60%)
            action = "SELL"
        elif expected_return < (-0.3 * uncertainty) and probability_gain < 0.45 and sentiment_score < -0.2:
            # Tin tức quá xấu kéo theo đà giảm
            action = "SELL"
        
        # ===== 3. CONFIDENCE (Chuẩn hóa Sharpe về [0, 1]) =====
        # Dùng hàm sigmoid để map Sharpe Ratio → Confidence [0, 1]
        # Sigmoid(x) = 1 / (1 + e^(-x)) → Sharpe=0 → 50%, Sharpe=1 → 73%, Sharpe=2 → 88%
        confidence = 1.0 / (1.0 + math.exp(-sharpe))

        # ===== 4. QUẢN TRỊ RỦI RO (Stop Loss / Take Profit) =====
        # Dựa trên volatility (giữ nguyên logic cũ, đã hợp lý)
        stop_loss = 0.0
        take_profit = 0.0
        
        if action == "BUY":
            # Stop loss: không lỗ quá 1.5 × σ hoặc tối thiểu 3%
            sl_pct = max(1.5 * uncertainty, 0.03) 
            stop_loss = current_price * (1 - sl_pct)
            # Take profit: mục tiêu = expected return hoặc tối thiểu 5%
            tp_pct = max(expected_return, 0.05)
            take_profit = current_price * (1 + tp_pct)
        elif action == "SELL":
            # Stop loss nếu giá tăng ngược 1.5 × σ
            sl_pct = max(1.5 * uncertainty, 0.02)
            stop_loss = current_price * (1 + sl_pct)
            # Mục tiêu giảm 5%
            take_profit = current_price * 0.95
            
        # ===== 5. MỨC ĐỘ RỦI RO =====
        risk_level = "High" if uncertainty > 0.04 else "Medium" if uncertainty > 0.02 else "Low"

        return {
            "action": action,
            "confidence": round(confidence, 4),
            "stop_loss": round(stop_loss, 2),
            "take_profit": round(take_profit, 2),
            "risk_level": risk_level,
            "sharpe_ratio": round(sharpe, 4)
        }
