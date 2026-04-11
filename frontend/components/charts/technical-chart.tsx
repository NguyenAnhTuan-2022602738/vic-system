"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TECHNICAL_INDICATORS } from "@/lib/mock-data"
import { useI18n } from "@/lib/i18n"
import { MarketHistoryItem } from "@/lib/api"

interface TechnicalChartProps {
  data?: MarketHistoryItem[]
}

export function TechnicalChart({ data: liveData }: TechnicalChartProps) {
  const { t } = useI18n()
  
  const rawData = liveData && liveData.length > 0 ? liveData : TECHNICAL_INDICATORS
  
  const data = rawData.slice(-30).map((d) => ({
    ...d,
    date: d.date.slice(5),
    signal: (d as any).macd_signal || (d as any).signal,
    sma20: (d as any).ma20 || (d as any).sma20,
  }))

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.technical")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rsi" className="space-y-3">
          <TabsList className="bg-secondary border border-border h-8">
            <TabsTrigger value="rsi" className="text-xs h-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">RSI</TabsTrigger>
            <TabsTrigger value="macd" className="text-xs h-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">MACD</TabsTrigger>
            <TabsTrigger value="bb" className="text-xs h-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Bollinger</TabsTrigger>
          </TabsList>

          <TabsContent value="rsi">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis domain={[30, 80]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Overbought", fill: "#ef4444", fontSize: 10 }} />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Oversold", fill: "#10b981", fontSize: 10 }} />
                  <Line type="monotone" dataKey="rsi" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="macd">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} />
                  <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} name="MACD" />
                  <Line type="monotone" dataKey="signal" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Signal" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="bb">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} />
                  <Line type="monotone" dataKey="bb_upper" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Upper Band" />
                  <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={2} dot={false} name="SMA 20" />
                  <Line type="monotone" dataKey="bb_lower" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Lower Band" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
