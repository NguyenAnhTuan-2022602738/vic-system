import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { PipelineResult } from "@/lib/api"

interface NewsImpactModelProps {
  data: PipelineResult | null
}

export function NewsImpactModel({ data }: NewsImpactModelProps) {
  const { t } = useI18n()
  
  if (!data) return <Card className="bg-card h-[400px] flex items-center justify-center border-border opacity-50 italic text-muted-foreground">Đang tải dữ liệu Pipeline...</Card>

  const f = data

  // Hệ số điều tiết (hiển thị trên giao diện, phải khớp với Backend: ai-service/app/core/config.py)
  const ALPHA = 0.3
  const BETA = 0.2

  // ===== GIÁ TRỊ TỪ BACKEND (Single Source of Truth) =====
  // Dự báo cơ sở (LSTM thuần)
  const muBasePct = f.lstm_prediction * 100        // μ
  const sigmaBasePct = f.base_uncertainty * 100     // σ
  
  // Dự báo đã điều chỉnh (Backend đã tính sẵn theo công thức fusion)
  const muAdjPct = f.expected_return * 100          // μ_adj = Backend's mu_adj
  const sigmaAdjPct = f.adjusted_uncertainty * 100  // σ_adj = Backend's sigma_adj

  // Sentiment từ LLM  
  const sentiment = f.sentiment_score               // [-1, 1]
  const impact = f.impact_weight                    // [0, 1]

  // Helpers hiển thị
  const signPrefix = (val: number) => val >= 0 ? "+" : ""
  const sentimentColor = sentiment >= 0 ? "text-success" : "text-destructive"
  const sentimentBarColor = sentiment >= 0 ? "bg-success" : "bg-destructive"
  const muAdjColor = muAdjPct >= 0 ? "text-success" : "text-destructive"

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-card-foreground">{t("news.llm_model")}</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/30">
            <Brain className="w-3 h-3 mr-1" />
            {t("common.ai_powered")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{t("news.how_adjust")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base Model (LSTM Only) */}
        <div className="p-3 rounded-md bg-secondary/50 border border-border">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">{t("news.base_forecast")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-muted-foreground">&#956; ({t("news.expected_return")})</span>
              <p className="text-sm font-bold font-mono text-foreground">{signPrefix(muBasePct)}{muBasePct.toFixed(2)}%</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">&#963; ({t("news.uncertainty")})</span>
              <p className="text-sm font-bold font-mono text-foreground">{sigmaBasePct.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-medium">{t("news.news_adjustment")}</span>
          <Zap className="w-4 h-4 text-accent" />
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* LLM Sentiment Analysis */}
        <div className="p-3 rounded-md bg-accent/5 border border-accent/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("news.llm_sentiment")}</p>
            <span className="text-[9px] text-muted-foreground/70 font-mono">Tất cả tin / 48h</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-muted-foreground">{t("forecast.sentiment_score")}</span>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-bold font-mono ${sentimentColor}`}>{signPrefix(sentiment)}{sentiment.toFixed(2)}</p>
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${sentimentBarColor}`} style={{ width: `${((sentiment + 1) / 2) * 100}%` }} />
                </div>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">{t("forecast.impact_weight")}</span>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold font-mono text-primary">{impact.toFixed(2)}</p>
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${impact * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulas — khớp với Backend (forecast_service.py dòng 233-234) */}
        <div className="p-3 rounded-md bg-secondary/30 border border-border font-mono text-[11px] space-y-1">
          <p className="text-muted-foreground">
            <span className="text-accent">&#956;_adj</span> = &#956; &times; (1 + <span className="text-yellow-400">&#945;</span> &times; sentiment &times; impact)
            <span className="text-muted-foreground/50 ml-2">&#945;={ALPHA}</span>
          </p>
          <p className="text-muted-foreground">
            <span className="text-accent">&#963;_adj</span> = &#963; &times; (1 + <span className="text-yellow-400">&#946;</span> &times; |sentiment| &times; impact)
            <span className="text-muted-foreground/50 ml-2">&#946;={BETA}</span>
          </p>
        </div>

        {/* Adjusted Forecast — Giá trị lấy trực tiếp từ Backend (Single Source of Truth) */}
        <div className="p-3 rounded-md bg-success/5 border border-success/20">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">{t("news.adjusted_forecast")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-muted-foreground">&#956;_adj ({t("news.adj_return")})</span>
              <p className={`text-sm font-bold font-mono ${muAdjColor}`}>{signPrefix(muAdjPct)}{muAdjPct.toFixed(2)}%</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">&#963;_adj ({t("news.adj_uncertainty")})</span>
              <p className="text-sm font-bold font-mono text-warning">{sigmaAdjPct.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
