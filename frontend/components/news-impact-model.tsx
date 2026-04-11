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
        {/* Base Model */}
        <div className="p-3 rounded-md bg-secondary/50 border border-border">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">{t("news.base_forecast")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-muted-foreground">&#956; ({t("news.expected_return")})</span>
              <p className="text-sm font-bold font-mono text-foreground">+{(f.lstm_prediction * 100).toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">&#963; ({t("news.uncertainty")})</span>
              <p className="text-sm font-bold font-mono text-foreground">{(f.base_uncertainty * 100).toFixed(1)}%</p>
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

        {/* LLM Analysis */}
        <div className="p-3 rounded-md bg-accent/5 border border-accent/20">
          <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">{t("news.llm_sentiment")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-muted-foreground">{t("forecast.sentiment_score")}</span>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold font-mono text-success">+{f.sentiment_score.toFixed(2)}</p>
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-success" style={{ width: `${((f.sentiment_score + 1) / 2) * 100}%` }} />
                </div>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">{t("forecast.impact_weight")}</span>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold font-mono text-primary">{f.impact_weight.toFixed(2)}</p>
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${f.impact_weight * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulas */}
        <div className="p-3 rounded-md bg-secondary/30 border border-border font-mono text-[11px] space-y-1">
          <p className="text-muted-foreground">
            <span className="text-accent">&#956;_adj</span> = &#956; x (1 + &#945; x sentiment x impact)
          </p>
          <p className="text-muted-foreground">
            <span className="text-accent">&#963;_adj</span> = &#963; x (1 + &#946; x |sentiment| x impact)
          </p>
        </div>

        {/* Adjusted Model */}
        <div className="p-3 rounded-md bg-success/5 border border-success/20">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">{t("news.adjusted_forecast")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-muted-foreground">&#956;_adj ({t("news.adj_return")})</span>
              <p className="text-sm font-bold font-mono text-success">+{f.expected_return.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">&#963;_adj ({t("news.adj_uncertainty")})</span>
              <p className="text-sm font-bold font-mono text-warning">{(f.adjusted_uncertainty * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
