"use client"

import { motion } from "framer-motion"
import { Bot, MessageSquare, TrendingUp, TrendingDown, Info } from "lucide-react"
import { TypewriterText } from "./typewriter-text"
import { cn } from "@/lib/utils"

interface AIAssistantAdviceProps {
  recommendation: string
  expectedReturn: number
  confidence: number
  sentiment: number
}

export function AIAssistantAdvice({ recommendation, expectedReturn, confidence, sentiment }: AIAssistantAdviceProps) {
  const isPositive = recommendation === "BUY" || expectedReturn > 0
  const isStrong = confidence > 0.8
  
  // Tạo lời khuyên tiếng Việt dựa trên dữ liệu
  const getSummary = () => {
    if (recommendation === "BUY") {
      return `Chào anh! Sau khi phân tích sâu, tôi đề xuất MUA. Các chỉ số kỹ thuật và tâm lý đang rất tích cực (Sentiment: ${sentiment.toFixed(2)}). Dự kiến mức tăng trưởng khoảng ${expectedReturn.toFixed(2)}% trong chu kỳ tới. Đây là cơ hội tốt để vào lệnh.`
    } else if (recommendation === "SELL") {
      return `Cảnh báo: Tín hiệu BÁN đang chiếm ưu thế. Áp lực chốt lời và tâm lý tiêu cực đang gia tăng. Có thể xuất hiện nhịp điều chỉnh xuống mức ${Math.abs(expectedReturn).toFixed(2)}%. Anh nên cân nhắc hạ tỷ trọng để bảo vệ vốn.`
    } else {
      return `Thị trường đang trong trạng thái chờ đợi (HOLD). Biến động hiện tại không quá rõ rệt. Sentiment ở mức trung bình (${sentiment.toFixed(2)}). Tôi khuyên anh nên quan sát thêm mốc hỗ trợ gần nhất trước khi có quyết định mới.`
    }
  }

  return (
    <div className="flex gap-4 p-5 bg-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 rounded-full" />
      
      {/* Robot Avatar */}
      <motion.div 
        animate={{ 
          y: [0, -8, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="shrink-0 w-14 h-14 bg-background border border-primary/40 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 relative z-10"
      >
        <Bot className="w-8 h-8 text-primary" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }} 
          className="absolute top-1 right-1 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" 
        />
      </motion.div>

      {/* Message Content */}
      <div className="flex flex-col space-y-2 z-10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Intelligence</span>
          <div className="h-px flex-1 bg-primary/20" />
        </div>
        
        <div className="text-sm text-slate-200 leading-relaxed min-h-[60px]">
          <TypewriterText text={getSummary()} speed={15} delay={0.5} />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-background/50 border border-slate-700 rounded-full">
            <Info className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-400">Độ tin cậy: {Math.round(confidence * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
