"use client"

import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VIC_PRICE_DATA } from "@/lib/mock-data"
import { useI18n } from "@/lib/i18n"
import { MarketHistoryItem } from "@/lib/api"

interface PriceChartProps {
  data?: MarketHistoryItem[]
}

export function PriceChart({ data: liveData }: PriceChartProps) {
  const { t } = useI18n()
  
  const rawData = liveData && liveData.length > 0 ? liveData : VIC_PRICE_DATA
  
  // Chỉ lấy 30 ngày gần nhất để biểu đồ không bị quá dày
  const displayData = rawData.slice(-30).map((d) => ({
    ...d,
    date: d.date.slice(5), // Rút gọn 2024-03-20 -> 03-20
    change: d.close - (d as any).open,
  }))

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.price_action")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t("chart.price_action_sub")}</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-chart-1" />
              <span className="text-muted-foreground">{t("chart.close")}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-chart-2" />
              <span className="text-muted-foreground">{t("chart.volume")}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis yAxisId="price" domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Bar yAxisId="volume" dataKey="volume" fill="#10b981" fillOpacity={0.15} radius={[2, 2, 0, 0]} />
              <Area yAxisId="price" type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} fill="url(#priceGradient)" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
