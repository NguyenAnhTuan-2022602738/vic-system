"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RiskGauge({ value, label, max = 100 }: { value: number; label: string; max?: number }) {
  const percentage = (value / max) * 100
  const data = [
    { name: "value", value: percentage },
    { name: "rest", value: 100 - percentage },
  ]

  const getColor = () => {
    if (percentage >= 70) return "#10b981"
    if (percentage >= 40) return "#f59e0b"
    return "#ef4444"
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-0 pt-4">
        <CardTitle className="text-xs font-medium text-muted-foreground text-center">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[100px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius={35}
                outerRadius={48}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={getColor()} />
                <Cell fill="var(--border)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pt-3">
            <span className="text-lg font-bold font-mono text-foreground">{value}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
