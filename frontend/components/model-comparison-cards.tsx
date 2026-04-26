"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BrainCircuit, Activity, LineChart, AlertCircle, BarChart as BarChartIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModelComparison } from "@/lib/api"
import { useI18n } from "@/lib/i18n"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

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
    <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-right-4 duration-700 h-full">
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
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl border", info.borderColor, "bg-background/40 shadow-inner")}>
                  {info.icon}
                </div>
                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-tighter border-current/20", `text-${info.color}-400`)}>
                  {info.tag}
                </Badge>
              </div>
              
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{model.name}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn(
                      "text-xl font-black font-mono tracking-tighter",
                      isPositive ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {isPositive ? "+" : ""}{(model.expected_return * 100).toFixed(2)}%
                    </span>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-emerald-500/70" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-rose-500/70" />
                    )}
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground leading-tight italic opacity-70">
                  {info.desc}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
      {/* MAE Comparison Chart */}
      <Card className="border border-border bg-card/50 backdrop-blur-md overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChartIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Model Reliability (MAE)</span>
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                  tickFormatter={(val) => val.split(' (')[0]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                  formatter={(val: number) => [`${(val * 100).toFixed(2)}%`, "MAE"]}
                />
                <Bar dataKey="mae" radius={[0, 4, 4, 0]} barSize={12}>
                  {displayData.map((entry, index) => {
                    const info = getModelInfo(entry.name)
                    return <Cell key={`cell-${index}`} fill={
                      info.color === 'blue' ? '#60a5fa' : info.color === 'emerald' ? '#34d399' : '#fbbf24'
                    } fillOpacity={0.6} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[8px] text-muted-foreground italic leading-none">* Lower MAE means higher prediction accuracy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
