"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getLatestNews, type NewsItem } from "@/lib/api"
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"

const categoryColors: Record<string, string> = {
  Direct: "bg-success/10 text-success border-success/30",
  Industry: "bg-primary/10 text-primary border-primary/30",
  Macro: "bg-accent/10 text-accent border-accent/30",
  Global: "bg-chart-3/10 text-chart-3 border-chart-3/30",
  Market: "bg-chart-2/10 text-chart-2 border-chart-2/30",
}

const trustLabels: Record<number, { label: string, color: string }> = {
  1.0: { label: "Chính thống", color: "text-success" },
  0.95: { label: "Uy tín cao", color: "text-primary" },
  0.9: { label: "Uy tín", color: "text-primary/80" },
  0.85: { label: "Quốc tế", color: "text-accent" },
  0.8: { label: "Tổng hợp", color: "text-muted-foreground" },
  0.7: { label: "Tham khảo", color: "text-muted-foreground/70" },
}

import { ChevronLeft, ChevronRight } from "lucide-react"

export interface NewsListProps { 
  data?: { news: NewsItem[], total_count: number, page: number }, 
  loading?: boolean,
  page?: number,
  onPageChange?: (page: number) => void
}

export function NewsList({ data: externalData, loading: externalLoading, page: initialPage = 1, onPageChange }: NewsListProps) {
  const { t } = useI18n()
  const [internalNewsData, setInternalNewsData] = useState<{ news: NewsItem[], total_count: number }>({ news: [], total_count: 0 })
  const [internalLoading, setInternalLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(initialPage)

  // Đồng bộ prop page từ component cha vào state nội bộ
  useEffect(() => {
    setCurrentPage(initialPage)
  }, [initialPage])

  const newsData = (externalData?.news || internalNewsData.news)
  const totalCount = (externalData?.total_count || internalNewsData.total_count)
  const loading = externalLoading !== undefined ? externalLoading : internalLoading
  
  const limit = 10
  const totalPages = Math.ceil(totalCount / limit)

  useEffect(() => {
    if (!externalData) {
      async function fetchNews() {
        setInternalLoading(true)
        try {
          const result = await getLatestNews(limit, currentPage)
          setInternalNewsData({ news: result.news, total_count: result.total_count })
        } catch (error) {
          console.error("Error fetching news:", error)
        } finally {
          setInternalLoading(false)
        }
      }
      fetchNews()
    }
  }, [externalData, currentPage])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    if (onPageChange) {
      onPageChange(newPage)
    } else {
      setCurrentPage(newPage)
    }
    // Scroll to top of list
    const el = document.getElementById('news-list-container')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  const renderPagination = () => {
    let pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages = [1, 2, 3, 4, '...', totalPages];
      } else if (currentPage >= totalPages - 2) {
        pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }

    return pages.map((p, index) => {
      if (p === '...') {
        return <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">...</span>;
      }
      const pageNum = p as number;
      return (
        <button
          key={`page-${pageNum}`}
          onClick={() => handlePageChange(pageNum)}
          disabled={loading || currentPage === pageNum}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-md border text-[11px] font-bold transition-all",
            currentPage === pageNum 
              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
              : "border-border hover:bg-secondary text-muted-foreground"
          )}
        >
          {pageNum}
        </button>
      );
    });
  }

  return (
    <Card className="bg-card border-border" id="news-list-container">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <CardTitle className="text-sm font-bold text-card-foreground uppercase tracking-tight">{t("news.latest")}</CardTitle>
             <Badge variant="secondary" className="bg-success/20 text-success border-success/30 text-[9px] font-bold">TMĐT MODE</Badge>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono bg-muted/50">{totalCount} {t("common.articles")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 bg-muted/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {newsData.length > 0 ? newsData.map((news) => (
            <div key={news.id} className="relative flex flex-col justify-between p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 group overflow-hidden">
               {/* Accent line on hover */}
               <div className="absolute left-0 top-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
               
               <div className="flex-1">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2">
                     <Badge variant="outline" className={cn("text-[9px] px-2 py-0.5 font-bold rounded-sm tracking-wider", categoryColors[news.category || "Market"])}>
                       {news.category || "Market"}
                     </Badge>
                     <span className="text-[10px] text-muted-foreground font-medium uppercase truncate max-w-[100px]">
                       {news.source} 
                       <span className={cn("ml-1", trustLabels[news.trust_score || 0.7]?.color)}>✓</span>
                     </span>
                   </div>
                   <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono shrink-0">
                     {(() => {
                       try {
                         const d = new Date(news.timestamp)
                         if (isNaN(d.getTime())) return news.time_display || "vừa xong"
                         const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                         const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                         return `${timeStr} ${dateStr} • ${news.time_display || ""}`
                       } catch(e) {
                         return news.time_display || "vừa xong"
                       }
                     })()}
                   </span>
                 </div>

                 <a 
                   href={news.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="block mb-4 group-hover:text-primary transition-colors"
                 >
                   <h4 className="text-sm font-bold text-card-foreground leading-snug line-clamp-3">
                     {news.title || "Tin tức VIC (Tiêu đề đang cập nhật...)"}
                   </h4>
                 </a>
               </div>

               {/* Chân card - Hiện Sentiment kiểu tem giá */}
               <div className="flex items-center justify-between pt-3 border-t border-border/50">
                 <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Sức khỏe tin tức</span>
                 <div className="flex items-center gap-2">
                   <div className={cn(
                     "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold shadow-sm",
                     (news.sentiment_score ?? 0) > 0 ? "bg-success text-success-foreground" : (news.sentiment_score ?? 0) < 0 ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"
                   )}>
                     {(news.sentiment_score ?? 0) > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : (news.sentiment_score ?? 0) < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                     {(news.sentiment_score ?? 0) > 0 && "+"}{(news.sentiment_score ?? 0).toFixed(2)}
                   </div>
                 </div>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-20 flex justify-center items-center">
              <span className="text-muted-foreground text-sm italic">Không có tin tức nào được tìm thấy.</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* FOOTER phân trang E-commerce */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center p-4 border-t border-border bg-card">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="p-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-30 transition-all text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1 mx-2">
              {renderPagination()}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="p-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-30 transition-all text-muted-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
