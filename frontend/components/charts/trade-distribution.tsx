"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"

const tradeReturns = [
  { range: "-4 to -3%", count: 1, type: "loss" },
  { range: "-3 to -2%", count: 2, type: "loss" },
  { range: "-2 to -1%", count: 3, type: "loss" },
  { range: "-1 to 0%", count: 2, type: "loss" },
  { range: "0 to +1%", count: 3, type: "win" },
  { range: "+1 to +2%", count: 4, type: "win" },
  { range: "+2 to +3%", count: 4, type: "win" },
  { range: "+3 to +4%", count: 3, type: "win" },
  { range: "+4 to +5%", count: 2, type: "win" },
]

interface TradeDistributionProps {
  data?: any[]
}

export function TradeDistribution({ data: customReturns }: TradeDistributionProps) {
  const { t } = useI18n()
  
  const displayReturns = customReturns && customReturns.length > 0
    ? customReturns.map(d => ({ 
        range: d.name, 
        count: d.value, 
        type: d.name.includes("-") ? "loss" : "win" 
      }))
    : tradeReturns;

  const totalTrades = displayReturns.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.trade_returns")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{t("chart.trade_returns_sub")}</p>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayReturns} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} angle={-25} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name={t("trade.trades")}>
                  {displayReturns.map((entry, index) => (
                    <Cell key={index} fill={entry.type === "win" ? "#10b981" : "#ef4444"} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Signal Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Execution stats across symbols</p>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayReturns}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="count"
                  stroke="none"
                  label={({ range, count }) => `${range}: ${count}`}
                  labelLine={{ stroke: "var(--muted-foreground)" }}
                >
                  {displayReturns.map((entry, index) => (
                    <Cell key={index} fill={entry.type === "win" ? "#10b981" : "#ef4444"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold font-mono text-foreground">{totalTrades}</p>
                <p className="text-[10px] text-muted-foreground">{t("common.total")}</p>
              </div>
            </div>
          </div>
        </CardContent>

      </Card>
    </div>
  )
}
