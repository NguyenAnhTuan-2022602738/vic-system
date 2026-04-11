"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RISK_METRICS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"
import { useI18n } from "@/lib/i18n"

export function RiskMetricsPanel() {
  const { t, locale } = useI18n()
  const m = RISK_METRICS

  const metrics = [
    { label: t("metric.sharpe_ratio"), value: m.sharpeRatio.toFixed(2), good: m.sharpeRatio > 1.5 },
    { label: t("metric.max_drawdown"), value: `${m.maxDrawdown}%`, good: m.maxDrawdown > -5 },
    { label: t("metric.win_rate"), value: `${m.winRate}%`, good: m.winRate > 60 },
    { label: t("metric.profit_factor"), value: m.profitFactor.toFixed(2), good: m.profitFactor > 1.5 },
    { label: locale === "vi" ? "TB Thang" : "Avg Win", value: `+${m.avgWin}%`, good: true },
    { label: locale === "vi" ? "TB Thua" : "Avg Loss", value: `${m.avgLoss}%`, good: false },
    { label: t("metric.total_trades"), value: m.totalTrades.toString(), good: true },
    { label: t("metric.avg_holding"), value: `${m.avgHoldingDays}d`, good: true },
    { label: "Calmar Ratio", value: m.calmarRatio.toFixed(2), good: m.calmarRatio > 2 },
    { label: "Sortino Ratio", value: m.sortinoRatio.toFixed(2), good: m.sortinoRatio > 2 },
  ]

  const radarData = [
    { metric: "Sharpe", value: Math.min(m.sharpeRatio / 3, 1) * 100, fullMark: 100 },
    { metric: t("metric.win_rate"), value: m.winRate, fullMark: 100 },
    { metric: t("metric.profit_factor"), value: Math.min(m.profitFactor / 3, 1) * 100, fullMark: 100 },
    { metric: "Calmar", value: Math.min(m.calmarRatio / 5, 1) * 100, fullMark: 100 },
    { metric: "Sortino", value: Math.min(m.sortinoRatio / 3, 1) * 100, fullMark: 100 },
    { metric: locale === "vi" ? "DD thap" : "Low DD", value: Math.max(0, 100 + m.maxDrawdown * 10), fullMark: 100 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">{t("trade.risk_adjusted")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{t("trade.risk_adjusted_sub")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 border border-border">
                <span className="text-[11px] text-muted-foreground">{m.label}</span>
                <span className={cn("text-xs font-bold font-mono", m.good ? "text-success" : "text-destructive")}>{m.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.radar")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{t("chart.radar_sub")}</p>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: "#94a3b8" }} domain={[0, 100]} axisLine={false} />
                <Radar name={t("chart.strategy")} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
