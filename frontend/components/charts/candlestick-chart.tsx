'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, IChartApi, CandlestickData, Time } from 'lightweight-charts';
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
  const ma20SeriesRef = useRef<any>(null);
  const rsiSeriesRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Khởi tạo biểu đồ vào container (luôn hiện, dù loading)
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 450, // Tăng height cho RSI pane
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
        scaleMargins: {
          top: 0.05,
          bottom: 0.25, // Dành 25% phía dưới cho RSI
        },
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

    // Cấu hình đường MA20
    const ma20Series = chart.addSeries(LineSeries, {
      color: 'rgba(245, 158, 11, 0.8)', // amber-500
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
    });

    const rsiSeries = chart.addSeries(LineSeries, {
      color: 'rgba(168, 85, 247, 0.8)', // purple-500
      lineWidth: 2,
      priceScaleId: 'rsi',
      crosshairMarkerVisible: false,
      priceLineVisible: false,
    });

    // Cấu hình pane RSI (nằm dưới cùng) SAU KHI đã gắn priceScaleId cho series
    chart.priceScale('rsi').applyOptions({
      scaleMargins: {
        top: 0.8, // Bắt đầu từ 80% chiều cao biểu đồ
        bottom: 0,
      },
      borderColor: 'rgba(255, 255, 255, 0.1)',
    });

    // Vẽ vạch 30 và 70 cho RSI
    rsiSeries.createPriceLine({
      price: 70,
      color: 'rgba(239, 68, 68, 0.5)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'Quá mua (70)',
    });
    rsiSeries.createPriceLine({
      price: 30,
      color: 'rgba(34, 197, 94, 0.5)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'Quá bán (30)',
    });

    chartRef.current = chart;
    seriesRef.current = series;
    ma20SeriesRef.current = ma20Series;
    rsiSeriesRef.current = rsiSeries;

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

        const ma20Data = items
          .filter((item: any) => item.date && item.ma20 != null && item.ma20 > 0)
          .map((item: any) => ({
            time: item.date as Time,
            value: Number(item.ma20),
          }));

        const rsiData = items
          .filter((item: any) => item.date && item.rsi != null && item.rsi > 0)
          .map((item: any) => ({
            time: item.date as Time,
            value: Number(item.rsi),
          }));

        series.setData(formattedData);
        ma20Series.setData(ma20Data);
        rsiSeries.setData(rsiData);
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
        <div ref={chartContainerRef} className="h-[450px] w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80">
            <div className="text-muted-foreground text-sm">Đang tải biểu đồ...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
