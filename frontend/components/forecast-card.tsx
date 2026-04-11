"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FORECAST_RESULTS } from "@/lib/mock-data"
import { getForecast, type ForecastResult } from "@/lib/api"
import { TrendingUp, TrendingDown, Shield, Target, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import { useI18n } from "@/lib/i18n"

import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { NewsItem } from "@/lib/api"

interface ForecastCardProps {
  data: ForecastResult | null
  isLive: boolean
  loading: boolean
  params: {
    alpha: number
    beta: number
    targetReturn: number
    horizon: number
  }
  onParamChange: (newParams: Partial<ForecastCardProps["params"]>) => void
}

export function ForecastCard({ data, isLive, loading, params, onParamChange }: ForecastCardProps) {
  const { t } = useI18n()

  // Use data if available, otherwise mock
  const f = data
    ? {
        horizon: data.horizon,
        expectedReturn: data.expected_return * 100,
        uncertainty: Math.abs(data.uncertainty) * 100,
        probabilityGain: Math.round(data.probability_gain * 100),
        var95: data.var_95 * 100,
        recommendation: data.recommendation,
        sentimentScore: data.sentiment_score ?? 0,
        confidence: data.probability_gain,
      }
    : {
        horizon: 5,
        expectedReturn: 3.5,
        uncertainty: 2.1,
        probabilityGain: 72,
        var95: 1.8,
        recommendation: "BUY",
        sentimentScore: 0.15,
        confidence: 0.72,
      }

  const recColor = f.recommendation === "BUY" ? "text-success" : f.recommendation === "HOLD" ? "text-warning" : "text-destructive"
  const recBg = f.recommendation === "BUY" ? "bg-success/10 border-success/30" : f.recommendation === "HOLD" ? "bg-warning/10 border-warning/30" : "bg-destructive/10 border-destructive/30"

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{t("forecast.summary")}</CardTitle>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", isLive ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30")}>
              {isLive ? <><Wifi className="w-3 h-3 mr-1" />LIVE</> : <><WifiOff className="w-3 h-3 mr-1" />MOCK</>}
            </Badge>
          </div>
          <Badge variant="outline" className={cn("text-xs font-semibold", recBg, recColor)}>
            {f.recommendation}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ForecastMetric icon={TrendingUp} label={t("forecast.expected_return")} value={`${f.expectedReturn >= 0 ? "+" : ""}${f.expectedReturn.toFixed(2)}%`} color={f.expectedReturn >= 0 ? "text-success" : "text-destructive"} />
          <ForecastMetric icon={AlertTriangle} label={t("forecast.uncertainty")} value={`±${f.uncertainty.toFixed(2)}%`} color="text-warning" />
          <ForecastMetric icon={Target} label={t("forecast.p_gain")} value={`${f.probabilityGain}%`} color="text-primary" />
          <ForecastMetric icon={Shield} label="VaR 95%" value={`${f.var95.toFixed(2)}%`} color="text-destructive" />
        </div>

        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Multimodal Refining</span>
            <div className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              f.sentimentScore > 0 ? "bg-success/10 text-success" : f.sentimentScore < 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
            )}>
              Sentiment: {f.sentimentScore.toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>Alpha (Return Weight): {params.alpha}</span>
              </div>
              <Slider 
                value={[params.alpha]} 
                min={0} max={0.2} step={0.01} 
                onValueChange={(v) => onParamChange({ alpha: v[0] })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>Beta (Risk Weight): {params.beta}</span>
              </div>
              <Slider 
                value={[params.beta]} 
                min={0} max={0.5} step={0.05} 
                onValueChange={(v) => onParamChange({ beta: v[0] })}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            Fusion: μ_multimodal = μ_tech + α * sentiment * impact
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ForecastMetric({ icon: Icon, label, value, color }: { icon: typeof TrendingUp; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-md bg-secondary/50 border border-border">
      <Icon className={cn("w-3.5 h-3.5 shrink-0", color)} />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-bold font-mono", color)}>{value}</p>
      </div>
    </div>
  )
}
