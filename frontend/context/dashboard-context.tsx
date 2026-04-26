"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { 
  getLatestPipeline, 
  getDashboardStats, 
  getMarketHistory, 
  checkHealth,
  PipelineResult,
  DashboardStats,
  MarketHistoryItem,
  ForecastResult
} from "@/lib/api"

interface DashboardState {
  forecast: ForecastResult | null
  pipeline: PipelineResult | null
  marketData: MarketHistoryItem[]
  stats: DashboardStats | null
  isLive: boolean
  isLoading: boolean
  isSyncing: boolean
  lastSyncTime: string | null
  refreshData: () => Promise<void>
  setForecast: (f: ForecastResult | null) => void
  setIsLoading: (loading: boolean) => void
}

const DashboardContext = createContext<DashboardState | undefined>(undefined)

const STORAGE_KEY = "vic_dashboard_cache"

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [forecast, setForecast] = useState<ForecastResult | null>(null)
  const [pipeline, setPipeline] = useState<PipelineResult | null>(null)
  const [marketData, setMarketData] = useState<MarketHistoryItem[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Load from LocalStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setForecast(parsed.forecast)
        setPipeline(parsed.pipeline)
        setStats(parsed.stats)
        setMarketData(parsed.marketData)
        setLastSyncTime(parsed.lastSyncTime)
        setIsLoading(false) // Data is ready from cache
      } catch (err) {
        console.error("Failed to parse dashboard cache:", err)
      }
    }
    
    // Initial fetch to ensure data is fresh
    loadData()
  }, [])

  // Save to LocalStorage whenever relevant state changes
  useEffect(() => {
    if (!isLoading && !isSyncing) {
      const dataToCache = {
        forecast,
        pipeline,
        stats,
        marketData,
        lastSyncTime,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToCache))
    }
  }, [forecast, pipeline, stats, marketData, lastSyncTime, isLoading, isSyncing])

  const mapPipelineToForecast = useCallback((p: PipelineResult): ForecastResult => {
    return {
      horizon: 3,
      expected_return: p.expected_return,
      uncertainty: p.adjusted_uncertainty || p.base_uncertainty,
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
        stop_loss: p.stop_loss ?? 0,
        take_profit: p.take_profit ?? 0,
        risk_level: (p.adjusted_uncertainty > 0.04 ? "High" : p.adjusted_uncertainty > 0.02 ? "Medium" : "Low") as "High" | "Medium" | "Low"
      }
    }
  }, [])

  const loadData = useCallback(async () => {
    const isFirstLoad = !forecast
    if (isFirstLoad) setIsLoading(true)
    
    try {
      const healthy = await checkHealth()
      if (!healthy) {
        setIsLive(false)
        if (isFirstLoad) setIsLoading(false)
        return
      }
      setIsLive(true)

      const [pl, st, mk] = await Promise.all([
        getLatestPipeline().catch(() => null),
        getDashboardStats().catch(() => null),
        getMarketHistory("2024-03-01").catch(() => [])
      ])
      
      if (pl) {
        setPipeline(pl)
        setForecast(mapPipelineToForecast(pl))
      }
      if (st) setStats(st)
      if (mk.length > 0) setMarketData(mk)
      
      if (isFirstLoad) setLastSyncTime(new Date().toLocaleTimeString())
    } catch (err) {
      console.error("Dashboard data load error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [forecast, mapPipelineToForecast])

  const refreshData = async () => {
    setIsSyncing(true)
    const toastId = "pipeline-update";
    const { toast } = await import("sonner");
    
    toast.loading("Đang cào dữ liệu T-1 và chạy AI dự báo...", { id: toastId });
    
    try {
      const { triggerForecastPipeline } = await import("@/lib/api");
      const result = await triggerForecastPipeline();
      
      if (result) {
        toast.success("Cập nhật dữ liệu và dự báo thành công!", { id: toastId });
        await loadData();
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        toast.error("Pipeline thất bại hoặc không có dữ liệu mới.", { id: toastId });
      }
    } catch (err) {
      console.error("Refresh pipeline error:", err);
      toast.error("Lỗi khi kết nối với máy chủ AI Service.", { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <DashboardContext.Provider value={{
      forecast, pipeline, marketData, stats, isLive, isLoading, isSyncing, lastSyncTime,
      refreshData, setForecast, setIsLoading
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
