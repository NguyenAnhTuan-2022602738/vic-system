"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, Zap, Clock, ArrowRight, TrendingUp, TrendingDown, Medal, Activity } from "lucide-react"
import { HistoryComparisonResult } from "@/lib/api"

interface AccuracyCardProps {
  data: HistoryComparisonResult | null;
  isLoading: boolean;
}

export function AccuracyCard({ data, isLoading }: AccuracyCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6 bg-slate-950 border-slate-800 animate-pulse h-[450px]">
        <div className="flex justify-between mb-8">
          <div className="h-8 w-48 bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="h-32 bg-slate-900 rounded-2xl" />
          <div className="h-32 bg-slate-900 rounded-2xl" />
        </div>
        <div className="space-y-3">
          <div className="h-12 bg-slate-900 rounded-xl" />
          <div className="h-12 bg-slate-900 rounded-xl" />
        </div>
      </Card>
    )
  }

  if (!data) return null;

  const { forecast, actual, accuracy } = data;
  const score = accuracy && accuracy.score ? parseInt(accuracy.score) : null;

  // An toàn hơn với TypeScript
  const isActualAvailable = !!actual;
  const actualReturn = actual?.actual_return ?? 0;
  const isProfit = actualReturn >= 0;
  const exitPrice = actual?.exit_price ?? 0;
  const entryPrice = actual?.entry_price ?? 0;
  const priceDelta = exitPrice - entryPrice;

  if (score === null || isNaN(score)) {
    return (
      <Card className="p-8 bg-slate-950 border-amber-500/20 border-dashed flex flex-col items-center justify-center text-center gap-4 min-h-[350px]">
        <div className="p-4 bg-amber-500/10 rounded-full">
          <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-100">Dữ liệu đối chiếu đang xử lý...</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            Hệ thống đang thu thập giá đóng cửa thực tế T+2 để thực hiện đối chiếu độ chính xác. Vui lòng quay lại sau.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="group relative">
      {/* Background Glows */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000" />
      
      <Card className="relative p-8 bg-slate-950/80 backdrop-blur-3xl border-slate-800 shadow-2xl rounded-[1.5rem] overflow-hidden">
        {/* Header section */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Đối chiếu Dự báo <span className="text-indigo-500 text-sm ml-2 px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 font-mono">v3</span></h3>
              <p className="text-xs text-slate-500 font-medium mt-1">So sánh dự báo AI vs Dữ liệu thực tế thị trường</p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1 font-bold">Điểm Chính xác</span>
            <span className={`text-4xl font-black font-mono tracking-tighter ${score > 80 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {score}%
            </span>
          </div>
        </div>

        {/* The Reality Gap Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12 relative">
          
          {/* AI Prediction Box */}
          <div className="flex-1 w-full p-6 bg-indigo-500/5 rounded-[1.5rem] border border-indigo-500/20 relative group/box transition-all hover:bg-indigo-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Dự báo AI (Ngày T)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Độ tin cậy: {(forecast.confidence * 100).toFixed(0)}%</span>
            </div>
            
            <div className="space-y-1">
              <p className="text-4xl font-black text-white tracking-tighter">{forecast.expected_return_str}</p>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                <Activity className="w-3 h-3" />
                Độ bất định (σ): <span className="text-indigo-400">{forecast.uncertainty_str}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-indigo-500/10 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Giá mở vị thế (T)</p>
                <p className="text-sm font-bold text-slate-200">{(actual?.base_close_price || forecast.last_price_used || 0).toLocaleString()}đ</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Mô hình</p>
                <p className="text-xs font-bold text-indigo-400">Hybrid CNN-LSTM</p>
              </div>
            </div>
          </div>

          {/* Gap Indicator */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-dashed ${accuracy.direction_hit ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-rose-500/50 bg-rose-500/5'}`}>
              <span className="text-[10px] font-bold text-slate-400">SAI SỐ</span>
              <span className="text-xs font-black text-white">{accuracy.error_margin}</span>
            </div>
            <div className="h-px w-8 lg:w-12 bg-gradient-to-r from-indigo-500/50 via-slate-700 to-emerald-500/50" />
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${accuracy.direction_hit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {accuracy.direction_hit ? 'ĐÚNG HƯỚNG 🎯' : 'SAI HƯỚNG ⭕'}
            </span>
          </div>

          {/* Actual Reality Box */}
          <div className={`flex-1 w-full p-6 rounded-[1.5rem] border relative group/box transition-all ${isProfit ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' : 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isProfit ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                <Clock className={`w-3.5 h-3.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>Thực tế (Ngày T+2)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase italic">Ngày chốt: {actual ? new Date(actual.exit_date).toLocaleDateString('vi-VN') : '--'}</span>
            </div>

            <div className="space-y-1">
              <p className={`text-4xl font-black tracking-tighter ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {actual?.actual_return_str || 'N/A'}
              </p>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                {isProfit ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                Biến động giá: <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>{priceDelta.toLocaleString()}đ</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Giá đóng vị thế</p>
                <p className="text-sm font-bold text-slate-200">{exitPrice.toLocaleString()}đ</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Kết quả</p>
                <p className={`text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isProfit ? 'LỢI NHUẬN' : 'THUA LỖ'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-model Leaderboard Section */}
        {forecast.comparison_data && forecast.comparison_data.length > 0 && (
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <Medal className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bảng xếp hạng Độ chính xác Đa mô hình</h4>
            </div>
            
            <div className="space-y-4">
              {forecast.comparison_data
                .map(m => ({ ...m, error: isActualAvailable ? Math.abs(m.expected_return - actualReturn) : 999 }))
                .sort((a, b) => a.error - b.error)
                .map((model, idx) => {
                  const isLSTM = model.name.includes("LSTM")
                  const isRF   = model.name.includes("Random Forest")
                  const color  = isLSTM ? "indigo" : isRF ? "emerald" : "amber"
                  const errorPercent = (model.error * 100)
                  const accuracyScore = Math.max(0, 100 - (model.error * 500))

                  return (
                    <div key={idx} className="relative group/row">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'text-amber-400 border border-amber-400/30' : 'text-slate-500'}`}>
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-200">{model.name.split(" (")[0]}</span>
                          {idx === 0 && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">QUÁN QUÂN</span>}
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[9px] text-slate-500 uppercase font-bold">Kết quả dự đoán</p>
                            <p className={`text-xs font-mono font-bold ${model.expected_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {model.expected_return >= 0 ? '+' : ''}{(model.expected_return * 100).toFixed(2)}%
                            </p>
                          </div>
                          <div className="text-right border-l border-slate-800 pl-4">
                            <p className="text-[9px] text-slate-500 uppercase font-bold">Sai số Tuyệt đối</p>
                            <p className="text-xs font-mono font-bold text-slate-300">{errorPercent.toFixed(2)}%</p>
                          </div>
                          <div className="text-right border-l border-slate-800 pl-4">
                            <p className="text-[9px] text-slate-500 uppercase font-bold">Độ chính xác</p>
                            <p className={`text-xs font-mono font-bold ${accuracyScore > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{accuracyScore.toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden transition-all duration-1000 group-hover/row:h-2">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            color === 'indigo' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 
                            color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                            'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          }`}
                          style={{ width: `${accuracyScore}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
