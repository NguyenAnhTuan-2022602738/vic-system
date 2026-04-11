"use client"

import { useEffect, useState } from "react"
import { 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ErrorBar, 
  Line, 
  ComposedChart 
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMultiHorizonForecast, ForecastResult } from "@/lib/api"
import { useI18n } from "@/lib/i18n"
import { Skeleton } from "@/components/ui/skeleton"

export function HorizonChart() {
  const { t } = useI18n()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getMultiHorizonForecast()
        if (!result?.horizons) {
          console.warn("Horizon data empty or invalid")
          return
        }
        const chartData = result.horizons.map((h: ForecastResult) => ({
          label: `${h.horizon}D`,
          expectedReturn: h.expected_return * 100,
          errorBar: h.uncertainty * 100,
          probGain: h.probability_gain * 100,
          recommendation: h.recommendation
        }))
        setData(chartData)
      } catch (error) {
        console.error("Failed to fetch horizon data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.horizon")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t("chart.horizon_sub")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 15, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
              />
              <Bar dataKey="expectedReturn" radius={[4, 4, 0, 0]} name={t("forecast.expected_return")}>
                {data.map((entry, index) => (
                  <Cell 
                    key={index} 
                    fill={entry.recommendation === "BUY" ? "#10b981" : entry.recommendation === "HOLD" ? "#f59e0b" : "#ef4444"} 
                    fillOpacity={0.8} 
                  />
                ))}
                <ErrorBar dataKey="errorBar" width={6} strokeWidth={1.5} stroke="var(--muted-foreground)" />
              </Bar>
              <Line type="monotone" dataKey="probGain" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3, fill: "#0ea5e9" }} name={t("forecast.p_gain")} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
