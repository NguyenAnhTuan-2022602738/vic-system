"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Separator } from "@/components/ui/separator"
import { TradingSignal } from "@/lib/api"
import { TrendingUp, TrendingDown, Minus, ShieldAlert, Target, Info, ClipboardList } from "lucide-react"
import { useState } from "react"
import { RecordTradeModal } from "./record-trade-modal"

interface TradingSignalsProps {
  signal?: TradingSignal
  loading?: boolean
  onTradeRecord?: () => void
}

export function TradingSignals({ signal, loading, onTradeRecord }: TradingSignalsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4" />
            TRADING ADVICE
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-slate-500">Calculating signals...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!signal) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">TRADING ADVICE</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-slate-500">No signals generated for current parameters.</p>
        </CardContent>
      </Card>
    )
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "SELL": return "bg-rose-500/20 text-rose-400 border-rose-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "BUY": return <TrendingUp className="w-6 h-6 text-emerald-400" />
      case "SELL": return <TrendingDown className="w-6 h-6 text-rose-400" />
      default: return <Minus className="w-6 h-6 text-slate-400" />
    }
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full overflow-hidden">
      <div className={`h-1 w-full ${signal.action === 'BUY' ? 'bg-emerald-500' : signal.action === 'SELL' ? 'bg-rose-500' : 'bg-slate-500'}`} />
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
          <span>AI Trading Advice</span>
          <Badge variant="outline" className={getActionColor(signal.action)}>
            {signal.risk_level} Risk
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${signal.action === 'BUY' ? 'bg-emerald-500/10' : signal.action === 'SELL' ? 'bg-rose-500/10' : 'bg-slate-500/10'}`}>
              {getActionIcon(signal.action)}
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight">{signal.action}</div>
              <div className="text-xs text-slate-500">Confidence: {Math.round(signal.confidence * 100)}%</div>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-500" />
              Stop Loss
            </div>
            <div className="text-lg font-mono font-medium text-slate-200">
              {signal.stop_loss > 0 ? signal.stop_loss.toLocaleString() : "N/A"}
            </div>
            <div className="text-[10px] text-slate-600">Max risk/unit</div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-500" />
              Take Profit
            </div>
            <div className="text-lg font-mono font-medium text-slate-200">
              {signal.take_profit > 0 ? signal.take_profit.toLocaleString() : "N/A"}
            </div>
            <div className="text-[10px] text-slate-600">Target price</div>
          </div>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
          <p className="text-[11px] text-slate-400 italic leading-relaxed">
            {signal.action === 'BUY' 
              ? "Optimization: Strong probability of upside gain combined with positive market sentiment."
              : signal.action === 'SELL'
              ? "Warning: Negative sentiment or high uncertainty detected. Exit or hedge position."
              : "Neutral: Sideways movement expected. Wait for a clearer trend or better entry point."}
          </p>
        </div>

        {signal.action !== 'HOLD' && (
          <Button 
            className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold h-10 shadow-lg shadow-black/20"
            onClick={() => setIsModalOpen(true)}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            RECORD TRANSACTION
          </Button>
        )}

        <RecordTradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          signal={signal}
          currentPrice={signal.last_price || 0}
          onSuccess={onTradeRecord}
        />
      </CardContent>

    </Card>
  )
}
