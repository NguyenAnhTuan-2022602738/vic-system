"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPerformanceMetrics, PerformancePoint } from "@/lib/api"
import { useI18n } from "@/lib/i18n"
import { Skeleton } from "@/components/ui/skeleton"

interface PerformanceChartProps {
  customData?: any[]
  loading?: boolean
}

export function PerformanceChart({ customData, loading: externalLoading }: PerformanceChartProps) {
  const { t } = useI18n()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customData) {
      setData(customData)
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        const result = await getPerformanceMetrics()
        setData(result.history)
      } catch (error) {
        console.error("Failed to fetch performance data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [customData])

  const isLoading = externalLoading || loading


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
            <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.performance")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t("chart.performance_sub")}</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded bg-[#3b82f6]" />
              <span className="text-muted-foreground">{t("chart.strategy")}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded bg-[#f59e0b]" />
              <span className="text-muted-foreground">{t("chart.vnindex")}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} 
                axisLine={{ stroke: "var(--border)" }} 
                tickLine={false} 
                tickFormatter={(val) => val.split("-").slice(1).join("/")}
              />
              <YAxis 
                domain={["auto", "auto"]} 
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} 
                formatter={(val: number) => [val.toFixed(2), "Value"]}
              />
              <Area type="monotone" dataKey="strategy_value" stroke="#3b82f6" strokeWidth={2} fill="url(#stratGrad)" dot={false} name={t("chart.strategy")} />
              <Area type="monotone" dataKey="benchmark_value" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#benchGrad)" dot={false} name={t("chart.vnindex")} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
