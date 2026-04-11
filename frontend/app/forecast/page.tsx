"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { HorizonChart } from "@/components/charts/horizon-chart"
import { RiskGauge } from "@/components/charts/risk-gauge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { FORECAST_HORIZONS, generateDistributionData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  Bar, BarChart, Cell, Line, LineChart, ComposedChart
} from "recharts"
import { Clock } from "lucide-react"

export default function ForecastPage() {
  const { t, locale } = useI18n()
  const [horizonIdx, setHorizonIdx] = useState(2)
  const horizon = FORECAST_HORIZONS[horizonIdx]

  const mu = horizon.expectedReturn / 100
  const sigma = horizon.uncertainty / 100
  const distData = generateDistributionData(mu, sigma)

  const ciData = FORECAST_HORIZONS.map((h) => ({
    label: `${h.days}D`,
    mean: h.expectedReturn,
    upper: h.expectedReturn + h.uncertainty * 1.96,
    lower: h.expectedReturn - h.uncertainty * 1.96,
    upper1: h.expectedReturn + h.uncertainty,
    lower1: h.expectedReturn - h.uncertainty,
  }))

  const monteCarloSims = Array.from({ length: 8 }, () => {
    const path = [{ day: 0, value: 47.8 }]
    let price = 47.8
    for (let d = 1; d <= horizon.days; d++) {
      const dailyReturn = (mu / horizon.days) + (sigma / Math.sqrt(horizon.days)) * (Math.random() * 2 - 1)
      price = price * (1 + dailyReturn)
      path.push({ day: d, value: parseFloat(price.toFixed(2)) })
    }
    return path
  })

  const mcData = Array.from({ length: horizon.days + 1 }, (_, d) => {
    const point: Record<string, number> = { day: d }
    monteCarloSims.forEach((sim, i) => {
      point[`sim${i}`] = sim[d].value
    })
    return point
  })

  const targets = [
    { target: "-5%", probability: 5 },
    { target: "-3%", probability: 12 },
    { target: "-1%", probability: 22 },
    { target: "0%", probability: 28 },
    { target: "+1%", probability: 45 },
    { target: "+3%", probability: 72 },
    { target: "+5%", probability: 85 },
    { target: "+7%", probability: 92 },
    { target: "+10%", probability: 97 },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <DashboardHeader
        title={t("forecast.title")}
        subtitle={t("forecast.subtitle")}
      />

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Horizon Selector */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{t("forecast.horizon")}</span>
              </div>
              <div className="flex-1 max-w-md">
                <Slider value={[horizonIdx]} onValueChange={(v) => setHorizonIdx(v[0])} max={FORECAST_HORIZONS.length - 1} step={1} className="w-full" />
              </div>
              <Badge variant="outline" className="text-sm font-mono bg-primary/10 text-primary border-primary/30 px-3">
                {horizon.days} {t("common.days")}
              </Badge>
              <Badge variant="outline" className={cn(
                "text-xs font-semibold",
                horizon.recommendation === "BUY" ? "bg-success/10 text-success border-success/30" :
                horizon.recommendation === "HOLD" ? "bg-warning/10 text-warning border-warning/30" :
                "bg-destructive/10 text-destructive border-destructive/30"
              )}>
                {horizon.recommendation}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Risk Gauges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <RiskGauge value={horizon.probGain} label={t("forecast.p_gain")} max={100} />
          <RiskGauge value={Math.round(100 - Math.abs(horizon.var95) * 10)} label={t("forecast.risk_score")} max={100} />
          <RiskGauge value={Math.round(horizon.expectedReturn / horizon.uncertainty * 40)} label={t("forecast.risk_reward")} max={100} />
          <RiskGauge value={Math.round((1 - horizon.uncertainty / 10) * 100)} label={t("forecast.confidence")} max={100} />
        </div>

        {/* Main Forecast Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Distribution */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.distribution")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {"N("}&#956;={`${horizon.expectedReturn.toFixed(1)}%, `}&#963;={`${horizon.uncertainty.toFixed(1)}%) | ${t("forecast.horizon")}: ${horizon.days}D`}
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={distData} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
                    <defs>
                      <linearGradient id="distGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="x" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={{ stroke: "#1e293b" }} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "#e2e8f0" }} formatter={(v: number) => [v.toFixed(4), t("common.density")]} labelFormatter={(l) => `${t("common.return")}: ${l}%`} />
                    <ReferenceLine x={horizon.expectedReturn} stroke="#10b981" strokeWidth={2} label={{ value: `μ=${horizon.expectedReturn.toFixed(1)}%`, fill: "#10b981", fontSize: 11, position: "top" }} />
                    <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="4 4" />
                    <ReferenceLine x={horizon.var95} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" label={{ value: `VaR=${horizon.var95}%`, fill: "#ef4444", fontSize: 11, position: "top" }} />
                    <Area type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} fill="url(#distGrad2)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monte Carlo */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.monte_carlo")}</CardTitle>
                  <p className="text-xs text-muted-foreground">8 {t("chart.monte_carlo_sub")} {horizon.days} {t("common.days")}</p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/30">{t("common.simulated")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mcData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "#e2e8f0" }} />
                    {monteCarloSims.map((_, i) => (
                      <Line key={i} type="monotone" dataKey={`sim${i}`} stroke={`hsl(${210 + i * 20}, 70%, ${55 + i * 5}%)`} strokeWidth={1.5} dot={false} strokeOpacity={0.6} />
                    ))}
                    <ReferenceLine y={47.8} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: t("common.current"), fill: "#94a3b8", fontSize: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CI & CDF */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.ci_fan")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("chart.ci_fan_sub")}</p>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ciData} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
                    <defs>
                      <linearGradient id="ci95" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="ci68" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "#e2e8f0" }} formatter={(v: number) => [`${v.toFixed(1)}%`]} />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ci95)" />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="url(#ci95)" />
                    <Area type="monotone" dataKey="upper1" stroke="none" fill="url(#ci68)" />
                    <Area type="monotone" dataKey="lower1" stroke="none" fill="url(#ci68)" />
                    <Line type="monotone" dataKey="mean" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.cum_prob")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("chart.cum_prob_sub")}</p>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={targets} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="target" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "#e2e8f0" }} formatter={(v: number) => [`${v}%`, t("common.probability")]} />
                    <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                      {targets.map((entry, index) => (
                        <Cell key={index} fill={entry.probability >= 50 ? "#10b981" : entry.probability >= 25 ? "#f59e0b" : "#ef4444"} fillOpacity={0.7} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="probability" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3, fill: "#0ea5e9" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <HorizonChart />

        {/* Parameters Table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{t("forecast.params")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t("forecast.horizon")}</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">E[Return]</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">&#963;</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">{t("forecast.p_gain")}</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">VaR 95%</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Sharpe</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("forecast.signal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {FORECAST_HORIZONS.map((h, i) => (
                    <tr key={i} className={cn("border-b border-border/50 hover:bg-secondary/30 transition-colors", horizonIdx === i && "bg-primary/5")}>
                      <td className="py-2.5 px-3 font-mono text-foreground font-medium">{h.days}D</td>
                      <td className="py-2.5 px-3 text-right font-mono text-success">+{h.expectedReturn.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-warning">{h.uncertainty.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-primary">{h.probGain}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-destructive">{h.var95}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-foreground">{(h.expectedReturn / h.uncertainty).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant="outline" className={cn(
                          "text-[10px] px-1.5 py-0 font-semibold",
                          h.recommendation === "BUY" ? "bg-success/10 text-success border-success/30" :
                          h.recommendation === "HOLD" ? "bg-warning/10 text-warning border-warning/30" :
                          "bg-destructive/10 text-destructive border-destructive/30"
                        )}>
                          {h.recommendation}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
