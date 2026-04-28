"use client"

import { Bell, Search, Settings, Globe, Calendar as CalendarIcon, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function DashboardHeader({ 
  title, 
  subtitle,
  currentPrice,
  priceChange,
  selectedDate,
  onDateChange
}: { 
  title: string; 
  subtitle?: string;
  currentPrice?: number;
  priceChange?: number;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}) {
  const { locale, setLocale } = useI18n()
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <header suppressHydrationWarning className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
          <span className="text-xs font-mono font-semibold text-foreground">VIC</span>
          <span className="text-xs font-mono text-success" suppressHydrationWarning>
            {currentPrice !== undefined 
              ? new Intl.NumberFormat('vi-VN').format(currentPrice) 
              : "47.800"}
          </span>
          {priceChange !== undefined && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priceChange >= 0 ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}>
              {priceChange >= 0 ? "+" : ""}{priceChange}%
            </Badge>
          )}
        </div>
        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === "en" ? "vi" : "en")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary border border-border hover:bg-muted transition-colors"
          title={locale === "en" ? "Switch to Vietnamese" : "Chuyen sang Tieng Anh"}
        >
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold text-foreground">{locale === "en" ? "EN" : "VN"}</span>
        </button>
        <button className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <button className="relative p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
        </button>

        {/* Date Picker & Time Travel Controls */}
        <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-800">
          <div className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md border transition-all duration-300",
            selectedDate ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "bg-secondary border-border"
          )}>
            <CalendarIcon className={cn("w-3.5 h-3.5", selectedDate ? "text-indigo-400" : "text-muted-foreground")} />
            <input 
              type="date" 
              value={selectedDate || ""} 
              max={todayStr}
              onChange={(e) => onDateChange?.(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-foreground focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          {selectedDate && (
            <button
              onClick={() => onDateChange?.("")}
              className="p-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Return to Live Mode"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
