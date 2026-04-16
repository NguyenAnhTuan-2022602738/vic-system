"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BrainCircuit, Activity, LineChart, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModelComparison } from "@/lib/api"
import { useI18n } from "@/lib/i18n"

interface ModelComparisonCardsProps {
  data?: ModelComparison[]
  loading?: boolean
}

export function ModelComparisonCards({ data, loading }: ModelComparisonCardsProps) {
  const { t } = useI18n()

  const defaultData: ModelComparison[] = [
    { name: "LSTM (News Fusion)", expected_return: 0.035, mae: 0.0437 },
    { name: "Random Forest (Technical)", expected_return: 0.021, mae: 0.0521 },
    { name: "Linear Regression (Baseline)", expected_return: 0.012, mae: 0.0612 },
  ]

  const displayData = data && data.length > 0 ? data : defaultData

  const getModelInfo = (name: string) => {
    if (name.includes("LSTM")) return {
      icon: <BrainCircuit className="w-5 h-5 text-blue-400" />,
      color: "blue",
      tag: "Primary AI",
      desc: "Phân tích Hybrid chuỗi thời gian + Cảm xúc tin tức",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    }
    if (name.includes("Random Forest") || name.includes("RF")) return {
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      color: "emerald",
      tag: "Technical AI",
      desc: "Thuật toán Ensemble dựa trên các chỉ số kỹ thuật",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20"
    }
    return {
      icon: <LineChart className="w-5 h-5 text-amber-400" />,
      color: "amber",
      tag: "Baseline",
      desc: "Mô hình hồi quy toán học cơ sở để so sánh",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {displayData.map((model, idx) => {
        const info = getModelInfo(model.name)
        const isPositive = model.expected_return >= 0
        
        return (
          <Card key={idx} className={cn(
            "relative overflow-hidden border transition-all duration-300 hover:shadow-xl hover:shadow-black/20 group",
            info.borderColor,
            info.bgColor,
            "backdrop-blur-md"
          )}>
            <div className={cn("absolute top-0 left-0 w-full h-1", `bg-${info.color}-500/40`)} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl border", info.borderColor, "bg-background/40 shadow-inner")}>
                  {info.icon}
                </div>
                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-tighter border-current/20", `text-${info.color}-400`)}>
                  {info.tag}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{model.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-3xl font-black font-mono tracking-tighter",
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {isPositive ? "+" : ""}{(model.expected_return * 100).toFixed(2)}%
                  </span>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500/70" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-500/70" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed h-8 line-clamp-2 italic">
                  {info.desc}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold">Reliability (MAE)</span>
                  <span className="text-sm font-bold font-mono text-foreground/80">
                    {(model.mae * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="h-6 w-px bg-white/5" />
                <div className="flex flex-col text-right">
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold">Signal Status</span>
                  <Badge className={cn(
                    "text-[9px] h-5",
                    isPositive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  )}>
                    {isPositive ? "PROFITABLE" : "RISKY"}
                  </Badge>
                </div>
              </div>
            </CardContent>
            
            {/* Subtle background glow on hover */}
            <div className={cn(
              "absolute -bottom-12 -right-12 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-500",
              `bg-${info.color}-500`
            )} />
          </Card>
        )
      })}
    </div>
  )
}
