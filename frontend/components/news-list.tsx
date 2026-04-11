"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getLatestNews, type NewsItem } from "@/lib/api"
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"

const categoryColors: Record<string, string> = {
  earnings: "bg-success/10 text-success border-success/30",
  expansion: "bg-primary/10 text-primary border-primary/30",
  macro: "bg-accent/10 text-accent border-accent/30",
  product: "bg-chart-3/10 text-chart-3 border-chart-3/30",
  market: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  technical: "bg-muted text-muted-foreground border-border",
  regulatory: "bg-warning/10 text-warning border-warning/30",
}

export function NewsList({ data, loading: externalLoading }: { data?: NewsItem[], loading?: boolean }) {
  const { t } = useI18n()
  const [internalNewsData, setInternalNewsData] = useState<NewsItem[]>([])
  const [internalLoading, setInternalLoading] = useState(true)

  const newsData = data || internalNewsData
  const loading = externalLoading !== undefined ? externalLoading : internalLoading

  useEffect(() => {
    // Chỉ fetch nội bộ nếu không có data từ bên ngoài truyền vào
    if (!data) {
      async function fetchNews() {
        try {
          const data = await getLatestNews(10)
          setInternalNewsData(data)
        } catch (error) {
          console.error("Error fetching news:", error)
        } finally {
          setInternalLoading(false)
        }
      }
      fetchNews()
    }
  }, [data])

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-card-foreground">{t("news.latest")}</CardTitle>
          <Badge variant="outline" className="text-[10px]">{newsData.length} {t("common.articles")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {newsData.map((news) => (
          <div key={news.id} className="p-3 rounded-md border border-border hover:bg-secondary/50 transition-colors group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", categoryColors["market"])}>
                    Market
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{news.source}</span>
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                    {news.time_display || (news.timestamp ? new Date(news.timestamp).toLocaleTimeString() : "vừa xong")}
                  </span>
                </div>
                <a 
                  href={news.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block group-hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4"
                >
                  <h4 className="text-xs font-medium text-card-foreground leading-relaxed">
                    {news.title || "Tin tức VIC (Tiêu đề đang cập nhật...)"}
                  </h4>
                </a>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className={cn(
                  "flex items-center gap-1 text-xs font-mono font-medium",
                  (news.sentiment_score ?? 0) > 0 ? "text-success" : (news.sentiment_score ?? 0) < 0 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {(news.sentiment_score ?? 0) > 0 ? <TrendingUp className="w-3 h-3" /> : (news.sentiment_score ?? 0) < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {(news.sentiment_score ?? 0) > 0 && "+"}{(news.sentiment_score ?? 0).toFixed(2)}
                </div>
                <span className="text-[10px] text-muted-foreground">{t("news.impact")}: {(news.impact_weight ?? 1.0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
