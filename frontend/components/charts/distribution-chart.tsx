"use client"

import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateDistributionData, FORECAST_RESULTS } from "@/lib/mock-data"
import { useI18n } from "@/lib/i18n"

export function DistributionChart({ mu, sigma }: { mu?: number; sigma?: number }) {
  const { t } = useI18n()
  const m = mu ?? FORECAST_RESULTS.mu
  const s = sigma ?? FORECAST_RESULTS.sigma
  const data = generateDistributionData(m, s)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.distribution")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {"N("}&#956;={`${(m * 100).toFixed(1)}%, `}&#963;={`${(s * 100).toFixed(1)}%)`}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-chart-1" />
              <span className="text-muted-foreground">{t("chart.pdf")}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-3 bg-success" />
              <span className="text-muted-foreground">&#956;</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-3 bg-destructive" />
              <span className="text-muted-foreground">VaR 95%</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="distGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="x" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} formatter={(value: number) => [value.toFixed(4), t("common.density")]} labelFormatter={(label) => `${t("common.return")}: ${label}%`} />
              <ReferenceLine x={m * 100} stroke="#10b981" strokeWidth={2} label={{ value: `μ=${(m * 100).toFixed(1)}%`, fill: "#10b981", fontSize: 11, position: "top" }} />
              <ReferenceLine x={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine x={FORECAST_RESULTS.var95} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" label={{ value: `VaR=${FORECAST_RESULTS.var95}%`, fill: "#ef4444", fontSize: 11, position: "top" }} />
              <Area type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} fill="url(#distGradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
