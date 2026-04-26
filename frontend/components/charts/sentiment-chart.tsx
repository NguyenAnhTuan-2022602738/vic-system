"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Area, ComposedChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLatestNews, type NewsItem } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function SentimentChart() {
  const { t } = useI18n()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getLatestNews(20)
        const news = response.news || []
        const timeline = news.reverse().map((n: any, i) => {
          const dateStr = n.timestamp || n.published_at || n.createdAt;
          return {
            date: new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sentiment: n.sentiment_score ?? 0,
            volume: 1, // Giả lập mỗi tin là 1 đơn vị volume
          }
        })
        setData(timeline)
      } catch (error) {
        console.error("Error-fetching-timeline:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <Card className="bg-card h-[320px] flex items-center justify-center"><Loader2 className="animate-spin" /></Card>

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.sentiment_timeline")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t("chart.sentiment_timeline_sub")}</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">{t("chart.positive")}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">{t("chart.negative")}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis yAxisId="sentiment" domain={[-1, 1]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar yAxisId="sentiment" dataKey="sentiment" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.sentiment >= 0 ? "var(--success)" : "var(--destructive)"} fillOpacity={0.6} />
                ))}
              </Bar>
              <Area yAxisId="sentiment" type="monotone" dataKey="sentiment" stroke="var(--primary)" strokeWidth={2} fill="var(--primary)" fillOpacity={0.1} dot={{ r: 2, fill: "var(--primary)" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function SentimentDistribution() {
  const { t } = useI18n()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getLatestNews(20)
        const news = response.news || []
        const pos = news.filter((n: any) => (n.sentiment_score ?? 0) > 0.1).length
        const neg = news.filter((n: any) => (n.sentiment_score ?? 0) < -0.1).length
        const neu = news.length - pos - neg
        
        setData([
          { name: "Overall", positive: pos, negative: neg, neutral: neu },
        ])
      } catch (error) {
        console.error("Error-fetching-dist:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <Card className="bg-card h-[320px] flex items-center justify-center"><Loader2 className="animate-spin" /></Card>

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.sentiment_category")}</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">{t("chart.sentiment_category_sub")}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="positive" stackId="a" fill="var(--success)" radius={[0, 0, 0, 0]} name={t("chart.positive")} fillOpacity={0.8} />
              <Bar dataKey="neutral" stackId="a" fill="#f59e0b" name={t("chart.neutral")} fillOpacity={0.8} />
              <Bar dataKey="negative" stackId="a" fill="var(--destructive)" radius={[0, 4, 4, 0]} name={t("chart.negative")} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
