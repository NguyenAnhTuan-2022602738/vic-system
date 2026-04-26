"use client"

import { useState, useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { Target, Clock } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { MetricCard } from "@/components/metric-card"
import { CandlestickChart } from "@/components/charts/candlestick-chart"
import { TechnicalChart } from "@/components/charts/technical-chart"
import { DistributionChart } from "@/components/charts/distribution-chart"
import { ForecastCard } from "@/components/forecast-card"
import { VolumeProfile } from "@/components/charts/volume-profile"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { HorizonChart } from "@/components/charts/horizon-chart"
import { ModelComparisonCards } from "@/components/model-comparison-cards"
import { AICoPilot } from "@/components/ai-co-pilot"

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
import { toast } from "sonner"

import { useDashboard } from "@/context/dashboard-context"

export default function DashboardPage() {
  const { t } = useI18n()
  const { 
    forecast, pipeline, marketData, stats, isLive, isLoading, 
    isSyncing, lastSyncTime, refreshData, setForecast, setIsLoading 
  } = useDashboard()
  
  // Sandbox states (keep local for now as they are ephemeral)
  const [sandboxNews, setSandboxNews] = useState("")
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationData, setSimulationData] = useState<any | null>(null)

  // Flashback states (keep local)
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

  // Sentiment Fusion Parameters (Now Fixed/AI-Optimized)
  const [alpha, setAlpha] = useState(0.04)
  const [beta, setBeta] = useState(0.15)
  const [targetReturn, setTargetReturn] = useState(0.05)
  const [horizon, setHorizon] = useState(5)

  useEffect(() => {
    if (selectedDate) {
      loadHistoricalData(selectedDate)
    }
    setupSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [selectedDate])

  const handleTriggerUpdate = async () => {
    // We already have refreshData in context, but let's keep the specialized logic here or move it.
    // Let's use the context's refreshData.
    await refreshData()
  }

  const loadHistoricalData = async (date: string) => {
    const todayStr = new Date().toISOString().split('T')[0]
    
    if (date === todayStr) {
      toast.info("Chế độ Flashback: Dự báo hôm nay", {
        description: "Dữ liệu thực tế T+2 hiện chưa có để đối chiếu. Bạn có thể xem kết quả dự báo.",
        duration: 5000,
      })
    } else {
      toast.success(`Đang tải dữ liệu Flashback cho ngày ${date}`, {
        icon: <Clock className="w-4 h-4" />,
      })
    }

    setIsFlashbackLoading(true)
    setFlashbackData(null) // Reset ngay để UI "nhảy" sang trạng thái Loading
    setHistoricalNews([])   // Reset tin tức lịch sử
    
    try {
      const comparison = await getHistoryComparison(date)
      setFlashbackData(comparison)
      
      const news = await getHistoryNews(date)
      setHistoricalNews(news)
    } catch (err) {
      console.error("Flashback loading error:", err)
      toast.error("Lỗi khi tải dữ liệu quá khứ. Vui lòng thử lại.")
    } finally {
      setIsFlashbackLoading(false)
    }
  }

  const handleScenarioSimulation = async () => {
    if (!sandboxNews.trim()) return
    setIsSimulating(true)
    
    const toastId = toast.loading("AI đang phân tích giả lập kịch bản...")
    
    try {
      const res = await getAdjustedForecast(3, sandboxNews)
      if (res) {
        setSimulationData(res)
        toast.success("Giả lập thành công!", { id: toastId })
      } else {
        toast.error("Không nhận được dữ liệu giả lập từ Server.", { id: toastId })
      }
    } catch (err) {
      console.error("Simulation error:", err)
      toast.error("Lỗi khi chạy AI Simulation. Backend có thể đang quá tải.", { id: toastId })
    } finally {
      setIsSimulating(false)
    }
  }

  const handleClearSimulation = () => {
    setSandboxNews("")
    setSimulationData(null)
  }

  const setupSocket = () => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3005"
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
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

  const lastMarketItem = marketData.length > 0 ? marketData[marketData.length - 1] : null
  
  // displayPrice: Ưu tiên Live Price > Flashback Entry Price > Last Market Price
  const flashbackPrice = selectedDate && flashbackData?.forecast?.last_price_used 
    ? flashbackData.forecast.last_price_used 
    : null;
    
  const displayPrice = (selectedDate && !liveData) 
    ? (flashbackPrice || (lastMarketItem ? lastMarketItem.close : 47800))
    : (liveData?.price || (lastMarketItem ? lastMarketItem.close : 47800))
    
  const currentPriceStr = displayPrice.toLocaleString()
  
  // Logic for display metrics
  // Ưu tiên: Simulation (Sandbox) > Flashback (Lịch sử) > Forecast (Live)
  const activeForecast = simulationData || (selectedDate ? flashbackData?.forecast : forecast)
  
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
      
      {/* SCENARIO SIMULATION (Hidden as requested) */}
      {/* 
      <div className="mx-6 mb-6 p-5 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
        ...
      </div>
      */}

      <main className="flex-1 p-6 space-y-6 overflow-auto pt-4">
        {selectedDate && (
          <div className="mb-6">
            <AccuracyCard data={flashbackData} isLoading={isFlashbackLoading} />
          </div>
        )}

        {/* ROW 1: VIC REALTIME CHART (Full Width) */}
        <div className="w-full">
          <CandlestickChart className="min-h-[450px]" liveData={liveData} />
        </div>

        {/* ROW 2: FORECAST & MODEL COMPARISON (Side by Side) */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-3">
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
          </div>
          <div className="lg:col-span-3">
            <ModelComparisonCards data={forecast?.comparison} loading={isLoading} />
          </div>
        </div>




        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TechnicalChart data={marketData} />
          </div>
          <VolumeProfile />
        </div>

        <TradeSignalsTable />
        <AICoPilot />
      </main>
    </div>
  )
}
