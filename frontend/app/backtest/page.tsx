"use client"

import { BacktestDashboard } from "@/components/backtest-dashboard"
import { useI18n } from "@/lib/i18n"
import { History, TrendingUp } from "lucide-react"

export default function BacktestPage() {
  const { t } = useI18n()

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary mb-1">
            <History className="w-5 h-5" />
            <span className="text-xs font-bold tracking-widest uppercase">Simulation Engine</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Strategy Backtesting
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Evaluate AI performance by simulating trades on historical data. Our engine executes "blind researchers" 
            that only look at data available at each point in time.
          </p>
        </div>
      </div>

      <BacktestDashboard />
    </div>
  )
}
