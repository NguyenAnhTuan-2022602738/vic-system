"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type Locale = "vi" | "en"

const translations = {
  // Common
  "common.system_online": { vi: "Hệ thống trực tuyến", en: "System Online" },
  "common.last_update": { vi: "Cập nhật: 14:32:05", en: "Last update: 14:32:05" },
  "common.collapse": { vi: "Thu gọn", en: "Collapse" },
  "common.days": { vi: "ngày", en: "days" },
  "common.total": { vi: "Tổng", en: "Total" },
  "common.articles": { vi: "bài báo", en: "articles" },
  "common.signals": { vi: "tín hiệu", en: "signals" },
  "common.simulated": { vi: "Mô phỏng", en: "Simulated" },
  "common.ai_powered": { vi: "AI Hỗ trợ", en: "AI-Powered" },
  "common.active": { vi: "Đang hoạt động", en: "Active" },
  "common.strong": { vi: "Mạnh", en: "Strong" },
  "common.excellent": { vi: "Xuất sắc", en: "Excellent" },
  "common.short": { vi: "Ngắn", en: "Short" },
  "common.good": { vi: "Tốt", en: "Good" },
  "common.high": { vi: "Cao", en: "High" },
  "common.low": { vi: "Thấp", en: "Low" },
  "common.adjusted": { vi: "Đã điều chỉnh", en: "Adjusted" },
  "common.density": { vi: "Mật độ", en: "Density" },
  "common.return": { vi: "Lợi nhuận", en: "Return" },
  "common.probability": { vi: "Xác suất", en: "Probability" },
  "common.current": { vi: "Hiện tại", en: "Current" },

  // Sidebar Navigation
  "nav.dashboard": { vi: "Tổng quan", en: "Dashboard" },
  "nav.forecast": { vi: "Dự báo", en: "Forecast" },
  "nav.news": { vi: "Tin tức & Cảm xúc", en: "News & Sentiment" },
  "nav.trade": { vi: "Tín hiệu GD", en: "Trade Signals" },
  "nav.backtest": { vi: "Mô phỏng chiến thuật", en: "Backtest Engine" },
  "nav.risk": { vi: "Phân tích rủi ro", en: "Risk Analysis" },

  "nav.settings": { vi: "Cấu hình mô hình", en: "Model Config" },

  // Dashboard Page
  "dashboard.title": { vi: "Tổng quan hệ thống", en: "Dashboard Overview" },
  "dashboard.subtitle": { vi: "Hệ thống dự báo xác suất có điều kiện đa phương thức VIC", en: "VIC Multimodal Conditional Probabilistic Forecasting System" },

  // Dashboard Metrics
  "metric.current_price": { vi: "Giá hiện tại", en: "Current Price" },
  "metric.expected_return": { vi: "Lợi nhuận kỳ vọng", en: "Expected Return" },
  "metric.p_gain": { vi: "XS Tăng giá", en: "P(Gain)" },
  "metric.var95": { vi: "VaR 95%", en: "VaR 95%" },
  "metric.sharpe_ratio": { vi: "Hệ số Sharpe", en: "Sharpe Ratio" },
  "metric.win_rate": { vi: "Tỷ lệ thắng", en: "Win Rate" },
  "metric.total_trades": { vi: "Tổng lệnh", en: "Total Trades" },
  "metric.profit_factor": { vi: "Hệ số lợi nhuận", en: "Profit Factor" },
  "metric.max_drawdown": { vi: "Sụt giảm tối đa", en: "Max Drawdown" },
  "metric.avg_holding": { vi: "Thời gian giữ TB", en: "Avg Holding" },
  "metric.5d_horizon": { vi: "Tầm nhìn 5 ngày", en: "5-day horizon" },
  "metric.probability": { vi: "Xác suất", en: "Probability" },
  "metric.max_loss": { vi: "Lỗ tối đa", en: "Max loss" },
  "metric.risk_adjusted": { vi: "Điều chỉnh rủi ro", en: "Risk-adjusted" },
  "metric.trades_count": { vi: "24 lệnh", en: "24 trades" },
  "metric.total_pnl": { vi: "Tổng lãi/lỗ", en: "Total PnL" },

  // Charts
  "chart.price_action": { vi: "Biến động giá VIC", en: "VIC Price Action" },
  "chart.price_action_sub": { vi: "Biến động giá 30 ngày với khối lượng", en: "30-day price movement with volume" },
  "chart.close": { vi: "Giá đóng", en: "Close" },
  "chart.volume": { vi: "Khối lượng", en: "Volume" },
  "chart.technical": { vi: "Chỉ báo kỹ thuật", en: "Technical Indicators" },
  "chart.volume_profile": { vi: "Phân phối khối lượng", en: "Volume Profile" },
  "chart.volume_profile_sub": { vi: "Phân phối khối lượng theo mức giá", en: "Volume distribution by price level" },
  "chart.performance": { vi: "Chiến lược vs Thị trường", en: "Strategy vs Benchmark" },
  "chart.performance_sub": { vi: "So sánh hiệu suất tích lũy (chỉ số 100)", en: "Cumulative performance comparison (indexed to 100)" },
  "chart.strategy": { vi: "Chiến lược", en: "Strategy" },
  "chart.vnindex": { vi: "VN-Index", en: "VN-Index" },
  "chart.distribution": { vi: "Phân phối lợi nhuận", en: "Return Distribution" },
  "chart.pdf": { vi: "Hàm mật độ", en: "PDF" },
  "chart.horizon": { vi: "Dự báo đa tầm nhìn", en: "Multi-Horizon Forecast" },
  "chart.horizon_sub": { vi: "Lợi nhuận kỳ vọng với dải bất định theo tầm nhìn", en: "Expected return with uncertainty bands by horizon" },
  "chart.sentiment_timeline": { vi: "Diễn biến cảm xúc", en: "Sentiment Timeline" },
  "chart.sentiment_timeline_sub": { vi: "Cảm xúc tin tức phân tích bởi LLM theo thời gian", en: "LLM-analyzed news sentiment over time" },
  "chart.positive": { vi: "Tích cực", en: "Positive" },
  "chart.negative": { vi: "Tiêu cực", en: "Negative" },
  "chart.sentiment_category": { vi: "Cảm xúc theo danh mục", en: "Sentiment by Category" },
  "chart.sentiment_category_sub": { vi: "Phân phối tin tức theo danh mục", en: "News distribution across categories" },
  "chart.neutral": { vi: "Trung tính", en: "Neutral" },
  "chart.sentiment_scatter": { vi: "Cảm xúc vs Tác động", en: "Sentiment vs Impact Scatter" },
  "chart.sentiment_scatter_sub": { vi: "Mỗi điểm là một bài báo (kích thước = trọng số tác động)", en: "Each point represents a news article (size = impact weight)" },
  "chart.drawdown": { vi: "Phân tích Drawdown", en: "Drawdown Analysis" },
  "chart.drawdown_sub": { vi: "Đường cong vốn dưới nước của chiến lược", en: "Strategy underwater equity curve" },
  "chart.trade_returns": { vi: "Phân phối lợi nhuận GD", en: "Trade Return Distribution" },
  "chart.trade_returns_sub": { vi: "Biểu đồ tần suất lợi nhuận từng giao dịch", en: "Histogram of individual trade returns" },
  "chart.signal_dist": { vi: "Phân phối tín hiệu", en: "Signal Distribution" },
  "chart.signal_dist_sub": { vi: "Phân loại tín hiệu đã tạo", en: "Breakdown of generated signals" },
  "chart.monte_carlo": { vi: "Mô phỏng Monte Carlo", en: "Monte Carlo Simulation" },
  "chart.monte_carlo_sub": { vi: "đường giá mô phỏng trong", en: "simulated price paths over" },
  "chart.ci_fan": { vi: "Dải tin cậy", en: "Confidence Interval Fan" },
  "chart.ci_fan_sub": { vi: "Dải tin cậy 68% và 95% qua các tầm nhìn", en: "68% and 95% confidence bands across horizons" },
  "chart.cum_prob": { vi: "Xác suất tích lũy", en: "Cumulative Probability" },
  "chart.cum_prob_sub": { vi: "P(Lợi nhuận <= mục tiêu) cho các mức khác nhau", en: "P(Return <= target) for different target levels" },
  "chart.radar": { vi: "Radar chiến lược", en: "Strategy Radar" },
  "chart.radar_sub": { vi: "Đánh giá rủi ro đa chiều", en: "Multi-dimensional risk assessment" },
  "chart.model_comparison": { vi: "So sánh mô hình", en: "Model Comparison" },

  // Forecast Page
  "forecast.title": { vi: "Dự báo xác suất", en: "Probabilistic Forecast" },
  "forecast.subtitle": { vi: "Dự báo Gaussian có điều kiện với điều chỉnh tin tức LLM", en: "Conditional Gaussian forecast with LLM news adjustment" },
  "forecast.summary": { vi: "Tóm tắt dự báo", en: "Forecast Summary" },
  "forecast.horizon": { vi: "Tầm nhìn dự báo", en: "Forecast Horizon" },
  "forecast.adjusted": { vi: "Đã điều chỉnh cho cảm xúc tin tức", en: "Adjusted for news sentiment" },
  "forecast.params": { vi: "Chi tiết tham số dự báo", en: "Forecast Parameters Detail" },
  "forecast.expected_return": { vi: "Lợi nhuận KV", en: "Expected Return" },
  "forecast.uncertainty": { vi: "Độ bất định", en: "Uncertainty" },
  "forecast.sentiment_score": { vi: "Điểm cảm xúc", en: "Sentiment Score" },
  "forecast.impact_weight": { vi: "Trọng số tác động", en: "Impact Weight" },
  "forecast.confidence": { vi: "Độ tin cậy", en: "Confidence" },
  "forecast.model_desc": { vi: "Mô hình: Gaussian có điều kiện với điều chỉnh tin tức LLM.", en: "Model: Conditional Gaussian with LLM news adjustment." },
  "forecast.formula": { vi: "Công thức:", en: "Formula:" },
  "forecast.p_gain": { vi: "XS Tăng", en: "P(Gain)" },
  "forecast.risk_score": { vi: "Điểm rủi ro", en: "Risk Score" },
  "forecast.risk_reward": { vi: "Rủi ro/Lợi nhuận", en: "Risk/Reward" },
  "forecast.signal": { vi: "Tín hiệu", en: "Signal" },

  // News Page
  "news.title": { vi: "Phân tích tin tức & Cảm xúc", en: "News & Sentiment Analysis" },
  "news.subtitle": { vi: "Phân tích tin tức bằng LLM với lượng hóa tác động cảm xúc", en: "LLM-powered news analysis with quantified sentiment impact" },
  "news.latest": { vi: "Phân tích tin mới nhất", en: "Latest News Analysis" },
  "news.llm_model": { vi: "Mô hình tác động LLM", en: "LLM Impact Model" },
  "news.how_adjust": { vi: "Cách cảm xúc tin tức điều chỉnh dự báo cơ sở", en: "How news sentiment adjusts the base forecast" },
  "news.base_forecast": { vi: "Dự báo cơ sở (Chỉ dữ liệu giá)", en: "Base Forecast (Price Data Only)" },
  "news.news_adjustment": { vi: "ĐIỀU CHỈNH TIN TỨC", en: "NEWS ADJUSTMENT" },
  "news.llm_sentiment": { vi: "Phân tích cảm xúc LLM", en: "LLM Sentiment Analysis" },
  "news.adjusted_forecast": { vi: "Dự báo đã điều chỉnh", en: "Adjusted Forecast" },
  "news.expected_return": { vi: "Lợi nhuận kỳ vọng", en: "Expected Return" },
  "news.uncertainty": { vi: "Độ bất định", en: "Uncertainty" },
  "news.adj_return": { vi: "Lợi nhuận đã điều chỉnh", en: "Adjusted Return" },
  "news.adj_uncertainty": { vi: "Độ bất định đã điều chỉnh", en: "Adjusted Uncertainty" },
  "news.impact": { vi: "Tác động", en: "Impact" },

  // Trade Page
  "trade.title": { vi: "Tín hiệu giao dịch & Danh mục", en: "Trade Signals & Portfolio" },
  "trade.subtitle": { vi: "Động cơ quyết định nhận biết rủi ro với chỉ số định lượng", en: "Risk-aware decision engine with quantitative metrics" },
  "trade.history": { vi: "Lịch sử tín hiệu giao dịch", en: "Trade Signals History" },
  "trade.last_signals": { vi: "10 tín hiệu gần nhất", en: "Last 10 signals" },
  "trade.date": { vi: "Ngày", en: "Date" },
  "trade.signal": { vi: "Tín hiệu", en: "Signal" },
  "trade.price": { vi: "Giá", en: "Price" },
  "trade.strength": { vi: "Cường độ", en: "Strength" },
  "trade.reason": { vi: "Lý do", en: "Reason" },
  "trade.risk_adjusted": { vi: "Hiệu suất điều chỉnh rủi ro", en: "Risk-Adjusted Performance" },
  "trade.risk_adjusted_sub": { vi: "Các chỉ số chiến lược giao dịch chính", en: "Key trading strategy metrics" },
  "trade.trades": { vi: "Giao dịch", en: "Trades" },

  // Risk Analysis Page
  "risk.title": { vi: "Phân tích rủi ro", en: "Risk Analysis" },
  "risk.subtitle": { vi: "Phân tích rủi ro toàn diện với VaR, CVaR và stress testing", en: "Comprehensive risk analysis with VaR, CVaR and stress testing" },
  "risk.var_analysis": { vi: "Phân tích VaR", en: "VaR Analysis" },
  "risk.var_analysis_sub": { vi: "Giá trị rủi ro tại các mức tin cậy", en: "Value at Risk at different confidence levels" },
  "risk.confidence_level": { vi: "Mức tin cậy", en: "Confidence Level" },
  "risk.var_value": { vi: "Giá trị VaR", en: "VaR Value" },
  "risk.potential_loss": { vi: "Lỗ tiềm năng", en: "Potential Loss" },
  "risk.stress_test": { vi: "Stress Test kịch bản", en: "Scenario Stress Test" },
  "risk.stress_test_sub": { vi: "Tác động đến danh mục dưới các điều kiện thị trường", en: "Portfolio impact under market conditions" },
  "risk.scenario": { vi: "Kịch bản", en: "Scenario" },
  "risk.market_move": { vi: "Biến động TT", en: "Market Move" },
  "risk.portfolio_impact": { vi: "Tác động DM", en: "Portfolio Impact" },
  "risk.recovery_days": { vi: "Ngày phục hồi", en: "Recovery Days" },
  "risk.tail_risk": { vi: "Rủi ro đuôi (Tail Risk)", en: "Tail Risk Analysis" },
  "risk.tail_risk_sub": { vi: "Phân phối lỗ đuôi với các phân vị cực trị", en: "Loss distribution tail with extreme percentiles" },
  "risk.correlation": { vi: "Ma trận tương quan", en: "Correlation Matrix" },
  "risk.correlation_sub": { vi: "Tương quan giữa các yếu tố rủi ro", en: "Correlation between risk factors" },
  "risk.risk_summary": { vi: "Tóm tắt rủi ro", en: "Risk Summary" },
  "risk.risk_level": { vi: "Mức rủi ro", en: "Risk Level" },
  "risk.moderate": { vi: "TRUNG BÌNH", en: "MODERATE" },
  "risk.overall_risk": { vi: "Rủi ro tổng thể", en: "Overall Risk" },
  "risk.risk_capacity": { vi: "Khả năng chịu rủi ro", en: "Risk Capacity" },
  "risk.daily_var": { vi: "VaR hàng ngày", en: "Daily VaR" },
  "risk.weekly_var": { vi: "VaR hàng tuần", en: "Weekly VaR" },
  "risk.monthly_var": { vi: "VaR hàng tháng", en: "Monthly VaR" },
  "risk.cvar95": { vi: "CVaR 95%", en: "CVaR 95%" },
  "risk.max_loss_30d": { vi: "Lỗ tối đa 30 ngày", en: "Max Loss 30D" },
  "risk.beta": { vi: "Beta", en: "Beta" },

  // Settings Page
  "settings.title": { vi: "Cấu hình mô hình", en: "Model Configuration" },
  "settings.subtitle": { vi: "Điều chỉnh tham số mô hình dự báo và quản lý rủi ro", en: "Adjust forecasting model parameters and risk management" },
  "settings.model_params": { vi: "Tham số mô hình", en: "Model Parameters" },
  "settings.model_params_sub": { vi: "Điều chỉnh các tham số cốt lõi của mô hình dự báo", en: "Adjust core forecasting model parameters" },
  "settings.alpha": { vi: "Alpha (Trọng số cảm xúc)", en: "Alpha (Sentiment Weight)" },
  "settings.alpha_desc": { vi: "Hệ số điều chỉnh lợi nhuận theo cảm xúc tin tức", en: "Sentiment adjustment coefficient for expected return" },
  "settings.beta_param": { vi: "Beta (Trọng số bất định)", en: "Beta (Uncertainty Weight)" },
  "settings.beta_desc": { vi: "Hệ số điều chỉnh độ bất định theo cảm xúc", en: "Sentiment adjustment coefficient for uncertainty" },
  "settings.lookback": { vi: "Cửa sổ nhìn lại (ngày)", en: "Lookback Window (days)" },
  "settings.lookback_desc": { vi: "Số ngày dữ liệu giá sử dụng cho dự báo", en: "Number of price data days for forecasting" },
  "settings.risk_params": { vi: "Tham số rủi ro", en: "Risk Parameters" },
  "settings.risk_params_sub": { vi: "Cấu hình ngưỡng rủi ro và quản lý vốn", en: "Configure risk thresholds and capital management" },
  "settings.var_confidence": { vi: "Mức tin cậy VaR (%)", en: "VaR Confidence Level (%)" },
  "settings.max_position": { vi: "Vị thế tối đa (%)", en: "Max Position Size (%)" },
  "settings.stop_loss": { vi: "Cắt lỗ (%)", en: "Stop Loss (%)" },
  "settings.take_profit": { vi: "Chốt lời (%)", en: "Take Profit (%)" },
  "settings.trading_rules": { vi: "Quy tắc giao dịch", en: "Trading Rules" },
  "settings.trading_rules_sub": { vi: "Cấu hình quy tắc tạo tín hiệu giao dịch", en: "Configure trade signal generation rules" },
  "settings.min_prob": { vi: "XS tăng tối thiểu cho MUA (%)", en: "Min P(Gain) for BUY (%)" },
  "settings.min_sharpe": { vi: "Sharpe tối thiểu cho MUA", en: "Min Sharpe for BUY" },
  "settings.max_var_buy": { vi: "VaR tối đa cho MUA (%)", en: "Max VaR for BUY (%)" },
  "settings.save": { vi: "Lưu cấu hình", en: "Save Configuration" },
  "settings.reset": { vi: "Đặt lại mặc định", en: "Reset to Defaults" },
  "settings.saved": { vi: "Đã lưu!", en: "Saved!" },
  "settings.system_info": { vi: "Thông tin hệ thống", en: "System Information" },
  "settings.model_version": { vi: "Phiên bản mô hình", en: "Model Version" },
  "settings.last_trained": { vi: "Lần train cuối", en: "Last Trained" },
  "settings.data_points": { vi: "Điểm dữ liệu", en: "Data Points" },
  "settings.inference_time": { vi: "Thời gian suy luận", en: "Inference Time" },
} as const

type TranslationKey = keyof typeof translations

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("vi")

  const t = useCallback((key: TranslationKey): string => {
    const entry = translations[key]
    if (!entry) return key
    return entry[locale] || key
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
