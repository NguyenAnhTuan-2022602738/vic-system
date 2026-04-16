"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { TradeSignalsTable } from "@/components/trade-signals-table"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { RiskMetricsPanel } from "@/components/risk-metrics-panel"
import { DrawdownChart } from "@/components/charts/drawdown-chart"
import { TradeDistribution } from "@/components/charts/trade-distribution"
import { MetricCard } from "@/components/metric-card"
import { getTradeStats, TradeStats } from "@/lib/api"
import { useI18n } from "@/lib/i18n"

export default function TradePage() {
  const { t } = useI18n()
  const [stats, setStats] = useState<TradeStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getTradeStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch trade stats:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Callback khi dữ liệu giao dịch thay đổi (thêm/sửa/xoá lệnh)
  const handleTradeDataChanged = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  const displayData = stats?.equityCurve.map(p => ({
    date: p.date,
    strategy_value: p.value,
    benchmark_value: p.value * 0.95 // Mock benchmark for comparison
  }))

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <DashboardHeader
        title={t("trade.title")}
        subtitle={t("trade.subtitle")}
      />

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard 
            label={t("metric.total_trades")} 
            value={loading ? "..." : (stats?.totalTrades || 0).toString()} 
            iconName="bar-chart" 
            trend="neutral" 
            trendValue={t("common.active")} 
          />
          <MetricCard 
            label={t("metric.win_rate")} 
            value={loading ? "..." : `${stats?.winRate || 0}%`} 
            iconName="target" 
            trend={(stats?.winRate || 0) >= 50 ? "up" : "down"} 
            trendValue={(stats?.winRate || 0) >= 50 ? t("common.strong") : "Weak"} 
          />
          <MetricCard 
            label={t("metric.profit_factor")} 
            value={loading ? "..." : (stats?.profitFactor || 0).toFixed(2)} 
            iconName="trending-up" 
            trend={(stats?.profitFactor || 0) >= 1.5 ? "up" : "down"} 
            trendValue={(stats?.profitFactor || 0) >= 1.5 ? "Good" : "Low"} 
          />
          <MetricCard 
            label={t("metric.total_pnl")} 
            value={loading ? "..." : (stats?.totalPnL || 0).toLocaleString()} 
            subValue="VND"
            iconName="activity" 
            trend={(stats?.totalPnL || 0) >= 0 ? "up" : "down"} 
            trendValue={(stats?.totalPnL || 0) >= 0 ? "+" : ""} 
          />
          <MetricCard 
            label="Avg. Profit" 
            value={loading ? "..." : (stats?.avgProfit || 0).toLocaleString()} 
            iconName="shield" 
            trend="neutral" 
            trendValue="VND" 
          />
          <MetricCard 
            label="Closed Trades" 
            value={loading ? "..." : (stats?.closedTrades || 0).toString()} 
            iconName="percent" 
            trend="neutral" 
            trendValue="Trades" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PerformanceChart customData={displayData} loading={loading} />
          <DrawdownChart />
        </div>

        <RiskMetricsPanel />
        <TradeDistribution data={stats?.distribution} />
        
        {/* Trading Journal - giờ đã có form nhập lệnh */}
        <TradeSignalsTable onDataChanged={handleTradeDataChanged} />
      </main>
    </div>
  )
}
