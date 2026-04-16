"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Send, X, Bot, Sparkles, AlertCircle, TrendingUp, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { askAssistant } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function AICoPilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Chào anh Tuấn! Tôi là VIC AI Co-Pilot. Tôi đã sẵn sàng phân tích mã VIC cùng anh hôm nay. Anh muốn tôi giải thích tín hiệu Robot hay tóm tắt tin tức mới nhất?" }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMsg = inputValue.trim()
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await askAssistant(userMsg)
      setMessages(prev => [...prev, { role: "assistant", content: response.answer }])
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Rất tiếc, dường như có lỗi kết nối với bộ não AI. Anh vui lòng thử lại sau chút nhé!" }])
    } finally {
      setIsLoading(false)
    }
  }

  const quickQuestions = [
    { label: "Tại sao nên MUA?", icon: <TrendingUp className="w-3 h-3" /> },
    { label: "Tóm tắt tin tức VIC", icon: <Newspaper className="w-3 h-3" /> },
    { label: "Rủi ro dự báo là gì?", icon: <AlertCircle className="w-3 h-3" /> },
  ]

  const handleQuickQuestion = (label: string) => {
    setInputValue(label)
    // Optional: Auto-send after a short delay
    setTimeout(() => {
      const sendBtn = document.getElementById("send-assistant-btn")
      sendBtn?.click()
    }, 100)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4"
          >
            <Card className="w-[380px] h-[500px] flex flex-col shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b bg-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">VIC AI Co-Pilot</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] text-muted-foreground italic">Phân tích Real-time</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted text-foreground rounded-tl-none border"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-2xl rounded-tl-none border flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer / Input */}
              <div className="p-3 border-t bg-muted/30">
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(q.label)}
                      className="text-[11px] px-2 py-1 bg-background border rounded-full hover:bg-primary/10 hover:border-primary/50 transition-colors flex items-center gap-1 text-muted-foreground"
                    >
                      {q.icon}
                      {q.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Hỏi về VIC..."
                      className="w-full h-10 px-4 pr-10 rounded-full border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    />
                    <Sparkles className="absolute right-3 top-2.5 w-4 h-4 text-primary/40" />
                  </div>
                  <Button 
                    id="send-assistant-btn"
                    size="icon" 
                    onClick={handleSend} 
                    disabled={isLoading || !inputValue.trim()}
                    className="rounded-full shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[9px] text-center text-muted-foreground mt-2 italic px-4">
                   Dữ liệu được phân tích từ LSTM, Random Forest & News Sentiment.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-xl flex items-center justify-center p-0 transition-all duration-300",
            isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          )}
        >
          {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] items-center justify-center font-bold text-primary-foreground">1</span>
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  )
}
