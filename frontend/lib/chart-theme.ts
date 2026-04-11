"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Chart theme colors — auto-adapts to dark/light mode
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = !mounted || resolvedTheme === "dark"

  return {
    isDark,
    // Grid & axes
    grid: isDark ? "#1e293b" : "#e2e8f0",
    axis: isDark ? "#1e293b" : "#e2e8f0",
    tick: isDark ? "#94a3b8" : "#64748b",
    // Tooltip
    tooltipBg: isDark ? "#111827" : "#ffffff",
    tooltipBorder: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
    tooltipText: isDark ? "#e2e8f0" : "#0f172a",
    tooltipLabel: isDark ? "#94a3b8" : "#64748b",
    // Common reference lines
    refLine: isDark ? "#94a3b8" : "#94a3b8",
  }
}

/** Pre-built tooltip style object */
export function useTooltipStyle() {
  const c = useChartTheme()
  return {
    backgroundColor: c.tooltipBg,
    border: c.tooltipBorder,
    borderRadius: "8px",
    fontSize: "12px",
    color: c.tooltipText,
  }
}
