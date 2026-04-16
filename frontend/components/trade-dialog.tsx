"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTrade, updateTrade, getLatestPipeline, askAssistant, TradeLog, PipelineResult } from "@/lib/api"
import { toast } from "sonner"
import {
  Loader2, TrendingUp, TrendingDown, DollarSign, CalendarDays,
  Hash, StickyNote, Target, ShieldAlert, Brain, Sparkles,
  ArrowRight, CheckCircle2, AlertTriangle, BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"

type DialogMode = "CREATE" | "CLOSE" | "EDIT"

interface TradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: DialogMode
  trade?: TradeLog | null
  onSuccess?: () => void
}

const defaultFormData = {
  symbol: "VCB",
  action: "BUY" as "BUY" | "SELL",
  entry_price: "",
  quantity: "",
  stop_loss: "",
  take_profit: "",
  horizon: "2",
  entry_date: new Date().toISOString().split("T")[0],
  notes: "",
}

const defaultCloseData = {
  exit_price: "",
  exit_date: new Date().toISOString().split("T")[0],
  notes: "",
}

export function TradeDialog({ open, onOpenChange, mode, trade, onSuccess }: TradeDialogProps) {
  const [formData, setFormData] = useState(defaultFormData)
  const [closeData, setCloseData] = useState(defaultCloseData)
  const [submitting, setSubmitting] = useState(false)

  // AI States
  const [forecast, setForecast] = useState<PipelineResult | null>(null)
  const [forecastLoading, setForecastLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForecast(null)
      setAiAnalysis(null)

      if (mode === "CREATE") {
        setFormData({
          ...defaultFormData,
          entry_date: new Date().toISOString().split("T")[0],
        })
        // Auto-fetch AI forecast
        fetchForecast()
      } else if (mode === "EDIT" && trade) {
        setFormData({
          symbol: trade.symbol || "VCB",
          action: trade.action,
          entry_price: trade.entry_price.toString(),
          quantity: trade.quantity.toString(),
          stop_loss: trade.stop_loss?.toString() || "",
          take_profit: trade.take_profit?.toString() || "",
          horizon: trade.horizon?.toString() || "2",
          entry_date: trade.entry_date?.split("T")[0] || new Date().toISOString().split("T")[0],
          notes: trade.notes || "",
        })
      } else if (mode === "CLOSE" && trade) {
        setCloseData({
          exit_price: "",
          exit_date: new Date().toISOString().split("T")[0],
          notes: trade.notes || "",
        })
      }
    }
  }, [open, mode, trade])

  // Fetch AI forecast when creating trade
  const fetchForecast = async () => {
    setForecastLoading(true)
    try {
      const data = await getLatestPipeline()
      setForecast(data)
    } catch (error) {
      console.error("Failed to fetch forecast:", error)
      // Non-blocking: forecast is optional
    } finally {
      setForecastLoading(false)
    }
  }

  // Ask AI to analyze a closed trade
  const fetchAiAnalysis = async () => {
    if (!trade) return
    setAiLoading(true)
    setAiAnalysis(null)
    try {
      const exitPrice = parseFloat(closeData.exit_price)
      const pnl = trade.action === "BUY"
        ? (exitPrice - trade.entry_price) * trade.quantity
        : (trade.entry_price - exitPrice) * trade.quantity
      const actualReturn = trade.action === "BUY"
        ? ((exitPrice - trade.entry_price) / trade.entry_price * 100)
        : ((trade.entry_price - exitPrice) / trade.entry_price * 100)

      const predictedReturn = trade.predicted_mu ? (trade.predicted_mu * 100).toFixed(2) : "N/A"

      const context = `
Giao dịch cổ phiếu ${trade.symbol}:
- Loại lệnh: ${trade.action === "BUY" ? "MUA" : "BÁN"}
- Ngày vào: ${trade.entry_date?.split("T")[0]}
- Giá vào: ${trade.entry_price.toLocaleString()} VND
- Ngày thoát: ${closeData.exit_date}
- Giá thoát: ${exitPrice.toLocaleString()} VND
- Khối lượng: ${trade.quantity} cổ phiếu
- PnL thực tế: ${pnl >= 0 ? "+" : ""}${pnl.toLocaleString()} VND (${actualReturn >= 0 ? "+" : ""}${actualReturn.toFixed(2)}%)
- AI đã dự đoán lợi nhuận: ${predictedReturn}%
- Ghi chú người dùng: ${trade.notes || "Không có"}
`
      const message = `Hãy phân tích giao dịch này cho tôi: đánh giá kết quả thực tế so với dự đoán AI, điểm mạnh/yếu của quyết định, và bài học rút ra. Trả lời ngắn gọn, tối đa 4-5 câu.`

      const response = await askAssistant(message, context)
      setAiAnalysis(response.answer)
    } catch (error) {
      console.error("AI analysis error:", error)
      setAiAnalysis("⚠️ Không thể kết nối AI assistant lúc này. Vui lòng thử lại sau.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleCreateOrEdit = async () => {
    // Validation
    if (!formData.entry_price || !formData.quantity) {
      toast.error("Vui lòng nhập Giá vào và Khối lượng!")
      return
    }

    const entryPrice = parseFloat(formData.entry_price)
    const quantity = parseInt(formData.quantity)

    if (isNaN(entryPrice) || entryPrice <= 0) {
      toast.error("Giá vào phải là số dương!")
      return
    }
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Khối lượng phải là số nguyên dương!")
      return
    }

    setSubmitting(true)
    try {
      const payload: Partial<TradeLog> = {
        symbol: formData.symbol,
        action: formData.action,
        entry_price: entryPrice,
        quantity: quantity,
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : undefined,
        take_profit: formData.take_profit ? parseFloat(formData.take_profit) : undefined,
        horizon: parseInt(formData.horizon) || 2,
        entry_date: formData.entry_date,
        notes: formData.notes || undefined,
        status: "OPEN",
        // Lưu dự đoán AI vào record
        predicted_mu: forecast?.expected_return || 0,
        predicted_sigma: forecast?.adjusted_uncertainty || forecast?.base_uncertainty || 0,
      }

      if (mode === "CREATE") {
        await createTrade(payload)
        toast.success("✅ Đã tạo lệnh giao dịch mới!")
      } else if (mode === "EDIT" && trade) {
        await updateTrade(trade._id, payload)
        toast.success("✅ Đã cập nhật thông tin lệnh!")
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error("Lỗi khi lưu giao dịch. Vui lòng thử lại.")
      console.error("Trade save error:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async () => {
    if (!trade) return

    if (!closeData.exit_price) {
      toast.error("Vui lòng nhập Giá đóng lệnh!")
      return
    }

    const exitPrice = parseFloat(closeData.exit_price)
    if (isNaN(exitPrice) || exitPrice <= 0) {
      toast.error("Giá đóng phải là số dương!")
      return
    }

    setSubmitting(true)
    try {
      // Auto-calculate PnL
      const pnl = trade.action === "BUY"
        ? (exitPrice - trade.entry_price) * trade.quantity
        : (trade.entry_price - exitPrice) * trade.quantity

      const actualReturn = trade.action === "BUY"
        ? (exitPrice - trade.entry_price) / trade.entry_price
        : (trade.entry_price - exitPrice) / trade.entry_price

      await updateTrade(trade._id, {
        status: "CLOSED",
        exit_price: exitPrice,
        pnl,
        actual_return: actualReturn,
        notes: closeData.notes || trade.notes,
      })

      const profitEmoji = pnl >= 0 ? "🎉" : "📉"
      toast.success(`${profitEmoji} Đã đóng lệnh! PnL: ${pnl >= 0 ? "+" : ""}${pnl.toLocaleString()} VND`)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error("Lỗi khi đóng lệnh. Vui lòng thử lại.")
      console.error("Trade close error:", error)
    } finally {
      setSubmitting(false)
    }
  }

  // Estimate PnL preview in Close mode
  const previewPnL = (() => {
    if (mode !== "CLOSE" || !trade || !closeData.exit_price) return null
    const exitPrice = parseFloat(closeData.exit_price)
    if (isNaN(exitPrice)) return null

    const pnl = trade.action === "BUY"
      ? (exitPrice - trade.entry_price) * trade.quantity
      : (trade.entry_price - exitPrice) * trade.quantity

    const pct = trade.action === "BUY"
      ? ((exitPrice - trade.entry_price) / trade.entry_price * 100)
      : ((trade.entry_price - exitPrice) / trade.entry_price * 100)

    return { pnl, pct }
  })()

  // Predicted vs Actual comparison for Close mode
  const predictionComparison = (() => {
    if (mode !== "CLOSE" || !trade || !previewPnL || !trade.predicted_mu) return null
    const predictedPct = trade.predicted_mu * 100
    const actualPct = previewPnL.pct
    const error = Math.abs(predictedPct - actualPct)
    const directionMatch = (predictedPct >= 0) === (actualPct >= 0)
    return { predictedPct, actualPct, error, directionMatch }
  })()

  // ===== RENDER: CREATE / EDIT MODE =====
  if (mode === "CREATE" || mode === "EDIT") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              {mode === "CREATE" ? (
                <><DollarSign className="h-5 w-5 text-emerald-400" /> Ghi nhận Giao dịch</>
              ) : (
                <><DollarSign className="h-5 w-5 text-amber-400" /> Sửa Giao dịch</>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {mode === "CREATE"
                ? "Nhập thông tin cổ phiếu bạn mua/bán. AI sẽ hiện dự đoán lợi nhuận."
                : "Cập nhật thông tin lệnh đang mở."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row 1: Symbol + Action */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Hash className="h-3 w-3" /> Mã cổ phiếu
                </Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  placeholder="VCB"
                  className="bg-slate-800/50 border-slate-700 text-slate-100 font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  {formData.action === "BUY" ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : <TrendingDown className="h-3 w-3 text-rose-400" />}
                  Loại lệnh
                </Label>
                <Select value={formData.action} onValueChange={(v) => setFormData({ ...formData, action: v as "BUY" | "SELL" })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="BUY" className="text-emerald-400 font-bold">▲ MUA (BUY)</SelectItem>
                    <SelectItem value="SELL" className="text-rose-400 font-bold">▼ BÁN (SELL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Entry Date + Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" /> Thời điểm vào
                </Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" /> Giá lúc vào (VND)
                </Label>
                <Input
                  id="entry_price"
                  type="number"
                  value={formData.entry_price}
                  onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                  placeholder="90,000"
                  className="bg-slate-800/50 border-slate-700 text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* Row 3: Quantity + Horizon */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Hash className="h-3 w-3" /> Số lượng CP
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="100"
                  className="bg-slate-800/50 border-slate-700 text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs uppercase tracking-wide">
                  Horizon (T+)
                </Label>
                <Select value={formData.horizon} onValueChange={(v) => setFormData({ ...formData, horizon: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="1">T+1</SelectItem>
                    <SelectItem value="2">T+2</SelectItem>
                    <SelectItem value="3">T+3</SelectItem>
                    <SelectItem value="5">T+5</SelectItem>
                    <SelectItem value="10">T+10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: SL + TP */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldAlert className="h-3 w-3 text-rose-400" /> Cắt lỗ (SL)
                </Label>
                <Input
                  id="stop_loss"
                  type="number"
                  value={formData.stop_loss}
                  onChange={(e) => setFormData({ ...formData, stop_loss: e.target.value })}
                  placeholder="Tuỳ chọn"
                  className="bg-slate-800/50 border-slate-700 text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-emerald-400" /> Chốt lời (TP)
                </Label>
                <Input
                  id="take_profit"
                  type="number"
                  value={formData.take_profit}
                  onChange={(e) => setFormData({ ...formData, take_profit: e.target.value })}
                  placeholder="Tuỳ chọn"
                  className="bg-slate-800/50 border-slate-700 text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* Row 5: Notes */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <StickyNote className="h-3 w-3" /> Ghi chú
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Lý do vào lệnh, chiến thuật sử dụng..."
                className="bg-slate-800/50 border-slate-700 text-slate-100 min-h-[50px] resize-none"
              />
            </div>

            {/* ===== AI FORECAST PANEL ===== */}
            {mode === "CREATE" && (
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                    AI Dự đoán lợi nhuận
                  </span>
                  {forecastLoading && <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />}
                </div>

                {forecastLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang lấy dự đoán từ mô hình AI...</span>
                  </div>
                ) : forecast ? (
                  <div className="space-y-2">
                    {/* Forecast Summary */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-800/60 rounded p-2 text-center">
                        <p className="text-slate-500 text-[10px]">Lợi nhuận dự kiến</p>
                        <p className={cn(
                          "font-bold font-mono text-sm",
                          forecast.expected_return >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {forecast.expected_return >= 0 ? "+" : ""}{(forecast.expected_return * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-slate-800/60 rounded p-2 text-center">
                        <p className="text-slate-500 text-[10px]">Tín hiệu AI</p>
                        <p className={cn(
                          "font-bold text-sm",
                          forecast.final_action === "BUY" ? "text-emerald-400" :
                          forecast.final_action === "SELL" ? "text-rose-400" : "text-amber-400"
                        )}>
                          {forecast.final_action === "BUY" ? "▲ MUA" :
                           forecast.final_action === "SELL" ? "▼ BÁN" : "⏸ GIỮ"}
                        </p>
                      </div>
                      <div className="bg-slate-800/60 rounded p-2 text-center">
                        <p className="text-slate-500 text-[10px]">Độ tin cậy</p>
                        <p className="font-bold font-mono text-sm text-blue-400">
                          {(forecast.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Extra details */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Win Rate:</span>
                        <span className="font-mono text-slate-300">{(forecast.win_rate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Sharpe Ratio:</span>
                        <span className="font-mono text-slate-300">{forecast.sharpe_ratio?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>VaR 95%:</span>
                        <span className="font-mono text-rose-400">{(forecast.risk_var * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Cảm xúc tin tức:</span>
                        <span className={cn(
                          "font-mono",
                          forecast.sentiment_score >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {forecast.sentiment_score?.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Estimated profit in VND */}
                    {formData.entry_price && formData.quantity && (
                      <div className="bg-slate-800/40 rounded p-2 border border-slate-700/50">
                        <p className="text-[10px] text-slate-500 mb-1">💰 Lợi nhuận ước tính (theo AI)</p>
                        <p className={cn(
                          "font-bold font-mono text-base",
                          forecast.expected_return >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {forecast.expected_return >= 0 ? "+" : ""}
                          {(parseFloat(formData.entry_price) * forecast.expected_return * parseInt(formData.quantity || "0")).toLocaleString()} VND
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1">
                    Không thể lấy dự đoán AI lúc này. Giao dịch vẫn sẽ được lưu.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-200">
              Huỷ
            </Button>
            <Button
              onClick={handleCreateOrEdit}
              disabled={submitting}
              className={cn(
                "font-bold",
                formData.action === "BUY"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-rose-600 hover:bg-rose-500 text-white"
              )}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang lưu...</>
              ) : mode === "CREATE" ? (
                `Ghi nhận lệnh ${formData.action === "BUY" ? "MUA" : "BÁN"}`
              ) : (
                "Cập nhật lệnh"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ===== RENDER: CLOSE MODE =====
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-400" /> Cập nhật kết quả giao dịch
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Nhập giá bán và thời điểm thoát lệnh. AI sẽ phân tích kết quả cho bạn.
          </DialogDescription>
        </DialogHeader>

        {/* Trade Info Summary */}
        {trade && (
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold mb-2">Thông tin lệnh đang mở</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Mã CK</span>
                <p className="text-slate-200 font-bold font-mono">{trade.symbol}</p>
              </div>
              <div>
                <span className="text-slate-500">Lệnh</span>
                <p className={cn("font-bold", trade.action === "BUY" ? "text-emerald-400" : "text-rose-400")}>
                  {trade.action === "BUY" ? "▲ MUA" : "▼ BÁN"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Giá vào</span>
                <p className="text-slate-200 font-mono font-bold">{trade.entry_price?.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-500">Số lượng</span>
                <p className="text-slate-200 font-mono">{trade.quantity?.toLocaleString()}</p>
              </div>
            </div>
            {/* Prediction at entry */}
            {trade.predicted_mu !== 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-2 text-[10px]">
                <Brain className="h-3 w-3 text-indigo-400" />
                <span className="text-indigo-300">AI đã dự đoán lúc vào lệnh:</span>
                <span className={cn(
                  "font-mono font-bold",
                  trade.predicted_mu >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {trade.predicted_mu >= 0 ? "+" : ""}{(trade.predicted_mu * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 py-2">
          {/* Row: Exit Price + Exit Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="h-3 w-3" /> Giá bán ra (VND)
              </Label>
              <Input
                type="number"
                value={closeData.exit_price}
                onChange={(e) => setCloseData({ ...closeData, exit_price: e.target.value })}
                placeholder="95,000"
                className="bg-slate-800/50 border-slate-700 text-slate-100 font-mono text-base"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" /> Thời điểm bán
              </Label>
              <Input
                type="date"
                value={closeData.exit_date}
                onChange={(e) => setCloseData({ ...closeData, exit_date: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* PnL Preview */}
          {previewPnL && (
            <div className={cn(
              "rounded-lg p-4 border text-center transition-all space-y-1",
              previewPnL.pnl >= 0
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-rose-500/10 border-rose-500/30"
            )}>
              <p className="text-xs text-slate-400">Kết quả thực tế</p>
              <p className={cn(
                "text-3xl font-bold font-mono",
                previewPnL.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {previewPnL.pnl >= 0 ? "+" : ""}{previewPnL.pnl.toLocaleString()} <span className="text-base">VND</span>
              </p>
              <p className={cn(
                "text-sm font-mono",
                previewPnL.pct >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {previewPnL.pct >= 0 ? "+" : ""}{previewPnL.pct.toFixed(2)}%
              </p>

              {/* === Dự đoán vs Thực tế === */}
              {predictionComparison && (
                <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2">
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <div className="text-center">
                      <p className="text-[10px] text-indigo-400 flex items-center gap-1 justify-center">
                        <Brain className="h-3 w-3" /> AI dự đoán
                      </p>
                      <p className={cn("font-mono font-bold",
                        predictionComparison.predictedPct >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {predictionComparison.predictedPct >= 0 ? "+" : ""}{predictionComparison.predictedPct.toFixed(2)}%
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600" />
                    <div className="text-center">
                      <p className="text-[10px] text-blue-400 flex items-center gap-1 justify-center">
                        <BarChart3 className="h-3 w-3" /> Thực tế
                      </p>
                      <p className={cn("font-mono font-bold",
                        predictionComparison.actualPct >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {predictionComparison.actualPct >= 0 ? "+" : ""}{predictionComparison.actualPct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-[10px]">
                    {predictionComparison.directionMatch ? (
                      <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> <span className="text-emerald-400">AI đoán đúng xu hướng!</span></>
                    ) : (
                      <><AlertTriangle className="h-3 w-3 text-amber-400" /> <span className="text-amber-400">AI đoán sai xu hướng</span></>
                    )}
                    <span className="text-slate-500 ml-2">
                      | Sai số: {predictionComparison.error.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <StickyNote className="h-3 w-3" /> Ghi chú
            </Label>
            <Textarea
              value={closeData.notes}
              onChange={(e) => setCloseData({ ...closeData, notes: e.target.value })}
              placeholder="Lý do bán, bài học rút ra..."
              className="bg-slate-800/50 border-slate-700 text-slate-100 min-h-[50px] resize-none"
            />
          </div>

          {/* ===== AI ANALYSIS PANEL ===== */}
          {previewPnL && (
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                    Phân tích từ AI
                  </span>
                </div>
                {!aiAnalysis && !aiLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 gap-1"
                    onClick={fetchAiAnalysis}
                  >
                    <Brain className="h-3 w-3" />
                    Nhờ AI phân tích
                  </Button>
                )}
              </div>

              {aiLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>AI đang phân tích giao dịch của bạn...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="text-xs text-slate-300 leading-relaxed p-2 bg-slate-800/40 rounded border border-slate-700/30 whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic">
                  Nhấn nút phía trên để AI phân tích kết quả giao dịch, so sánh với dự đoán, và đưa nhận xét.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-200">
            Huỷ
          </Button>
          <Button
            onClick={handleClose}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang xử lý...</>
            ) : (
              "Xác nhận đóng lệnh"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
