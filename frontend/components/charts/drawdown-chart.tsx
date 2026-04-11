"use client"

import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"

const drawdownData = [
  { date: "01/15", drawdown: 0 },
  { date: "01/20", drawdown: -0.3 },
  { date: "01/23", drawdown: 0 },
  { date: "02/03", drawdown: -0.5 },
  { date: "02/07", drawdown: 0 },
  { date: "02/10", drawdown: -1.8 },
  { date: "02/12", drawdown: -0.9 },
  { date: "02/14", drawdown: -0.2 },
  { date: "02/17", drawdown: 0 },
  { date: "02/19", drawdown: -0.4 },
  { date: "02/21", drawdown: 0 },
  { date: "02/24", drawdown: -0.3 },
  { date: "02/26", drawdown: 0 },
]

export function DrawdownChart() {
  const { t } = useI18n()
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.drawdown")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t("chart.drawdown_sub")}</p>
          </div>
          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
            Max DD: -3.2%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drawdownData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis domain={[-4, 0.5]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} formatter={(v: number) => [`${v.toFixed(1)}%`, "Drawdown"]} />
              <ReferenceLine y={-3.2} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Max DD -3.2%", fill: "#ef4444", fontSize: 10 }} />
              <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} fill="url(#ddGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
