"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { NewsList } from "@/components/news-list"
import { SentimentChart, SentimentDistribution } from "@/components/charts/sentiment-chart"
import { SentimentImpactChart } from "@/components/charts/sentiment-impact-chart"
import { NewsImpactModel } from "@/components/news-impact-model"
import { useI18n } from "@/lib/i18n"
import { getLatestPipeline, getLatestNews, triggerNewsCrawl, type PipelineResult, type NewsItem } from "@/lib/api"
import { RefreshCw, Zap } from "lucide-react"

export default function NewsPage() {
  const { t } = useI18n()
  const [pipelineData, setPipelineData] = useState<PipelineResult | null>(null)
  const [paginatedData, setPaginatedData] = useState<{ news: NewsItem[], total_count: number, page: number }>({ news: [], total_count: 0, page: 1 })
  const [loading, setLoading] = useState(true)
  const [isCrawling, setIsCrawling] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchAllData = async (forceCrawl = false, page = 1) => {
    if (forceCrawl) setIsCrawling(true)
    else setLoading(true)

    try {
      if (forceCrawl) {
        await triggerNewsCrawl(10)
      }
      
      // Gọi API lấy tin tức theo trang
      const result = await getLatestNews(10, page)
      setPaginatedData(result)

      const pipeline = await getLatestPipeline()
      setPipelineData(pipeline)
    } catch (error) {
      console.error("Error-fetching-news-page-data:", error)
    } finally {
      setLoading(false)
      setIsCrawling(false)
    }
  }

  useEffect(() => {
    fetchAllData(false, currentPage)
  }, [currentPage])

  const handleCrawl = () => {
    fetchAllData(true, 1) // Cào xong quay lại trang 1
    setCurrentPage(1)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-background/50 backdrop-blur-md border-b border-border sticky top-0 z-10 gap-4">
        <div>
          <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary fill-primary/20" />
            {t("news.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("news.subtitle")}</p>
        </div>
        
        <button 
          onClick={handleCrawl}
          disabled={isCrawling || loading}
          className="flex items-center gap-2 bg-success/10 hover:bg-success/20 text-success border border-success/30 px-4 py-2 rounded-md font-medium text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
        >
          {isCrawling ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isCrawling ? "Đang cào tin và phân tích..." : "Cào tin VIC mới nhất"}
        </button>
      </div>

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SentimentChart />
          <SentimentDistribution />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SentimentImpactChart />
          <NewsImpactModel data={pipelineData} />
        </div>

        <NewsList 
          data={paginatedData} 
          loading={loading || isCrawling} 
          page={currentPage}
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  )
}
