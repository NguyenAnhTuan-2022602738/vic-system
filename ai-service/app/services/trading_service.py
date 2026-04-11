from typing import Dict, Any, Optional
import math

class TradingService:
    """
    Service to generate trading signals and risk management parameters
    based on forecast results and sentiment analysis.
    """

    def generate_signal(self, 
                       current_price: float, 
                       expected_return: float, 
                       uncertainty: float, 
                       sentiment_score: float,
                       probability_gain: float) -> Dict[str, Any]:
        """
        Generates a trading signal and risk parameters.
        
        Args:
            current_price: The latest close price.
            expected_return: Expected fractional return (e.g., 0.05 for 5%).
            uncertainty: Sigma/Uncertainty (e.g., 0.02).
            sentiment_score: Normalized sentiment (-1 to 1).
            probability_gain: Probability that return > 0.
            
        Returns:
            Dict containing action, confidence, stop_loss, and take_profit.
        """
        # 1. Determine Action
        action = "HOLD"
        confidence = probability_gain
        
        # Heuristic rules for signals
        if expected_return > 0.02 and probability_gain > 0.60 and sentiment_score > -0.1:
            action = "BUY"
        elif expected_return < -0.01 or (sentiment_score < -0.3 and probability_gain < 0.45):
            action = "SELL"
            
        # 2. Risk Management (Stop Loss / Take Profit)
        # We use a volatility-based approach for TP/SL
        # Stop loss at 1.5 * uncertainty below current price (for BUY)
        # Take profit at 1.0 * expected_return above current price
        
        stop_loss = 0.0
        take_profit = 0.0
        
        if action == "BUY":
            # Don't lose more than 1.5 standard deviations or 3%
            sl_pct = max(1.5 * uncertainty, 0.03) 
            stop_loss = current_price * (1 - sl_pct)
            
            # Target is the expected return or at least 5%
            tp_pct = max(expected_return, 0.05)
            take_profit = current_price * (1 + tp_pct)
        elif action == "SELL":
            # Stop loss if price goes up by 1.5 * uncertainty
            sl_pct = max(1.5 * uncertainty, 0.02)
            stop_loss = current_price * (1 + sl_pct)
            
            # Target 5% drop
            take_profit = current_price * 0.95
            
        return {
            "action": action,
            "confidence": round(confidence, 4),
            "stop_loss": round(stop_loss, 2),
            "take_profit": round(take_profit, 2),
            "risk_level": "High" if uncertainty > 0.04 else "Medium" if uncertainty > 0.02 else "Low"
        }
