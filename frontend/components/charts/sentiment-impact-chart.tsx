"use client"

import { useEffect, useState } from "react"
import { Scatter, ScatterChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLatestNews } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function SentimentImpactChart() {
  const { t } = useI18n()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const news = await getLatestNews(30)
        const points = news.map((n) => ({
          sentiment: n.sentiment_score ?? 0,
          impact: n.impact_weight ?? 0.5,
          title: n.title.slice(0, 40) + "...",
          z: (n.impact_weight ?? 0.5) * 100,
        }))
        setData(points)
      } catch (error) {
        console.error("Error-fetching-impact-data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <Card className="bg-card h-[360px] flex items-center justify-center border-border"><Loader2 className="animate-spin text-primary" /></Card>

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.sentiment_scatter")}</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">{t("chart.sentiment_scatter_sub")}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="sentiment" type="number" domain={[-1, 1]} name="Sentiment" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} label={{ value: t("forecast.sentiment_score"), position: "insideBottom", offset: -5, fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis dataKey="impact" type="number" domain={[0, 1]} name="Impact" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} label={{ value: t("forecast.impact_weight"), angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--muted-foreground)" }} />
              <ZAxis dataKey="z" range={[40, 200]} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} formatter={(value: number, name: string) => [value.toFixed(2), name]} />
              <Scatter data={data} fill="#3b82f6" fillOpacity={0.7} stroke="#3b82f6" strokeWidth={1} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
