/**
 * Dịch vụ giao dịch — logic nghiệp vụ cho nhật ký giao dịch.
 */

import { TradeLog } from './trade.repository.js';

export const tradeService = {
  async getAll() {
    return await TradeLog.find().sort({ entry_date: -1 });
  },

  async create(data) {
    const trade = new TradeLog(data);
    return await trade.save();
  },

  async update(id, data) {
    const trade = await TradeLog.findById(id);
    if (!trade) throw new Error('Trade record not found');

    // Nếu đóng lệnh, tính toán PnL
    if (data.status === 'CLOSED' && trade.status === 'OPEN') {
      const exitPrice = data.exit_price || trade.exit_price;
      const entryPrice = trade.entry_price;
      
      if (exitPrice && entryPrice) {
        data.actual_return = (exitPrice - entryPrice) / entryPrice;
        data.pnl = (exitPrice - entryPrice) * (data.quantity || trade.quantity || 100);
      }
    }

    Object.assign(trade, data);
    return await trade.save();
  },

  async delete(id) {
    return await TradeLog.findByIdAndDelete(id);
  },

  async getStats() {
    const closedTrades = await TradeLog.find({ status: 'CLOSED' }).sort({ updatedAt: 1 });
    const allTrades = await TradeLog.find().countDocuments();
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: allTrades,
        winRate: 0,
        profitFactor: 0,
        totalPnL: 0,
        avgProfit: 0,
        equityCurve: [],
        distribution: []
      };
    }

    let totalPnL = 0;
    let winningTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    const equityCurve = [];
    
    closedTrades.forEach(trade => {
      const pnl = trade.pnl || 0;
      totalPnL += pnl;
      
      if (pnl > 0) {
        winningTrades++;
        grossProfit += pnl;
      } else {
        grossLoss += Math.abs(pnl);
      }
      
      equityCurve.push({
        date: trade.updatedAt.toISOString().split('T')[0],
        value: totalPnL
      });
    });

    const winRate = (winningTrades / closedTrades.length) * 100;
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 99 : 0) : grossProfit / grossLoss;
    const avgProfit = totalPnL / closedTrades.length;

    // Distribution (buckets)
    const returns = closedTrades.map(t => t.actual_return * 100);
    const distribution = [
      { name: "<-5%", value: returns.filter(r => r < -5).length },
      { name: "-5% to 0%", value: returns.filter(r => r >= -5 && r < 0).length },
      { name: "0% to 5%", value: returns.filter(r => r >= 0 && r < 5).length },
      { name: ">5%", value: returns.filter(r => r >= 5).length },
    ];

    return {
      totalTrades: allTrades,
      closedTrades: closedTrades.length,
      winRate: Math.round(winRate),
      profitFactor: Number(profitFactor.toFixed(2)),
      totalPnL: Math.round(totalPnL),
      avgProfit: Math.round(avgProfit),
      equityCurve,
      distribution
    };
  }
};

