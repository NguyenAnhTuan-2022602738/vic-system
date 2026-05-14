"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type ForecastResult } from "@/lib/api"
import { TrendingUp, TrendingDown, Shield, Target, AlertTriangle, Wifi, WifiOff, Bot, Minus, ShieldAlert } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { AnimatedNumber } from "./ai/animated-number"
import { AIThinkingIndicator } from "./ai/thinking-indicator"
import { TypewriterText } from "./ai/typewriter-text"
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
      const timer = setTimeout(() => {
        setIsThinking(false)
        setShowResults(true)
      }, 1500)
      return () => clearTimeout(timer)
    } else if (!loading && !isThinking) {
      setShowResults(true)
    }
  }, [loading, isThinking])

  // Sử dụng trực tiếp giá trị đã được điều chỉnh từ AI Backend (Single Source of Truth)
  const sentimentScore = data?.sentiment_score ?? 0
  const refinedReturn = data?.expected_return ?? 0.035
  const refinedUncertainty = data?.uncertainty ?? 0.021

  const f = {
    horizon: data?.horizon ?? 5,
    expectedReturn: refinedReturn * 100,
    uncertainty: Math.abs(refinedUncertainty) * 100,
    probabilityGain: Math.round((data?.probability_gain ?? 0.72) * 100),
    var95: (data?.var_95 ?? 0.018) * 100,
    recommendation: data?.recommendation ?? "HOLD",
    sentimentScore: sentimentScore,
    confidence: data?.probability_gain ?? 0.72,
    tradingSignal: data?.trading_signal,
  }

  // Recommendation styling
  const recConfig = {
    BUY: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: TrendingUp, label: "MUA" },
    SELL: { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", icon: TrendingDown, label: "BÁN" },
    HOLD: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: Minus, label: "GIỮ" },
  }
  const rec = recConfig[f.recommendation as keyof typeof recConfig] || recConfig.HOLD
  const RecIcon = rec.icon

  // AI Summary text
  const getSummary = () => {
    if (f.recommendation === "BUY") {
      return `Tín hiệu TÍCH CỰC. Lợi nhuận kỳ vọng đã vượt qua ngưỡng biến động rủi ro (Dynamic Volatility) với Tỷ lệ thắng (Win Rate) cực cao. Đề xuất cân nhắc mở vị thế MUA với mức cắt lỗ tự động.`
    } else if (f.recommendation === "SELL") {
      return `Tín hiệu TIÊU CỰC. Lợi nhuận kỳ vọng không bù đắp được rủi ro biến động của thị trường. Xác suất giảm giá đang áp đảo. Khuyến nghị BÁN hoặc cắt giảm vị thế để bảo toàn vốn.`
    } else {
      return `Thị trường TRUNG LẬP. Lợi nhuận dự báo chưa đủ lớn để vượt qua rào cản nhiễu động (Volatility) hiện tại. Rủi ro / Lợi nhuận chưa hấp dẫn. Nên ĐỨNG NGOÀI quan sát thêm.`
    }
  }

  return (
    <Card className="bg-card border-border overflow-hidden relative h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{t("forecast.summary")}</CardTitle>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", isLive ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30")}>
              {isLive ? <><Wifi className="w-3 h-3 mr-1" />LIVE</> : <><WifiOff className="w-3 h-3 mr-1" />MOCK</>}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 min-h-[400px]">
        <AnimatePresence mode="wait">
          {isThinking ? (
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AIThinkingIndicator />
            </motion.div>
          ) : showResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* ===== SECTION 1: AI INTELLIGENCE ===== */}
              <div className="relative p-4 bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl -mr-12 -mt-12 rounded-full" />
                <div className="flex gap-3 relative z-10">
                  <motion.div 
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="shrink-0 w-10 h-10 bg-background border border-primary/40 rounded-xl flex items-center justify-center shadow-lg shadow-primary/10"
                  >
                    <Bot className="w-5 h-5 text-primary" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">AI Intelligence</span>
                    <div className="text-xs text-slate-300 leading-relaxed mt-1">
                      <TypewriterText text={getSummary()} speed={12} delay={0.3} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== SECTION 2: RECOMMENDATION (NỔI BẬT) ===== */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={cn("flex items-center justify-between p-4 rounded-xl border-2", rec.bg)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-lg", f.recommendation === "BUY" ? "bg-emerald-500/20" : f.recommendation === "SELL" ? "bg-rose-500/20" : "bg-amber-500/20")}>
                    <RecIcon className={cn("w-6 h-6", rec.color)} />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-black tracking-tight", rec.color)}>{f.recommendation}</p>
                    <p className="text-[10px] text-muted-foreground">Khuyến nghị AI · Dynamic Volatility</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className={cn("text-lg font-bold font-mono", rec.color)}>
                    {Math.round(f.confidence * 100)}%
                  </p>
                  {f.tradingSignal && (
                    <Badge variant="outline" className={cn("text-[9px] mt-1", rec.bg, rec.color)}>
                      {f.tradingSignal.risk_level} Risk
                    </Badge>
                  )}
                </div>
              </motion.div>

              {/* YÊU CẦU ẨN: Stop Loss / Take Profit (chỉ hiển thị khi BUY hoặc SELL)
              {f.tradingSignal && f.recommendation !== "HOLD" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-destructive" />
                      Stop Loss
                    </div>
                    <p className="text-base font-mono font-bold text-slate-200 mt-1">
                      {f.tradingSignal.stop_loss > 0 ? f.tradingSignal.stop_loss.toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                      <Target className="w-3 h-3 text-success" />
                      Take Profit
                    </div>
                    <p className="text-base font-mono font-bold text-slate-200 mt-1">
                      {f.tradingSignal.take_profit > 0 ? f.tradingSignal.take_profit.toLocaleString() : "N/A"}
                    </p>
                  </div>
                </motion.div>
              )}
              */}

              {/* ===== SECTION 3: CÁC CHỈ SỐ (Mỗi cái 1 dòng, kèm công thức) ===== */}
              <div className="space-y-2">
                {/* Lợi nhuận kỳ vọng */}
                <MetricRow
                  icon={TrendingUp}
                  label="Lợi nhuận kỳ vọng (μ_adj)"
                  value={f.expectedReturn}
                  prefix={f.expectedReturn >= 0 ? "+" : ""}
                  suffix="%"
                  color={f.expectedReturn >= 0 ? "text-success" : "text-destructive"}
                  formula="μ × (1 + α × sentiment × impact)"
                  source="Black-Litterman inspired"
                  delay={0.3}
                />

                {/* Độ bất định */}
                <MetricRow
                  icon={AlertTriangle}
                  label="Độ bất định (σ_adj)"
                  value={f.uncertainty}
                  prefix="±"
                  suffix="%"
                  color="text-warning"
                  formula="σ × (1 + β × |sentiment| × impact)"
                  source="LSTM + Sentiment Fusion"
                  delay={0.4}
                />

                {/* Xác suất sinh lời */}
                <MetricRow
                  icon={Target}
                  label="Xác suất sinh lời"
                  value={f.probabilityGain}
                  suffix="%"
                  color="text-primary"
                  formula="P(Return > 0) = 1 - Φ(-μ/σ)"
                  source="Gaussian CDF · Markowitz (1952)"
                  delay={0.5}
                />

                {/* VaR 95% */}
                <MetricRow
                  icon={Shield}
                  label="Value at Risk 95%"
                  value={f.var95}
                  suffix="%"
                  color="text-destructive"
                  formula="VaR = μ - 1.645 × σ"
                  source="J.P. Morgan RiskMetrics (1996)"
                  delay={0.6}
                />
              </div>

              {/* ===== SECTION 4: SENTIMENT BADGE ===== */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">AI Sentiment</span>
                <div className={cn(
                  "text-[10px] px-2.5 py-1 rounded-full border font-mono font-bold",
                  sentimentScore > 0.1 ? "bg-success/10 text-success border-success/20" 
                    : sentimentScore < -0.1 ? "bg-destructive/10 text-destructive border-destructive/20" 
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  {sentimentScore >= 0 ? "+" : ""}{sentimentScore.toFixed(2)}
                </div>
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

/** Metric row: 1 dòng = icon + label + value + công thức */
function MetricRow({ 
  icon: Icon, label, value, color, prefix = "", suffix = "", formula, source, delay = 0
}: { 
  icon: typeof TrendingUp
  label: string
  value: number
  color: string
  prefix?: string
  suffix?: string
  formula: string
  source: string
  delay?: number
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border hover:border-primary/20 transition-colors group"
    >
      <Icon className={cn("w-4 h-4 shrink-0", color)} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5 group-hover:text-muted-foreground/70 transition-colors truncate">{formula}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-bold font-mono", color)}>
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} delay={delay + 0.3} />
        </p>
        <p className="text-[8px] text-muted-foreground/40 font-mono">{source}</p>
      </div>
    </motion.div>
  )
}
