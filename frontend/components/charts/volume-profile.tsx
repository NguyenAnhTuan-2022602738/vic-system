"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getVolumeProfile, VolumeBin } from "@/lib/api"
import { useI18n } from "@/lib/i18n"
import { Skeleton } from "@/components/ui/skeleton"

export function VolumeProfile() {
  const { t } = useI18n()
  const [data, setData] = useState<VolumeBin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getVolumeProfile()
        setData(result.bins)
      } catch (error) {
        console.error("Failed to fetch volume profile:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{t("chart.volume_profile")}</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">{t("chart.volume_profile_sub")}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} vertical={false} />
              <XAxis 
                type="number" 
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
              />
              <YAxis 
                type="category" 
                dataKey="price" 
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} 
                axisLine={false} 
                tickLine={false} 
                width={60} 
              />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }}
                formatter={(value: number) => [`${(value / 1000).toFixed(1)}k`, t("chart.volume")]}
              />
              <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.type === "support" ? "#10b981" : entry.type === "resistance" ? "#ef4444" : "#3b82f6"}
                    fillOpacity={0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
