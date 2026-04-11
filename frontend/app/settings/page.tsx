"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { Save, RotateCcw, CheckCircle, Server, Database, Clock, Cpu } from "lucide-react"

const defaults = {
  alpha: 0.3,
  beta: 0.2,
  lookback: 30,
  varConfidence: 95,
  maxPosition: 10,
  stopLoss: 5,
  takeProfit: 8,
  minProbGain: 65,
  minSharpe: 1.2,
  maxVarBuy: 3,
}

export default function SettingsPage() {
  const { t, locale } = useI18n()
  const [saved, setSaved] = useState(false)

  const [alpha, setAlpha] = useState(defaults.alpha)
  const [beta, setBeta] = useState(defaults.beta)
  const [lookback, setLookback] = useState(defaults.lookback)
  const [varConfidence, setVarConfidence] = useState(defaults.varConfidence)
  const [maxPosition, setMaxPosition] = useState(defaults.maxPosition)
  const [stopLoss, setStopLoss] = useState(defaults.stopLoss)
  const [takeProfit, setTakeProfit] = useState(defaults.takeProfit)
  const [minProbGain, setMinProbGain] = useState(defaults.minProbGain)
  const [minSharpe, setMinSharpe] = useState(defaults.minSharpe)
  const [maxVarBuy, setMaxVarBuy] = useState(defaults.maxVarBuy)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setAlpha(defaults.alpha)
    setBeta(defaults.beta)
    setLookback(defaults.lookback)
    setVarConfidence(defaults.varConfidence)
    setMaxPosition(defaults.maxPosition)
    setStopLoss(defaults.stopLoss)
    setTakeProfit(defaults.takeProfit)
    setMinProbGain(defaults.minProbGain)
    setMinSharpe(defaults.minSharpe)
    setMaxVarBuy(defaults.maxVarBuy)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <DashboardHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      />

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* System Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Cpu className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t("settings.model_version")}</p>
                <p className="text-sm font-bold font-mono text-foreground">v2.4.1</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-success/10">
                <Clock className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t("settings.last_trained")}</p>
                <p className="text-sm font-bold font-mono text-foreground">2026-02-25</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-accent/10">
                <Database className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t("settings.data_points")}</p>
                <p className="text-sm font-bold font-mono text-foreground">1,247</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-warning/10">
                <Server className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t("settings.inference_time")}</p>
                <p className="text-sm font-bold font-mono text-foreground">~120ms</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Parameters */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-card-foreground">{t("settings.model_params")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("settings.model_params_sub")}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ParamSlider
              label={t("settings.alpha")}
              description={t("settings.alpha_desc")}
              value={alpha}
              onChange={setAlpha}
              min={0}
              max={1}
              step={0.05}
              format={(v) => v.toFixed(2)}
            />
            <ParamSlider
              label={t("settings.beta_param")}
              description={t("settings.beta_desc")}
              value={beta}
              onChange={setBeta}
              min={0}
              max={1}
              step={0.05}
              format={(v) => v.toFixed(2)}
            />
            <ParamSlider
              label={t("settings.lookback")}
              description={t("settings.lookback_desc")}
              value={lookback}
              onChange={setLookback}
              min={7}
              max={90}
              step={1}
              format={(v) => `${v}`}
            />
          </CardContent>
        </Card>

        {/* Risk Parameters */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-card-foreground">{t("settings.risk_params")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("settings.risk_params_sub")}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ParamSlider
              label={t("settings.var_confidence")}
              description=""
              value={varConfidence}
              onChange={setVarConfidence}
              min={90}
              max={99.9}
              step={0.5}
              format={(v) => `${v}%`}
            />
            <ParamSlider
              label={t("settings.max_position")}
              description=""
              value={maxPosition}
              onChange={setMaxPosition}
              min={1}
              max={50}
              step={1}
              format={(v) => `${v}%`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ParamSlider
                label={t("settings.stop_loss")}
                description=""
                value={stopLoss}
                onChange={setStopLoss}
                min={1}
                max={15}
                step={0.5}
                format={(v) => `${v}%`}
              />
              <ParamSlider
                label={t("settings.take_profit")}
                description=""
                value={takeProfit}
                onChange={setTakeProfit}
                min={1}
                max={20}
                step={0.5}
                format={(v) => `${v}%`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trading Rules */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-card-foreground">{t("settings.trading_rules")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("settings.trading_rules_sub")}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ParamSlider
              label={t("settings.min_prob")}
              description=""
              value={minProbGain}
              onChange={setMinProbGain}
              min={50}
              max={90}
              step={1}
              format={(v) => `${v}%`}
            />
            <ParamSlider
              label={t("settings.min_sharpe")}
              description=""
              value={minSharpe}
              onChange={setMinSharpe}
              min={0}
              max={3}
              step={0.1}
              format={(v) => v.toFixed(1)}
            />
            <ParamSlider
              label={t("settings.max_var_buy")}
              description=""
              value={maxVarBuy}
              onChange={setMaxVarBuy}
              min={1}
              max={10}
              step={0.5}
              format={(v) => `${v}%`}
            />
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? t("settings.saved") : t("settings.save")}
          </Button>
          <Button onClick={handleReset} variant="outline" className="gap-2 border-border text-foreground hover:bg-secondary">
            <RotateCcw className="w-4 h-4" />
            {t("settings.reset")}
          </Button>
        </div>
      </main>
    </div>
  )
}

function ParamSlider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string
  description: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-foreground">{label}</p>
          {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary border-primary/30 px-2">
          {format(value)}
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  )
}
