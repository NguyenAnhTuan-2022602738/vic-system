/**
 * API client — kết nối với web-backend (port 3000).
 * Có fallback sang mock data khi server không khả dụng.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export interface NewsItem {
  id: string
  title: string
  source: string
  timestamp: string
  time_display?: string
  url: string
  sentiment_score?: number
  impact_weight?: number
}

export interface ModelComparison {
  name: string
  expected_return: number
  mae: number
}

export interface TradingSignal {
  action: "BUY" | "SELL" | "HOLD"
  confidence: number
  stop_loss: number
  take_profit: number
  risk_level: "Low" | "Medium" | "High"
}

export interface ForecastResult {
  horizon: number
  expected_return: number
  uncertainty: number
  probability_gain: number
  probability_target: number
  var_95: number
  recommendation: string
  sentiment_score?: number
  news?: NewsItem[]
  comparison: ModelComparison[]
  trading_signal?: TradingSignal
}

export interface AdjustedForecastResult extends ForecastResult {
  original_mu: number
  original_sigma: number
  adjusted_mu: number
  adjusted_sigma: number
  sentiment_score: number
  impact_weight: number
}

export interface NewsAnalysisResult {
  sentiment_score: number
  impact_weight: number
  summary: string
}

export interface PipelineResult {
  symbol?: string
  target_date?: string
  expected_return: number
  lstm_prediction: number
  base_uncertainty: number
  adjusted_uncertainty: number
  risk_var: number
  win_rate: number
  sharpe_ratio: number
  sentiment_score: number
  impact_weight: number
  final_action: string
  confidence: number
  last_price_used: number
  latest_news_analyzed: number
  comparison_data?: ModelComparison[]
}


export interface MarketHistoryItem {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  rsi?: number
  macd?: number
  macd_signal?: number
  ma20?: number
  volatility?: number
}

export interface DashboardStats {
  counts: { forecasts: number; news_analyzed: number; trades: number }
  recommendations: { buy: number; hold: number; avoid: number }
  recent_forecasts: ForecastResult[]
}

export interface ForecastHistoryItem extends ForecastResult {
  _id: string
  createdAt: string
  is_adjusted: boolean
  sentiment_score?: number
}

export interface MultiHorizonResult {
  horizons: ForecastResult[]
}

export interface VolumeBin {
  price: number
  volume: number
  type: "support" | "resistance" | "neutral"
}

export interface VolumeProfileResult {
  symbol: string
  bins: VolumeBin[]
}

export interface PerformancePoint {
  date: string
  strategy_value: number
  benchmark_value: number
}

export interface TradeLog {
  _id: string;
  entry_date: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  quantity: number;
  horizon: number;
  predicted_mu: number;
  predicted_sigma: number;
  actual_return?: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeStats {
  totalTrades: number;
  closedTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  avgProfit: number;
  equityCurve: Array<{ date: string, value: number }>;
  distribution: Array<{ name: string, value: number }>;
}

export interface PerformanceResult {
  symbol: string
  history: Array<PerformancePoint & { signal?: string; daily_return?: number }>
  metrics: {
    total_trades: number
    win_rate: number
    profit_factor: number
    max_drawdown: number
    sharpe_ratio: number
    total_return: number
  }
}


export interface HistoryComparisonResult {
  forecast: PipelineResult & { expected_return_str: string; uncertainty_str?: string };
  actual: {
    entry_price: number;
    exit_price: number;
    actual_return: number;
    actual_return_str: string;
    exit_date: string;
  } | null;
  accuracy: {
    error_margin: string;
    direction_hit: boolean;
    score: string;
  };
  message?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  return json.data as T
}

// === Forecast ===

export async function getForecast({ 
  horizon, 
  target_return = 0.05, 
  alpha = 0.05, 
  beta = 0.2 
}: { 
  horizon: number, 
  target_return?: number, 
  alpha?: number, 
  beta?: number 
}): Promise<ForecastResult> {
  return apiFetch<ForecastResult>("/api/v1/forecast", {
    method: "POST",
    body: JSON.stringify({ horizon, target_return, alpha, beta }),
  })
}

export async function getAdjustedForecast(horizon: number, newsText: string): Promise<AdjustedForecastResult> {
  return apiFetch<AdjustedForecastResult>("/api/v1/forecast/adjusted", {
    method: "POST",
    body: JSON.stringify({ horizon, news_text: newsText }),
  })
}

export async function getForecastHistory(limit = 20): Promise<ForecastHistoryItem[]> {
  return apiFetch<ForecastHistoryItem[]>(`/api/v1/forecast/history?limit=${limit}`)
}

// === T+2 Stateful Pipeline ===

export async function getLatestPipeline(): Promise<PipelineResult> {
  return apiFetch<PipelineResult>("/api/v1/forecast/latest")
}

export async function triggerForecastPipeline(): Promise<PipelineResult> {
  return apiFetch<PipelineResult>("/api/v1/forecast/trigger-update", {
    method: "POST"
  })
}

// === News ===

export async function analyzeNews(text: string): Promise<NewsAnalysisResult> {
  return apiFetch<NewsAnalysisResult>("/api/v1/news/analyze", {
    method: "POST",
    body: JSON.stringify({ text }),
  })
}

export async function getLatestNews(limit = 10): Promise<NewsItem[]> {
  return apiFetch<NewsItem[]>(`/api/v1/news/latest?limit=${limit}`)
}

export async function triggerNewsCrawl(limit = 10): Promise<NewsItem[]> {
  return apiFetch<NewsItem[]>("/api/v1/news/trigger-crawl", {
    method: "POST",
    params: { limit }
  } as any)
}

export async function getHistoryNews(date: string, limit = 10): Promise<NewsItem[]> {
  return apiFetch<NewsItem[]>(`/api/v1/news/history?date=${date}&limit=${limit}`)
}

export async function getHistoryComparison(date: string): Promise<HistoryComparisonResult> {
  return apiFetch<HistoryComparisonResult>(`/api/v1/forecast/comparison?date=${date}`)
}

// === Dashboard ===

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/api/v1/dashboard/stats")
}

// === Market ===

export async function getMarketHistory(startDate = "2024-03-01"): Promise<MarketHistoryItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/market/history?startDate=${startDate}`)
  if (!res.ok) throw new Error("Failed to fetch market history")
  const json = await res.json()
  return json.data as MarketHistoryItem[]
}

export async function getMultiHorizonForecast(target_return = 0.05): Promise<MultiHorizonResult> {
  return apiFetch<MultiHorizonResult>(`/api/v1/forecast/multi-horizon?target_return=${target_return}`)
}

export async function getPerformanceMetrics(days = 30): Promise<PerformanceResult> {
  return apiFetch<PerformanceResult>(`/api/v1/forecast/performance?days=${days}`)
}


export async function getVolumeProfile(bins = 10): Promise<VolumeProfileResult> {
  return apiFetch<VolumeProfileResult>(`/api/v1/market/volume-profile?bins=${bins}`)
}

// === Trading Journal ===

export async function getTrades(): Promise<TradeLog[]> {
  return apiFetch<TradeLog[]>("/api/v1/trades")
}

export async function getTradeStats(): Promise<TradeStats> {
  return apiFetch<TradeStats>("/api/v1/trades/stats")
}

export async function createTrade(data: Partial<TradeLog>): Promise<TradeLog> {

  return apiFetch<TradeLog>("/api/v1/trades", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateTrade(id: string, data: Partial<TradeLog>): Promise<TradeLog> {
  return apiFetch<TradeLog>(`/api/v1/trades/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteTrade(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/trades/${id}`, {
    method: "DELETE",
  })
}



// === Health ===

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}
// === AI Assistant ===

export interface ChatResponse {
  answer: string;
  status: string;
}

export async function askAssistant(message: string, context?: string): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/api/v1/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  })
}
