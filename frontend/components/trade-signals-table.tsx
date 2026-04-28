import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getTrades, deleteTrade, askAssistant, TradeLog } from "@/lib/api"
import { ArrowUpCircle, Trash2, CheckCircle2, RefreshCw, Plus, Pencil, Brain, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { TradeDialog } from "@/components/trade-dialog"

interface TradeSignalsTableProps {
  onDataChanged?: () => void
}

export function TradeSignalsTable({ onDataChanged }: TradeSignalsTableProps) {
  const [trades, setTrades] = useState<TradeLog[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"CREATE" | "CLOSE" | "EDIT">("CREATE")
  const [selectedTrade, setSelectedTrade] = useState<TradeLog | null>(null)

  // AI Analysis inline
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null)
  const [inlineAnalysis, setInlineAnalysis] = useState<Record<string, string>>({})
  const [inlineLoading, setInlineLoading] = useState<string | null>(null)

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const data = await getTrades()
      setTrades(data || [])
    } catch (error) {
      console.error("Failed to fetch trades:", error)
      toast.error("Failed to load trading journal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [])

  const handleDialogSuccess = () => {
    fetchTrades()
    onDataChanged?.()
  }

  const openCreateDialog = () => {
    setDialogMode("CREATE")
    setSelectedTrade(null)
    setDialogOpen(true)
  }

  const openCloseDialog = (trade: TradeLog) => {
    setDialogMode("CLOSE")
    setSelectedTrade(trade)
    setDialogOpen(true)
  }

  const openEditDialog = (trade: TradeLog) => {
    setDialogMode("EDIT")
    setSelectedTrade(trade)
    setDialogOpen(true)
  }

  const handleDeleteTrade = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá bản ghi này?")) return
    try {
      await deleteTrade(id)
      toast.success("Đã xoá bản ghi")
      fetchTrades()
      onDataChanged?.()
    } catch (error) {
      toast.error("Lỗi khi xoá bản ghi")
    }
  }

  // Toggle AI analysis for a closed trade
  const toggleAnalysis = async (trade: TradeLog) => {
    if (expandedTradeId === trade._id) {
      setExpandedTradeId(null)
      return
    }

    setExpandedTradeId(trade._id)

    // If already fetched, don't re-fetch
    if (inlineAnalysis[trade._id]) return

    setInlineLoading(trade._id)
    try {
      const actualReturn = trade.actual_return ? (trade.actual_return * 100).toFixed(2) : "N/A"
      const predictedReturn = trade.predicted_mu ? (trade.predicted_mu * 100).toFixed(2) : "N/A"

      const context = `
Giao dịch cổ phiếu ${trade.symbol}:
- Loại lệnh: ${trade.action}
- Ngày vào: ${trade.entry_date?.split("T")[0]}
- Giá vào: ${trade.entry_price?.toLocaleString()} VND
- Giá thoát: ${trade.exit_price?.toLocaleString()} VND
- Số CP: ${trade.quantity}
- PnL: ${trade.pnl?.toLocaleString()} VND
- Lợi nhuận thực tế: ${actualReturn}%
- AI đã dự đoán: ${predictedReturn}%
- Ghi chú: ${trade.notes || "Không có"}
`
      const response = await askAssistant(
        "Phân tích ngắn gọn giao dịch này: so sánh dự đoán AI vs thực tế, nhận xét quyết định, bài học rút ra. Tối đa 3-4 câu.",
        context
      )
      if (response && response.answer) {
        setInlineAnalysis(prev => ({ ...prev, [trade._id]: response.answer }))
      } else {
        console.warn("AI Response missing answer:", response)
        setInlineAnalysis(prev => ({ ...prev, [trade._id]: "⚠️ AI không trả về câu trả lời. Thử lại sau." }))
      }
    } catch (error) {
      setInlineAnalysis(prev => ({ ...prev, [trade._id]: "⚠️ Không kết nối được AI. Thử lại sau." }))
    } finally {
      setInlineLoading(null)
    }
  }

  const getSignalIcon = (action: string) => {
    if (action === "BUY") return <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
    return <ArrowUpCircle className="w-3.5 h-3.5 text-rose-400 rotate-180" />
  }

  const getSignalColor = (action: string) => {
    if (action === "BUY") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    return "bg-rose-500/10 text-rose-400 border-rose-500/30"
  }


  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              Nhật ký Giao dịch
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 gap-1.5"
                onClick={openCreateDialog}
              >
                <Plus className="h-3.5 w-3.5" />
                Ghi nhận lệnh mới
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={fetchTrades}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Ngày/Mã CK</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Lệnh</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Giá vào/ra</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">AI Dự đoán</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Thực tế</th>
                  <th className="text-center py-2 px-2 text-slate-500 font-medium">Trạng thái</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-600">
                        <p className="text-sm italic">Chưa có giao dịch nào.</p>
                        <p className="text-[10px] text-slate-600 max-w-xs">
                          Ghi nhận lệnh MUA/BÁN để theo dõi kết quả và nhận phân tích từ AI.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 mt-2"
                          onClick={openCreateDialog}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Ghi nhận lệnh đầu tiên
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <React.Fragment key={trade._id}>
                      <tr key={trade._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                        {/* Date & Symbol */}
                        <td className="py-3 px-2">
                          <div className="font-mono text-slate-300">{trade.entry_date?.split('T')[0]}</div>
                          <div className="text-[10px] text-slate-500 font-bold">{trade.symbol} · x{trade.quantity?.toLocaleString()}</div>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            {getSignalIcon(trade.action)}
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-bold", getSignalColor(trade.action))}>
                              {trade.action}
                            </Badge>
                          </div>
                        </td>

                        {/* Entry / Exit Price */}
                        <td className="py-3 px-2 text-right">
                          <div className="font-mono text-slate-200 font-medium">{trade.entry_price?.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">
                            {trade.exit_price ? `→ ${trade.exit_price.toLocaleString()}` : "Chưa bán"}
                          </div>
                        </td>

                        {/* AI Prediction */}
                        <td className="py-3 px-2 text-right">
                          {trade.predicted_mu ? (
                            <div className={cn(
                              "font-mono font-bold text-[11px]",
                              trade.predicted_mu >= 0 ? "text-indigo-300" : "text-amber-300"
                            )}>
                              {trade.predicted_mu >= 0 ? "+" : ""}{(trade.predicted_mu * 100).toFixed(2)}%
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[10px]">—</span>
                          )}
                        </td>

                        {/* Actual Result */}
                        <td className="py-3 px-2 text-right">
                          {trade.status === 'CLOSED' ? (
                            <>
                              <div className={cn("font-mono font-bold", (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                {(trade.pnl || 0) >= 0 ? "+" : ""}{trade.pnl?.toLocaleString()}
                              </div>
                              <div className={cn("text-[10px]", (trade.actual_return || 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {((trade.actual_return || 0) * 100).toFixed(2)}%
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-600 italic text-[10px]">Đang giữ...</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-2 text-center">
                          <Badge variant="secondary" className={cn("text-[9px] uppercase font-black", trade.status === 'OPEN' ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400")}>
                            {trade.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {trade.status === 'OPEN' ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"
                                  onClick={() => openEditDialog(trade)}
                                  title="Sửa lệnh"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => openCloseDialog(trade)}
                                  title="Cập nhật kết quả"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-7 w-7",
                                  expandedTradeId === trade._id
                                    ? "text-indigo-400 bg-indigo-500/10"
                                    : "text-indigo-400/50 hover:text-indigo-400 hover:bg-indigo-500/10"
                                )}
                                onClick={() => toggleAnalysis(trade)}
                                title="AI phân tích"
                              >
                                {inlineLoading === trade._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : expandedTradeId === trade._id ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <Brain className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
                              onClick={() => handleDeleteTrade(trade._id)}
                              title="Xoá"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Inline AI Analysis Row */}
                      {expandedTradeId === trade._id && (
                        <tr key={`${trade._id}-analysis`} className="border-b border-indigo-500/10">
                          <td colSpan={7} className="px-3 py-3">
                            <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-3.5 w-3.5 text-indigo-400" />
                                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">Phân tích AI</span>

                                {/* Direction match indicator */}
                                {trade.predicted_mu !== undefined && trade.actual_return !== undefined && (
                                  <Badge variant="outline" className={cn(
                                    "text-[9px] ml-auto",
                                    (trade.predicted_mu >= 0) === ((trade.actual_return || 0) >= 0)
                                      ? "border-emerald-500/30 text-emerald-400"
                                      : "border-amber-500/30 text-amber-400"
                                  )}>
                                    {(trade.predicted_mu >= 0) === ((trade.actual_return || 0) >= 0)
                                      ? "✓ Đúng xu hướng"
                                      : "✗ Sai xu hướng"}
                                  </Badge>
                                )}
                              </div>

                              {inlineLoading === trade._id ? (
                                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  AI đang phân tích...
                                </div>
                              ) : (
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                  {inlineAnalysis[trade._id] || "Đang tải..."}
                                </p>
                              )}

                              {/* Quick comparison */}
                              {trade.predicted_mu !== undefined && trade.status === 'CLOSED' && (
                                <div className="mt-2 pt-2 border-t border-slate-700/30 flex items-center gap-4 text-[10px]">
                                  <span className="text-slate-500">
                                    AI: <span className={cn("font-mono font-bold", trade.predicted_mu >= 0 ? "text-indigo-300" : "text-amber-300")}>
                                      {trade.predicted_mu >= 0 ? "+" : ""}{(trade.predicted_mu * 100).toFixed(2)}%
                                    </span>
                                  </span>
                                  <span className="text-slate-600">→</span>
                                  <span className="text-slate-500">
                                    Thực tế: <span className={cn("font-mono font-bold", (trade.actual_return || 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                      {(trade.actual_return || 0) >= 0 ? "+" : ""}{((trade.actual_return || 0) * 100).toFixed(2)}%
                                    </span>
                                  </span>
                                  <span className="text-slate-500 ml-auto">
                                    Sai số: <span className="font-mono text-slate-400">
                                      {Math.abs((trade.predicted_mu || 0) * 100 - (trade.actual_return || 0) * 100).toFixed(2)}%
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Trade Dialog */}
      <TradeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        trade={selectedTrade}
        onSuccess={handleDialogSuccess}
      />
    </>
  )
}
