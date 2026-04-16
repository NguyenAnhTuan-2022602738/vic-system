"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Bar, BarChart, Cell, ComposedChart, Line
} from "recharts"
import { getPerformanceMetrics, PerformanceResult } from "@/lib/api"
import { Play, TrendingUp, Target, Shield, Activity, BarChart3, AlertCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function BacktestDashboard() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PerformanceResult | null>(null)
  const [days, setDays] = useState(30)

  const runBacktest = async () => {
    setLoading(true)
    try {
      const data = await getPerformanceMetrics(days)
      setResult(data)
    } catch (error) {
      console.error("Backtest failed:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    runBacktest()
  }, [])

  if (loading && !result) {
    return <BacktestLoading />
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between bg-card/50 p-4 rounded-xl border border-border">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Simulation Window</h3>
            <div className="flex gap-2">
              {[15, 30, 60].map((d) => (
                <Button 
                  key={d} 
                  variant={days === d ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setDays(d)}
                  className="h-8 px-3"
                >
                  {d} Days
                </Button>
              ))}
            </div>
          </div>
        </div>
        <Button 
          onClick={runBacktest} 
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
        >
          {loading ? (
            <Activity className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4 fill-current" />
          )}
          Run New Simulation
        </Button>
      </div>

      {result && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricBox 
              label="Total Return" 
              value={`${result.metrics.total_return > 0 ? "+" : ""}${result.metrics.total_return}%`} 
              icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
              subValue="Cumulative Yield"
              trend={result.metrics.total_return > 0 ? "up" : "down"}
            />
            <MetricBox 
              label="Win Rate" 
              value={`${result.metrics.win_rate}%`} 
              icon={<Target className="w-4 h-4 text-blue-500" />}
              subValue={`${result.metrics.total_trades} Trades Executed`}
              trend={result.metrics.win_rate > 50 ? "up" : "down"}
            />
            <MetricBox 
              label="Profit Factor" 
              value={result.metrics.profit_factor.toString()} 
              icon={<Activity className="w-4 h-4 text-amber-500" />}
              subValue="Gross Profit / Loss"
              trend={result.metrics.profit_factor > 1.5 ? "up" : "down"}
            />
            <MetricBox 
              label="Max Drawdown" 
              value={`${result.metrics.max_drawdown}%`} 
              icon={<Shield className="w-4 h-4 text-rose-500" />}
              subValue="Account Risk"
              trend="down"
            />
             <MetricBox 
              label="Sharpe Ratio" 
              value={result.metrics.sharpe_ratio.toString()} 
              icon={<BarChart3 className="w-4 h-4 text-indigo-500" />}
              subValue="Risk-Adjusted Return"
              trend={result.metrics.sharpe_ratio > 1 ? "up" : "down"}
            />
            <MetricBox 
              label="Symbol" 
              value={result.symbol} 
              icon={<AlertCircle className="w-4 h-4 text-muted-foreground" />}
              subValue="VinGroup JSC"
              trend="neutral"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Equity Curve */}
            <Card className="lg:col-span-2 bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Equity Curve (Strategy vs Benchmark)</CardTitle>
                <CardDescription>Visualizing simulation growth over {days} days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={result.history}>
                      <defs>
                        <linearGradient id="colorStrat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={10} 
                        tickFormatter={(v) => v.split('-').slice(1).join('/')}
                        stroke="var(--muted-foreground)"
                      />
                      <YAxis 
                        fontSize={10} 
                        domain={['auto', 'auto']}
                        stroke="var(--muted-foreground)"
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px" }}
                        labelStyle={{ color: "var(--primary)", fontWeight: "bold" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="strategy_value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorStrat)" 
                        name="AI Strategy"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="benchmark_value" 
                        stroke="var(--muted-foreground)" 
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        dot={false}
                        name="VN-Index"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Signal Distribution */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Execution Log</CardTitle>
                <CardDescription>Daily decisions & Outcome</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.history.slice().reverse().map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                      <div>
                        <p className="text-xs font-medium">{item.date}</p>
                        <Badge variant={item.signal === "BUY" ? "default" : "secondary"} className="text-[9px] h-4 mt-1">
                          {item.signal}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${item.daily_return && item.daily_return > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {item.daily_return && item.daily_return > 0 ? "+" : ""}{(Number(item.daily_return || 0) * 100).toFixed(2)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">Return</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function MetricBox({ label, value, icon, subValue, trend }: { label: string, value: string, icon: any, subValue: string, trend: "up" | "down" | "neutral" }) {
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : "text-muted-foreground"
  
  return (
    <Card className="bg-card/50 border-border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase">{label}</span>
        {icon}
      </div>
      <div>
        <div className={`text-xl font-bold font-mono ${trendColor}`}>{value}</div>
        <p className="text-[10px] text-muted-foreground truncate">{subValue}</p>
      </div>
    </Card>
  )
}

function BacktestLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[60px] w-full rounded-xl" />
      <div className="grid grid-cols-6 gap-3">
        {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-[410px] rounded-xl" />
        <Skeleton className="h-[410px] rounded-xl" />
      </div>
    </div>
  )
}
