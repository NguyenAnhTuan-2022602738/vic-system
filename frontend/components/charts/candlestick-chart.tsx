'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, IChartApi, CandlestickData, Time } from 'lightweight-charts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CandlestickChartProps {
  className?: string;
  liveData?: {
    price: number;
    open: number;
    high: number;
    low: number;
    symbol: string;
  } | null;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ className, liveData }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Khởi tạo biểu đồ vào container (luôn hiện, dù loading)
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 350,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Lấy dữ liệu lịch sử
    const fetchHistory = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3005';
        const response = await fetch(`${API_URL}/api/v1/market/history?startDate=2024-06-01`);
        const json = await response.json();
        const items = Array.isArray(json) ? json : (json.data || []);

        if (items.length === 0) {
          setLoading(false);
          return;
        }

        const formattedData: CandlestickData[] = items
          .filter((item: any) => item.date && item.open != null)
          .map((item: any) => ({
            time: item.date as Time,
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
          }));

        series.setData(formattedData);
        chart.timeScale().fitContent();
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải lịch sử nến:', error);
        setLoading(false);
      }
    };

    fetchHistory();

    // Responsive
    const ro = new ResizeObserver(() => {
      if (container) {
        chart.applyOptions({ width: container.clientWidth });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  // Cập nhật nến Real-time từ Props
  useEffect(() => {
    if (seriesRef.current && liveData && liveData.symbol === 'VIC') {
      const today = new Date().toISOString().split('T')[0];
      seriesRef.current.update({
        time: today as Time,
        open: Number(liveData.open),
        high: Number(liveData.high),
        low: Number(liveData.low),
        close: Number(liveData.price),
      });
    }
  }, [liveData]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Biểu đồ nến VIC (Real-time)</CardTitle>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          Live
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div ref={chartContainerRef} className="h-[350px] w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80">
            <div className="text-muted-foreground text-sm">Đang tải biểu đồ...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
