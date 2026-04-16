"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect } from "react"
import {
  BarChart3,
  TrendingUp,
  Newspaper,
  LineChart,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Settings,
  Globe,
  Sun,
  Moon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { locale, setLocale, t } = useI18n()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { href: "/", icon: BarChart3, labelKey: "nav.dashboard" as const },
    { href: "/news", icon: Newspaper, labelKey: "nav.news" as const },
    { href: "/trade", icon: LineChart, labelKey: "nav.trade" as const },
    { href: "/backtest", icon: ShieldAlert, labelKey: "nav.backtest" as const },
  ]



  const toggleLocale = () => {
    setLocale(locale === "en" ? "vi" : "en")
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <aside
      suppressHydrationWarning
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
          <Activity className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">VIC Forecast</span>
            <span className="text-[10px] text-muted-foreground font-mono">Probabilistic Engine</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-2 py-2 border-t border-border">
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-xs font-medium",
          )}
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", mounted && resolvedTheme === "light" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>☀️</span>
              <span className="text-muted-foreground">/</span>
              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", mounted && resolvedTheme === "dark" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>🌙</span>
            </div>
          )}
        </button>
      </div>

      {/* Language Toggle */}
      <div className="px-2 py-2 border-t border-border">
        <button
          onClick={toggleLocale}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-xs font-medium",
          )}
        >
          <Globe className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", locale === "en" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>EN</span>
              <span className="text-muted-foreground">/</span>
              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", locale === "vi" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>VN</span>
            </div>
          )}
        </button>
      </div>

      <div className="px-2 py-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-xs"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>{t("common.collapse")}</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-mono">{t("common.system_online")}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono">{t("common.last_update")}</p>
        </div>
      )}
    </aside>
  )
}
