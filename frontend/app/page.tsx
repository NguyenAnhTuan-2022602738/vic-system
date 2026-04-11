"use client"

import { useState, useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { Target } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { MetricCard } from "@/components/metric-card"
import { CandlestickChart } from "@/components/charts/candlestick-chart"
import { TechnicalChart } from "@/components/charts/technical-chart"
import { DistributionChart } from "@/components/charts/distribution-chart"
import { ForecastCard } from "@/components/forecast-card"
import { VolumeProfile } from "@/components/charts/volume-profile"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { HorizonChart } from "@/components/charts/horizon-chart"
import { SentimentChart } from "@/components/charts/sentiment-chart"
import { ComparisonChart } from "@/components/charts/comparison-chart"
import { TradingSignals } from "@/components/trading-signals"
import { TradeSignalsTable } from "@/components/trade-signals-table"
import { AccuracyCard } from "@/components/accuracy-card"

import { useI18n } from "@/lib/i18n"
import { 
  getLatestPipeline,
  triggerForecastPipeline,
  getDashboardStats, 
  checkHealth, 
  getMarketHistory,
  getAdjustedForecast,
  getHistoryComparison,
  getHistoryNews,
  ForecastResult, 
  DashboardStats,
  MarketHistoryItem,
  PipelineResult,
  AdjustedForecastResult,
  HistoryComparisonResult,
  NewsItem
} from "@/lib/api"

export default function DashboardPage() {
  const { t } = useI18n()
  const [forecast, setForecast] = useState<ForecastResult | null>(null)
  const [pipeline, setPipeline] = useState<PipelineResult | null>(null)
  const [marketData, setMarketData] = useState<MarketHistoryItem[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  
  // Sandbox states
  const [sandboxNews, setSandboxNews] = useState("")
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationData, setSimulationData] = useState<any | null>(null)

  // Flashback states
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [isFlashbackLoading, setIsFlashbackLoading] = useState(false)
  const [flashbackData, setFlashbackData] = useState<HistoryComparisonResult | null>(null)
  const [historicalNews, setHistoricalNews] = useState<NewsItem[]>([])
  
  // Real-time states
  const [liveData, setLiveData] = useState<{
    price: number;
    open: number;
    high: number;
    low: number;
    symbol: string;
  } | null>(null)
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null)
  const socketRef = useRef<Socket | null>(null)

  // Sentiment Fusion Parameters
  const [alpha, setAlpha] = useState(0.05)
  const [beta, setBeta] = useState(0.2)
  const [targetReturn, setTargetReturn] = useState(0.05)
  const [horizon, setHorizon] = useState(5)

  useEffect(() => {
    if (selectedDate) {
      loadHistoricalData(selectedDate)
    } else {
      loadLiveData()
    }
    setupSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [selectedDate])

  useEffect(() => {
    // Pipeline is stateful, no need to reload on param change unless we want to, 
    // but the sliders are now just visual or we can hide them.
  }, [alpha, beta, targetReturn, horizon])

  const handleTriggerUpdate = async () => {
    setIsSyncing(true)
    try {
      const res = await triggerForecastPipeline()
      setPipeline(res)
      mapPipelineToForecast(res)
      
      // ĐỒNG BỘ: Tải lại toàn bộ dữ liệu (Giá, Stats, Market History) sau khi Pipeline tính toán xong
      await loadLiveData()
      setLastSyncTime(new Date().toLocaleTimeString())
    } catch (err) {
      console.error("Pipeline trigger error:", err)
      alert("Lỗi khi chạy Pipeline T+2: " + err)
    } finally {
      setIsSyncing(false)
    }
  }

  const loadHistoricalData = async (date: string) => {
    setIsFlashbackLoading(true)
    try {
      // 1. Lấy so sánh dự báo và thực tế
      const comparison = await getHistoryComparison(date)
      setFlashbackData(comparison)
      
      // 2. Map forecast để Dashboard đồng bộ
      if (comparison.forecast) {
        mapPipelineToForecast(comparison.forecast as any)
      }

      // 3. Lấy tin tức lịch sử
      const news = await getHistoryNews(date)
      setHistoricalNews(news)

      // 4. Lấy dữ liệu biểu đồ quanh ngày đó
      const marketRes = await getMarketHistory(date)
      setMarketData(marketRes)
      
    } catch (err) {
      console.error("Flashback loading error:", err)
    } finally {
      setIsFlashbackLoading(false)
    }
  }

  const handleScenarioSimulation = async () => {
    if (!sandboxNews.trim()) return
    setIsSimulating(true)
    try {
      // Gọi lên AI Service với tin tức giả lập
      const res = await getAdjustedForecast(3, sandboxNews)
      // res là AdjustedForecastResult: { expected_return, ... }
      setSimulationData(res)
    } catch (err) {
      console.error("Simulation error:", err)
      alert("Lỗi khi chạy kịch bản: " + err)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleClearSimulation = () => {
    setSandboxNews("")
    setSimulationData(null)
  }

  const mapPipelineToForecast = (p: PipelineResult) => {
    setForecast({
      horizon: 3,
      expected_return: p.expected_return,
      uncertainty: p.risk_var,
      probability_gain: p.win_rate,
      probability_target: p.win_rate,
      var_95: p.risk_var,
      recommendation: p.final_action,
      sentiment_score: p.sentiment_score,
      news: [],
      comparison: p.comparison_data || [],
      trading_signal: {

        action: p.final_action as any,
        confidence: p.confidence,
        stop_loss: 0,
        take_profit: 0,
        risk_level: p.risk_var > 0.05 ? "High" : "Medium"
      }
    })
  }

  const setupSocket = () => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    })

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id)
    })

    socket.on("price_update", (data: { price: number; open: number; high: number; low: number; symbol: string }) => {
      setLiveData((prev) => {
        if (prev !== null && data.price !== prev.price) {
          setPriceFlash(data.price > prev.price ? "up" : "down")
          setTimeout(() => setPriceFlash(null), 1000)
        }
        return data
      })
    })

    socketRef.current = socket
  }

  const loadLiveData = async () => {
    const healthy = await checkHealth()
    if (!healthy) {
      setIsLive(false)
      setIsLoading(false)
      return
    }
    setIsLive(true)

    try {
      const [pl, st, mk] = await Promise.all([
        getLatestPipeline().catch(() => null), // If empty DB, it will fail
        getDashboardStats(),
        getMarketHistory("2024-03-01")
      ])
      
      if (pl) {
        setPipeline(pl)
        mapPipelineToForecast(pl)
      }
      setStats(st)
      setMarketData(mk)
    } catch (err) {
      console.error("Fetch error:", err)
      setIsLive(false)
    } finally {
      setIsLoading(false)
    }
  }

  const lastMarketItem = marketData.length > 0 ? marketData[marketData.length - 1] : null
  const displayPrice = liveData?.price || (lastMarketItem ? lastMarketItem.close : 47800)
  const currentPriceStr = displayPrice.toLocaleString()
  
  const activeForecast = simulationData || forecast
  
  // Tự động chọn field: expected_return (thực tế) hoặc adjusted_mu (giả lập)
  const getVal = (obj: any, realField: string, simField: string) => {
    if (!obj) return 0
    return obj[simField] !== undefined ? obj[simField] : (obj[realField] || 0)
  }

  const muVal = getVal(activeForecast, 'expected_return', 'adjusted_mu')
  const pGainVal = getVal(activeForecast, 'probability_gain', 'probability_gain')
  const varVal = getVal(activeForecast, 'var_95', 'var_95')
  const sigmaVal = getVal(activeForecast, 'uncertainty', 'adjusted_sigma')

  const expectedReturnStr = activeForecast 
    ? `${muVal >= 0 ? "+" : ""}${(muVal * 100).toFixed(1)}%` 
    : "+3.5%"
  
  const pGainStr = activeForecast ? `${Math.round(pGainVal * 100)}%` : "72%"
  const varStr = activeForecast ? `${(varVal * 100).toFixed(1)}%` : "-1.8%"
  const sharpeStr = activeForecast ? (muVal / Math.max(sigmaVal, 0.001)).toFixed(2) : "1.85"
  
  const winRateStr = stats 
    ? `${stats.counts.forecasts > 0 ? Math.round(stats.recommendations.buy / Math.max(stats.counts.forecasts, 1) * 100) : 68}%` 
    : "68%"
  
  const retTrend = muVal >= 0 ? "up" : "down"
  const prevClose = marketData.length > 1 ? marketData[marketData.length - 2].close : (lastMarketItem?.close || 47800)
  const priceTrendValue = (((displayPrice - prevClose) / prevClose) * 100).toFixed(2)

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <DashboardHeader
        title={t("dashboard.title")}
        subtitle={selectedDate ? `Flashback Mode: ${selectedDate}` : (isLive ? `${t("dashboard.subtitle")} — 🟢 LIVE SYNC (TCBS)` : t("dashboard.subtitle"))}
        currentPrice={displayPrice}
        priceChange={Number(priceTrendValue)}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* FLASHBACK BANNER */}
      {selectedDate && (
        <div className="mx-6 mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Historical Flashback Mode Active</span>
          </div>
          <button 
            onClick={() => setSelectedDate("")}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-md transition-colors cursor-pointer"
          >
            Exit Flashback
          </button>
        </div>
      )}

      <div className="px-6 pb-2 flex justify-between items-center -mt-2">
        <p className="text-sm font-medium">
          {isSyncing ? (
            <span className="text-blue-500 animate-pulse">⏳ Đang phân tích dữ liệu mới nhất...</span>
          ) : lastSyncTime ? (
            <span className="text-green-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Đã cập nhật lúc: {lastSyncTime} (Dữ liệu T-1)
            </span>
          ) : pipeline ? (
            <span className="text-muted-foreground">Trạng thái: Đã đồng bộ dữ liệu dự báo</span>
          ) : (
            <span className="text-amber-500">Chưa có dữ liệu dự báo. Hãy ấn nút Cập nhật.</span>
          )}
        </p>
        <button 
          onClick={handleTriggerUpdate}
          disabled={isSyncing}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
        >
          {isSyncing ? (
            <><div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div> Đang chạy Pipeline (1-2 phút)...</>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
              Cập Nhật Dữ Liệu T-1 & Dự Báo Mới
            </>
          )}
        </button>
      </div>
      
      {/* SCENARIO SIMULATION (SANDBOX) - PREMIUM GLASS STYLE */}
      <div className="mx-6 mb-6 p-5 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.71-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path d="m11.5 11 8.5-8.5"/><path d="M11 15 3 7"/><path d="m15 11 8 8"/><path d="M20 17.5c1.26-1.5 5-2 5-2s-.5 3.74-2 5c-.84.71-2.13.71-2.91-.09a2.18 2.18 0 0 1-.09-2.91Z"/><path d="M6 19c.7-4.4 4.6-8.3 9-9"/><path d="M9 15c4.4-.7 12.3-4.6 13-9"/></svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-widest flex items-center gap-2">
              Simulation Center
              {simulationData && (
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-black rounded uppercase tracking-tighter animate-pulse">
                  Active
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">Điều chỉnh dự báo bằng kịch bản tin tức giả lập</p>
          </div>
          
          {simulationData && (
            <button
              onClick={handleClearSimulation}
              className="ml-auto flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg border border-white/5 hover:bg-red-500/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              Xóa kịch bản
            </button>
          )}
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <textarea
              value={sandboxNews}
              onChange={(e) => setSandboxNews(e.target.value)}
              placeholder="Nhập kịch bản tin tức... (Ví dụ: VIC nhận được đầu tư 500 triệu USD)"
              className="w-full min-h-[80px] p-4 text-sm bg-slate-950/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-slate-200 placeholder:text-slate-600 transition-all resize-none"
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono italic">
              AI NLP Hybrid Engine
            </div>
          </div>
          
          <button
            onClick={handleScenarioSimulation}
            disabled={isSimulating || !sandboxNews.trim()}
            className="w-40 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-bold text-sm tracking-tight shadow-lg shadow-indigo-500/20 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSimulating ? (
              <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M12 8h.01"/><path d="M18 16h.01"/><path d="M6 16h.01"/><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z"/></svg>
                Chạy Giả Lập
              </>
            )}
          </button>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-6 overflow-auto pt-4">
        {/* FLASHBACK ACCURACY DISPLAY */}
        {selectedDate && (
          <div className="mb-6">
            <AccuracyCard data={flashbackData} isLoading={isFlashbackLoading} />
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label={t("metric.current_price")}
            value={currentPriceStr}
            subValue="VND"
            iconName="bar-chart"
            trend={Number(priceTrendValue) >= 0 ? "up" : "down"}
            trendValue={`${Math.abs(Number(priceTrendValue))}%`}
            className={priceFlash === "up" ? "animate-pulse bg-green-500/10" : priceFlash === "down" ? "animate-pulse bg-red-500/10" : ""}
          />
          <MetricCard
            label={t("metric.expected_return")}
            value={expectedReturnStr}
            subValue="3 ngày (T+2)"
            iconName="trending-up"
            trend={retTrend}
            trendValue={simulationData ? "SIMULATED" : (isLive ? "LIVE" : t("common.adjusted"))}
            className={simulationData ? "border-indigo-500/30 bg-indigo-500/5 backdrop-blur-sm" : ""}
          />
          <MetricCard
            label={t("metric.p_gain")}
            value={pGainStr}
            subValue={t("metric.probability")}
            iconName="target"
            trend={pGainVal > 0.5 ? "up" : "down"}
            trendValue={simulationData ? "SIMULATED" : (pGainVal > 0.5 ? t("common.high") : t("common.low"))}
            className={simulationData ? "border-indigo-500/30 bg-indigo-500/5 backdrop-blur-sm" : ""}
          />
          <MetricCard
            label={t("metric.var95")}
            value={varStr}
            subValue={t("metric.max_loss")}
            iconName="shield"
            trend="down"
            trendValue={simulationData ? "SIMULATED" : varStr}
            className={simulationData ? "border-indigo-500/30 bg-indigo-500/5 backdrop-blur-sm" : ""}
          />
          <MetricCard
            label={t("metric.sharpe_ratio")}
            value={sharpeStr}
            subValue={t("metric.risk_adjusted")}
            iconName="activity"
            trend={Number(sharpeStr) > 1 ? "up" : "down"}
            trendValue={simulationData ? "SIMULATED" : (Number(sharpeStr) > 1 ? t("common.good") : "Low")}
            className={simulationData ? "border-indigo-500/30 bg-indigo-500/5 backdrop-blur-sm" : ""}
          />
          <MetricCard
            label={t("metric.win_rate")}
            value={winRateStr}
            subValue={t("metric.trades_count")}
            iconName="percent"
            trend="up"
            trendValue={winRateStr}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <CandlestickChart className="h-full" liveData={liveData} />
          </div>
          <ForecastCard 
            data={selectedDate ? { ...forecast!, news: historicalNews } as any : forecast} 
            isLive={isLive} 
            loading={isLoading || isFlashbackLoading}
            params={{ alpha, beta, targetReturn, horizon }}
            onParamChange={(newParams) => {
              if (newParams.alpha !== undefined) setAlpha(newParams.alpha)
              if (newParams.beta !== undefined) setBeta(newParams.beta)
              if (newParams.targetReturn !== undefined) setTargetReturn(newParams.targetReturn)
              if (newParams.horizon !== undefined) setHorizon(newParams.horizon)
            }}
          />
          <TradingSignals signal={forecast?.trading_signal} loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ComparisonChart data={forecast?.comparison} />
          <HorizonChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TechnicalChart data={marketData} />
          </div>
          <VolumeProfile />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PerformanceChart />
          <SentimentChart />
        </div>

        <TradeSignalsTable />
      </main>

    </div>
  )
}
