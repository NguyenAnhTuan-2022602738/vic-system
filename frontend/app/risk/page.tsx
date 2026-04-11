"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import {
  Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ReferenceLine, ComposedChart, Line
} from "recharts"
import { Shield, AlertTriangle, TrendingDown } from "lucide-react"

const varData = [
  { level: "90%", var: -1.2, loss: "572,400 VND" },
  { level: "95%", var: -1.8, loss: "860,400 VND" },
  { level: "99%", var: -3.2, loss: "1,529,600 VND" },
  { level: "99.5%", var: -4.1, loss: "1,959,800 VND" },
  { level: "99.9%", var: -5.8, loss: "2,772,400 VND" },
]

const stressTests = [
  { scenario: { en: "Market Crash (-15%)", vi: "Sap thi truong (-15%)" }, move: -15, impact: -12.5, recovery: 45 },
  { scenario: { en: "Flash Crash (-8%)", vi: "Sap nhanh (-8%)" }, move: -8, impact: -6.2, recovery: 18 },
  { scenario: { en: "Sector Rotation (-5%)", vi: "Xoay vong nganh (-5%)" }, move: -5, impact: -3.8, recovery: 10 },
  { scenario: { en: "Rate Hike (SBV +50bp)", vi: "Tang LS (NHNN +50bp)" }, move: -3, impact: -2.5, recovery: 8 },
  { scenario: { en: "Bull Rally (+10%)", vi: "Song tang (+10%)" }, move: 10, impact: 8.5, recovery: 0 },
  { scenario: { en: "Mild Correction (-3%)", vi: "Dieu chinh nhe (-3%)" }, move: -3, impact: -2.1, recovery: 5 },
]

const tailRiskData = [
  { percentile: "1st", loss: -5.8 },
  { percentile: "2nd", loss: -4.5 },
  { percentile: "5th", loss: -3.2 },
  { percentile: "10th", loss: -2.1 },
  { percentile: "25th", loss: -1.0 },
  { percentile: "50th", loss: 0.5 },
  { percentile: "75th", loss: 2.1 },
  { percentile: "90th", loss: 3.8 },
  { percentile: "95th", loss: 5.2 },
  { percentile: "99th", loss: 7.5 },
]

const correlationFactors = [
  { factor: "VN-Index", value: 0.82 },
  { factor: "USD/VND", value: -0.35 },
  { factor: { en: "Interest Rate", vi: "Lai suat" }, value: -0.45 },
  { factor: { en: "Oil Price", vi: "Gia dau" }, value: 0.28 },
  { factor: { en: "Sentiment", vi: "Cam xuc" }, value: 0.55 },
  { factor: { en: "Volume", vi: "Khoi luong" }, value: 0.42 },
]

const riskRadar = [
  { metric: { en: "Market Risk", vi: "RR thi truong" }, value: 65, fullMark: 100 },
  { metric: { en: "Liquidity Risk", vi: "RR thanh khoan" }, value: 25, fullMark: 100 },
  { metric: { en: "Volatility Risk", vi: "RR bien dong" }, value: 55, fullMark: 100 },
  { metric: { en: "Tail Risk", vi: "RR cuc tri" }, value: 40, fullMark: 100 },
  { metric: { en: "Correlation Risk", vi: "RR tuong quan" }, value: 50, fullMark: 100 },
  { metric: { en: "Concentration Risk", vi: "RR tap trung" }, value: 30, fullMark: 100 },
]

const riskMetrics = [
  { key: "risk.daily_var", value: "-1.8%" },
  { key: "risk.weekly_var", value: "-3.5%" },
  { key: "risk.monthly_var", value: "-6.2%" },
  { key: "risk.cvar95", value: "-2.9%" },
  { key: "risk.max_loss_30d", value: "-3.2%" },
  { key: "risk.beta", value: "1.12" },
]

export default function RiskPage() {
  const { t, locale } = useI18n()

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <DashboardHeader
        title={t("risk.title")}
        subtitle={t("risk.subtitle")}
      />

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Risk Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {riskMetrics.map((m, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">{t(m.key as any)}</p>
                <p className={cn(
                  "text-xl font-bold font-mono mt-1",
                  m.value.startsWith("-") ? "text-destructive" : "text-success"
                )}>{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* VaR Analysis & Tail Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    {t("risk.var_analysis")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("risk.var_analysis_sub")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t("risk.confidence_level")}</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">{t("risk.var_value")}</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">{t("risk.potential_loss")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {varData.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-foreground font-medium">{row.level}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-destructive">{row.var}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{row.loss}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    {t("risk.tail_risk")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("risk.tail_risk_sub")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={tailRiskData} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="percentile" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "#e2e8f0" }} formatter={(v: number) => [`${v}%`, locale === "vi" ? "Loi nhuan" : "Return"]} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                    <Bar dataKey="loss" radius={[4, 4, 0, 0]}>
                      {tailRiskData.map((entry, i) => (
                        <Cell key={i} fill={entry.loss < 0 ? "#ef4444" : "#10b981"} fillOpacity={0.7} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="loss" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3, fill: "#0ea5e9" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stress Test & Risk Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    {t("risk.stress_test")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("risk.stress_test_sub")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">{t("risk.scenario")}</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">{t("risk.market_move")}</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">{t("risk.portfolio_impact")}</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">{t("risk.recovery_days")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stressTests.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="py-2.5 px-2 text-foreground font-medium">{typeof row.scenario === "string" ? row.scenario : row.scenario[locale]}</td>
                        <td className={cn("py-2.5 px-2 text-right font-mono", row.move > 0 ? "text-success" : "text-destructive")}>{row.move > 0 ? "+" : ""}{row.move}%</td>
                        <td className={cn("py-2.5 px-2 text-right font-mono", row.impact > 0 ? "text-success" : "text-destructive")}>{row.impact > 0 ? "+" : ""}{row.impact}%</td>
                        <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">{row.recovery}{locale === "vi" ? " ngay" : "d"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-card-foreground">{t("risk.risk_summary")}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("risk.overall_risk")}</p>
                </div>
                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30 font-semibold">
                  {t("risk.moderate")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={riskRadar.map(d => ({ ...d, metric: typeof d.metric === "string" ? d.metric : d.metric[locale] }))}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <PolarRadiusAxis tick={{ fontSize: 9, fill: "#94a3b8" }} domain={[0, 100]} axisLine={false} />
                    <Radar name={t("risk.risk_level")} dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name={t("risk.risk_capacity")} dataKey="fullMark" stroke="#1e293b" fill="none" strokeDasharray="4 4" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Correlation Matrix */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{t("risk.correlation")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t("risk.correlation_sub")}</p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={correlationFactors.map(d => ({ ...d, factor: typeof d.factor === "string" ? d.factor : d.factor[locale] }))} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="factor" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "#e2e8f0" }} formatter={(v: number) => [v.toFixed(2), locale === "vi" ? "Tuong quan" : "Correlation"]} />
                  <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="4 4" />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {correlationFactors.map((entry, i) => (
                      <Cell key={i} fill={entry.value > 0 ? "#3b82f6" : "#ef4444"} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
