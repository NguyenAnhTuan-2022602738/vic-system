"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  TrendingUp,
  BarChart3,
  Shield,
  Target,
  Activity,
  Percent,
} from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap = {
  "trending-up": TrendingUp,
  "bar-chart": BarChart3,
  shield: Shield,
  target: Target,
  activity: Activity,
  percent: Percent,
} as const

type IconName = keyof typeof iconMap

interface MetricCardProps {
  label: string
  value: string
  subValue?: string
  iconName: IconName
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
}

export function MetricCard({ label, value, subValue, iconName, trend, trendValue, className }: MetricCardProps) {
  const [isMounted, setIsMounted] = useState(false)
  const Icon = iconMap[iconName]

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-xl font-bold font-mono text-card-foreground tracking-tight">
              {isMounted ? value : "---"}
            </p>
            {subValue && <p className="text-xs text-muted-foreground font-mono">{subValue}</p>}
            {trendValue && (
              <p className={cn(
                "text-xs font-medium font-mono",
                trend === "up" && "text-success",
                trend === "down" && "text-destructive",
                trend === "neutral" && "text-warning"
              )}>
                {trend === "up" && "+"}{trendValue}
              </p>
            )}
          </div>
          <div className={cn(
            "p-2 rounded-md",
            trend === "up" && "bg-success/10",
            trend === "down" && "bg-destructive/10",
            (!trend || trend === "neutral") && "bg-primary/10"
          )}>
            <Icon className={cn(
              "w-4 h-4",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              (!trend || trend === "neutral") && "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
