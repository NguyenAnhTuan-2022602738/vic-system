"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { MetricCard } from "@/components/metric-card"
import { PriceChart } from "@/components/charts/price-chart"
import { TechnicalChart } from "@/components/charts/technical-chart"
import { DistributionChart } from "@/components/charts/distribution-chart"
import { ForecastCard } from "@/components/forecast-card"
import { VolumeProfile } from "@/components/charts/volume-profile"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { HorizonChart } from "@/components/charts/horizon-chart"
import { SentimentChart } from "@/components/charts/sentiment-chart"
import { useI18n } from "@/lib/i18n"
import { getForecast, getDashboardStats, checkHealth } from "@/lib/api"
import type { ForecastResult, DashboardStats } from "@/lib/api"

export default function DashboardPage() {
  const { t } = useI18n()
  const [forecast, setForecast] = useState<ForecastResult | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    loadLiveData()
  }, [])

  const loadLiveData = async () => {
    const healthy = await checkHealth()
    if (!healthy) {
      setIsLive(false)
      return
    }
    setIsLive(true)

    try {
      const [fc, st] = await Promise.all([getForecast(5), getDashboardStats()])
      setForecast(fc)
      setStats(st)
    } catch {
      setIsLive(false)
    }
  }

  // Live values or mock defaults
  const currentPrice = "47,800"
  const expectedReturn = forecast ? `${forecast.expected_return >= 0 ? "+" : ""}${(forecast.expected_return * 100).toFixed(1)}%` : "+3.5%"
  const pGain = forecast ? `${Math.round(forecast.probability_gain * 100)}%` : "72%"
  const var95 = forecast ? `${(forecast.var_95 * 100).toFixed(1)}%` : "-1.8%"
  const sharpe = forecast ? (forecast.expected_return / forecast.uncertainty).toFixed(2) : "1.85"
  const winRate = stats ? `${stats.counts.forecasts > 0 ? Math.round(stats.recommendations.buy / Math.max(stats.counts.forecasts, 1) * 100) : 68}%` : "68%"
  const retTrend = forecast ? (forecast.expected_return >= 0 ? "up" : "down") as const : "up" as const

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <DashboardHeader
        title={t("dashboard.title")}
        subtitle={isLive ? `${t("dashboard.subtitle")} — 🟢 LIVE API` : t("dashboard.subtitle")}
      />

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label={t("metric.current_price")}
            value={currentPrice}
            subValue="VND"
            iconName="bar-chart"
            trend="up"
            trendValue="1.28%"
          />
          <MetricCard
            label={t("metric.expected_return")}
            value={expectedReturn}
            subValue={t("metric.5d_horizon")}
            iconName="trending-up"
            trend={retTrend}
            trendValue={isLive ? "LIVE" : t("common.adjusted")}
          />
          <MetricCard
            label={t("metric.p_gain")}
            value={pGain}
            subValue={t("metric.probability")}
            iconName="target"
            trend={forecast && forecast.probability_gain > 0.5 ? "up" : "down"}
            trendValue={forecast && forecast.probability_gain > 0.5 ? t("common.high") : t("common.low") || "Low"}
          />
          <MetricCard
            label={t("metric.var95")}
            value={var95}
            subValue={t("metric.max_loss")}
            iconName="shield"
            trend="down"
            trendValue={var95}
          />
          <MetricCard
            label={t("metric.sharpe_ratio")}
            value={sharpe}
            subValue={t("metric.risk_adjusted")}
            iconName="activity"
            trend={Number(sharpe) > 1 ? "up" : "down"}
            trendValue={Number(sharpe) > 1 ? t("common.good") : "Low"}
          />
          <MetricCard
            label={t("metric.win_rate")}
            value={winRate}
            subValue={t("metric.trades_count")}
            iconName="percent"
            trend="up"
            trendValue={winRate}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PriceChart />
          </div>
          <ForecastCard />
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DistributionChart />
          <HorizonChart />
        </div>

        {/* Third Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TechnicalChart />
          </div>
          <VolumeProfile />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PerformanceChart />
          <SentimentChart />
        </div>
      </main>
    </div>
  )
}
