"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"

interface ModelComparison {
  name: string
  expected_return: number
  mae: number
}

interface ComparisonChartProps {
  data?: ModelComparison[]
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  const { t } = useI18n()

  const chartData = data || [
    { name: "LSTM (Manual)", expected_return: 0.12, mae: 0.0437 },
    { name: "Random Forest (Manual)", expected_return: 0.08, mae: 0.0521 },
    { name: "Linear Regression (Manual)", expected_return: 0.05, mae: 0.0612 },
  ]

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b"]

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">
          {t("chart.model_comparison")}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">So sánh kỳ vọng lợi nhuận (%)</p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} 
                axisLine={{ stroke: "var(--border)" }} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "var(--card)", 
                  border: "1px solid #1e293b", 
                  borderRadius: "8px", 
                  fontSize: "12px", 
                  color: "var(--foreground)" 
                }}
                formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, "Dự báo"]}
              />
              <Bar dataKey="expected_return" radius={[4, 4, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                ))}
                <LabelList 
                  dataKey="expected_return" 
                  position="top" 
                  formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                  style={{ fontSize: 10, fill: "var(--foreground)", fontWeight: "bold" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-2">
          {chartData.map((m, idx) => (
            <div key={m.name} className="bg-secondary/30 p-2 rounded-md border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold truncate">{m.name.split(' ')[0]}</p>
              <p className="text-xs font-bold mt-1" style={{ color: COLORS[idx] }}>
                MAE: {(m.mae * 100).toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
