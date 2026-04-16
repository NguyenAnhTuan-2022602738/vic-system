"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, Zap, Clock, ArrowRight, AlertTriangle, Banknote } from "lucide-react"
import { HistoryComparisonResult } from "@/lib/api"

interface AccuracyCardProps {
  data: HistoryComparisonResult | null;
  isLoading: boolean;
}

export function AccuracyCard({ data, isLoading }: AccuracyCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6 bg-slate-900/40 backdrop-blur-xl border-slate-800 animate-pulse h-[360px]">
        <div className="h-6 w-32 bg-slate-800 rounded mb-6" />
        <div className="space-y-4">
          <div className="h-20 bg-slate-800/50 rounded-xl" />
          <div className="h-20 bg-slate-800/50 rounded-xl" />
        </div>
      </Card>
    )
  }

  if (!data) return null;

  const { forecast, actual, accuracy, message } = data;
  
  // Kiểm tra an toàn: Nếu không có accuracy hoặc score, hiển thị trạng thái chờ hoặc thông báo
  const score = accuracy && accuracy.score ? parseInt(accuracy.score) : null;

  if (score === null || isNaN(score)) {
    return (
      <Card className="p-8 bg-slate-900/40 backdrop-blur-xl border-amber-500/20 border-dashed flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
        <div className="p-3 bg-amber-500/10 rounded-full">
          <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-200">Dữ liệu đối chiếu chưa sẵn sàng</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            {message || "Hiện tại chưa có đủ dữ liệu giá thực tế T+2 để thực hiện đối chiếu độ chính xác cho ngày này."}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="transition-all duration-300">
      <Card className="p-6 bg-slate-900/60 backdrop-blur-xl border-indigo-500/30 shadow-lg shadow-indigo-500/10 relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Flashback Verification</h3>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 uppercase tracking-widest mb-1">Accuracy Score</span>
            <span className={`text-2xl font-bold ${score > 80 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {score}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* AI Prediction Side */}
          <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:border-indigo-500/40 transition-colors">
            <div className="flex items-center gap-2 mb-3 text-slate-400 text-sm">
              <Zap className="w-4 h-4" />
              AI Prediction (T)
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-indigo-300">{forecast.expected_return_str}</p>
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <Banknote className="w-3 h-3 text-slate-600" />
                    Giá dự báo (T): <span className="text-slate-300">{(forecast.last_price_used || 0).toLocaleString()}đ</span>
                  </p>
                  {actual && (
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-emerald-500" />
                      Giá CSV ngày chọn: <span className="text-emerald-400 font-bold">{(actual.base_close_price || 0).toLocaleString()}đ</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-warning" />
                    Uncertainty (σ): <span className="text-warning font-bold">{forecast.uncertainty_str || "±2.40%"}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase">Confidence</span>
                <span className="text-sm font-semibold text-slate-300">{(forecast.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Actual Reality Side */}
          <div className={`p-5 rounded-2xl border transition-all duration-500 ${accuracy.direction_hit ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
            <div className="flex items-center gap-2 mb-3 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              Actual Result (T+2)
            </div>
            {actual ? (
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-3xl font-bold ${actual.actual_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {actual.actual_return_str}
                  </p>
                  <div className="flex flex-col gap-1 mt-2">
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-600" />
                      Exit Price (T+2): <span className="text-slate-300">{(actual.exit_price || 0).toLocaleString()}đ</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Settled: <span className="text-slate-400">{new Date(actual.exit_date).toLocaleDateString('vi-VN')}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-500 uppercase">Price Delta</span>
                  <span className="text-sm font-semibold text-slate-300">{(actual.exit_price - actual.entry_price).toLocaleString()}đ</span>
                </div>
              </div>
            ) : (
              <div className="h-10 flex items-center text-slate-500 italic text-sm">
                Waiting for settlement data...
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Directional Accuracy</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${accuracy.direction_hit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {accuracy.direction_hit ? 'HIT 🎯' : 'MISS ⭕'}
            </span>
          </div>
          <Progress value={score} className="h-1.5 bg-slate-800" />
          
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 italic">
            <div className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Error Margin: {accuracy.error_margin}
            </div>
            {data.message && <span>{data.message}</span>}
          </div>
        </div>
      </Card>
    </div>
  )
}
