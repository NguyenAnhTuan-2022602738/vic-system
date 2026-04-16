"use client"

import { motion } from "framer-motion"
import { Cpu, Zap, Search, Layers } from "lucide-react"
import { useState, useEffect } from "react"

export function AIThinkingIndicator() {
  const [step, setStep] = useState(0)
  const steps = [
    "Khởi tạo luồng CNN-LSTM-Attention...",
    "Quét 1,250 phiên giao dịch VIC gần nhất...",
    "Phân tích tâm lý thị trường (Sentiment Mapping)...",
    "Đang tính toán giá trị rủi ro (VaR 95%)...",
    "Đang hợp nhất đa phương thức (Multimodal Fusion)..."
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-8 min-h-[300px]">
      <div className="relative">
        {/* Outer Glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
        />

        {/* Pulsing Rings */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut"
            }}
            className="absolute inset-0 border border-primary/40 rounded-full"
          />
        ))}

        {/* Central Core */}
        <div className="relative bg-background/80 backdrop-blur-md border border-primary/50 p-6 rounded-3xl shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Cpu className="w-12 h-12 text-primary" />
          </motion.div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            className="absolute -top-1 -right-1"
          >
            <Zap className="w-4 h-4 text-warning fill-warning" />
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-sm font-medium text-slate-300 animate-pulse"
        >
          {steps[step]}
        </motion.p>
        <div className="flex gap-1">
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
        </div>
      </div>
    </div>
  )
}
