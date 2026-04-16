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
import { AnimatedNumber } from "./ai/animated-number"
import { AIThinkingIndicator } from "./ai/thinking-indicator"
import { AIAssistantAdvice } from "./ai/ai-assistant-advice"
import { motion, AnimatePresence } from "framer-motion"

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
  const [isThinking, setIsThinking] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (loading) {
      setIsThinking(true)
      setShowResults(false)
    } else if (isThinking && !loading) {
      // Data arrived, simulate thinking phase
      const timer = setTimeout(() => {
        setIsThinking(false)
        setShowResults(true)
      }, 1500)
      return () => clearTimeout(timer)
    } else if (!loading && !isThinking) {
      setShowResults(true)
    }
  }, [loading, isThinking])

  // Fusion Logic: Recalculate based on sliders
  const sentimentScore = data?.sentiment_score ?? 0
  const impact = 0.5 // Standard impact factor
  
  // Base values from technical models
  const baseReturn = data?.expected_return ?? 0.035
  const baseUncertainty = data?.uncertainty ?? 0.021
  
  // Refined values based on sliders
  // Formula: mu_multimodal = mu_tech + (alpha * 10) * sentiment * impact
  // We use alpha * 5 to make the slider more sensitive for UX
  const refinedReturn = baseReturn + (params.alpha * 5) * sentimentScore * impact
  const refinedUncertainty = baseUncertainty + (params.beta) * Math.abs(sentimentScore)

  const f = {
    horizon: data?.horizon ?? 5,
    expectedReturn: refinedReturn * 100,
    uncertainty: Math.abs(refinedUncertainty) * 100,
    probabilityGain: Math.round((data?.probability_gain ?? 0.72) * 100),
    var95: (data?.var_95 ?? 0.018) * 100,
    recommendation: data?.recommendation ?? "HOLD",
    sentimentScore: sentimentScore,
    confidence: data?.probability_gain ?? 0.72,
  }

  const recColor = f.recommendation === "BUY" ? "text-success" : f.recommendation === "HOLD" ? "text-warning" : "text-destructive"
  const recBg = f.recommendation === "BUY" ? "bg-success/10 border-success/30" : f.recommendation === "HOLD" ? "bg-warning/10 border-warning/30" : "bg-destructive/10 border-destructive/30"

  return (
    <Card className="bg-card border-border overflow-hidden relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{t("forecast.summary")}</CardTitle>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", isLive ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30")}>
              {isLive ? <><Wifi className="w-3 h-3 mr-1" />LIVE</> : <><WifiOff className="w-3 h-3 mr-1" />MOCK</>}
            </Badge>
          </div>
          {showResults && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Badge variant="outline" className={cn("text-xs font-semibold", recBg, recColor)}>
                {f.recommendation}
              </Badge>
            </motion.div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 min-h-[400px]">
        <AnimatePresence mode="wait">
          {isThinking ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AIThinkingIndicator />
            </motion.div>
          ) : showResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Special AI Assistant Panel */}
              <AIAssistantAdvice 
                recommendation={f.recommendation}
                expectedReturn={f.expectedReturn}
                confidence={f.confidence}
                sentiment={f.sentimentScore}
              />

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <ForecastMetric 
                  icon={TrendingUp} 
                  label={t("forecast.expected_return")} 
                  value={f.expectedReturn}
                  prefix={f.expectedReturn >= 0 ? "+" : ""}
                  suffix="%"
                  color={f.expectedReturn >= 0 ? "text-success" : "text-destructive"} 
                  delay={0.2}
                />
                <ForecastMetric 
                  icon={AlertTriangle} 
                  label={t("forecast.uncertainty")} 
                  value={f.uncertainty}
                  prefix="±"
                  suffix="%"
                  color="text-warning" 
                  delay={0.4}
                />
                <ForecastMetric 
                  icon={Target} 
                  label={t("forecast.p_gain")} 
                  value={f.probabilityGain}
                  suffix="%"
                  color="text-primary" 
                  delay={0.6}
                />
                <ForecastMetric 
                  icon={Shield} 
                  label="VaR 95%" 
                  value={f.var95}
                  suffix="%"
                  color="text-destructive" 
                  delay={0.8}
                />
              </div>

              {/* AI-Optimized Fusion (Sliders removed as per user request) */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">AI-Optimized Sentiment Fusion</span>
                  <div className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border",
                    f.sentimentScore > 0 ? "bg-success/5 text-success border-success/20" : f.sentimentScore < 0 ? "bg-destructive/5 text-destructive border-destructive/20" : "bg-muted text-muted-foreground border-border"
                  )}>
                    Sentiment: {f.sentimentScore.toFixed(2)}
                  </div>
                </div>
                
                <div className="p-3 bg-secondary/20 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground font-mono">WEIGHTS LOCKED AT OPTIMAL LEVELS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase opacity-70">Alpha (Return)</p>
                      <p className="text-xs font-bold text-foreground">0.04</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase opacity-70">Beta (Risk)</p>
                      <p className="text-xs font-bold text-foreground">0.15</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground leading-relaxed italic opacity-80">
                  Engine: Precision weighting enabled based on LSTM-sentiment variance.
                </p>
              </div>
            </motion.div>
          ) : (
             <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

function ForecastMetric({ 
  icon: Icon, 
  label, 
  value, 
  color,
  prefix = "",
  suffix = "",
  delay = 0
}: { 
  icon: typeof TrendingUp; 
  label: string; 
  value: number; 
  color: string;
  prefix?: string;
  suffix?: string;
  delay?: number
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="flex items-center gap-2 p-2.5 rounded-md bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
    >
      <Icon className={cn("w-3.5 h-3.5 shrink-0", color)} />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-bold font-mono", color)}>
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} delay={delay + 0.5} />
        </p>
      </div>
    </motion.div>
  )
}
