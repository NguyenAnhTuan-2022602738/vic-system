import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getTrades, deleteTrade, updateTrade, TradeLog } from "@/lib/api"
import { ArrowUpCircle, XCircle, Trash2, CheckCircle2, MoreVertical, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export function TradeSignalsTable() {
  const [trades, setTrades] = useState<TradeLog[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleCloseTrade = async (id: string, currentPrice: number) => {
    try {
      await updateTrade(id, { status: "CLOSED", exit_price: currentPrice })
      toast.success("Trade closed successfully!")
      fetchTrades()
    } catch (error) {
      toast.error("Failed to close trade")
    }
  }

  const handleDeleteTrade = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return
    try {
      await deleteTrade(id)
      toast.success("Record deleted")
      fetchTrades()
    } catch (error) {
      toast.error("Failed to delete record")
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
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-100 uppercase tracking-tight">Trading Journal (Real-time)</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={fetchTrades}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 px-2 text-slate-500 font-medium">Date/Symbol</th>
                <th className="text-left py-2 px-2 text-slate-500 font-medium">Action</th>
                <th className="text-right py-2 px-2 text-slate-500 font-medium">Entry/Exit</th>
                <th className="text-right py-2 px-2 text-slate-500 font-medium">PnL/Return</th>
                <th className="text-center py-2 px-2 text-slate-500 font-medium">Status</th>
                <th className="text-right py-2 px-2 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-600 italic">No trades recorded yet.</td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                    <td className="py-3 px-2">
                      <div className="font-mono text-slate-300">{trade.entry_date.split('T')[0]}</div>
                      <div className="text-[10px] text-slate-500 font-bold">{trade.symbol}</div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5">
                        {getSignalIcon(trade.action)}
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-bold", getSignalColor(trade.action))}>
                          {trade.action}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="font-mono text-slate-200 font-medium">{trade.entry_price.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">{trade.exit_price ? trade.exit_price.toLocaleString() : "---"}</div>
                    </td>
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
                        <span className="text-slate-600 italic">Floating...</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant="secondary" className={cn("text-[9px] uppercase font-black", trade.status === 'OPEN' ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400")}>
                        {trade.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {trade.status === 'OPEN' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => handleCloseTrade(trade._id, trade.entry_price * 1.02)} // Demo: +2% closing
                            title="Close Trade"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
                          onClick={() => handleDeleteTrade(trade._id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

    </Card>
  )
}
