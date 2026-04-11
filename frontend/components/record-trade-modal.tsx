"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TradingSignal, createTrade } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

interface RecordTradeModalProps {
  isOpen: boolean
  onClose: () => void
  signal?: TradingSignal
  currentPrice: number
  onSuccess?: () => void
}

export function RecordTradeModal({ isOpen, onClose, signal, currentPrice, onSuccess }: RecordTradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    symbol: "VIC",
    action: signal?.action || "BUY",
    entry_price: currentPrice,
    stop_loss: signal?.stop_loss || 0,
    take_profit: signal?.take_profit || 0,
    quantity: 100,
    notes: "",
    horizon: 3,
    predicted_mu: signal?.expected_return || 0,
    predicted_sigma: signal?.uncertainty || 0.03,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createTrade({
        ...formData,
        status: "OPEN"
      })
      toast.success("Trade recorded successfully!")
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error("Failed to record trade:", error)
      toast.error("Failed to record trade. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Record Manual Trade
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Log your execution details based on the AI advice.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select 
                value={formData.action} 
                onValueChange={(v) => setFormData({...formData, action: v as any})}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="BUY">BUY</SelectItem>
                  <SelectItem value="SELL">SELL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                value={formData.quantity} 
                onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_price">Entry Price (VND)</Label>
              <Input 
                id="entry_price" 
                type="number" 
                value={formData.entry_price} 
                onChange={(e) => setFormData({...formData, entry_price: Number(e.target.value)})}
                className="bg-slate-800 border-slate-700 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stop_loss" className="text-rose-400">Stop Loss</Label>
              <Input 
                id="stop_loss" 
                type="number" 
                value={formData.stop_loss} 
                onChange={(e) => setFormData({...formData, stop_loss: Number(e.target.value)})}
                className="bg-slate-800 border-slate-700 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="take_profit" className="text-emerald-400">Take Profit</Label>
              <Input 
                id="take_profit" 
                type="number" 
                value={formData.take_profit} 
                onChange={(e) => setFormData({...formData, take_profit: Number(e.target.value)})}
                className="bg-slate-800 border-slate-700 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              placeholder="Why are you taking this trade?" 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="bg-slate-800 border-slate-700 min-h-[80px]"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save to Journal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
