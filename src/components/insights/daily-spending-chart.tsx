'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '@/components/providers/currency-provider';
import { Transaction } from '@/lib/types/transaction';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface DailySpendingChartProps {
  transactions: Transaction[];
  currentDate: Date;
  viewType: 'expense' | 'income';
}

// Catmull-Rom to cubic bezier for smooth curves, clamped to never exceed maxY (baseline)
function smoothPath(points: { x: number; y: number }[], maxY: number, tension = 0.3): string {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = Math.min(p1.y + (p2.y - p0.y) * tension, maxY);
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = Math.min(p2.y - (p3.y - p1.y) * tension, maxY);

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

export function DailySpendingChart({ transactions, currentDate, viewType }: DailySpendingChartProps) {
  const { formatCurrency } = useCurrency();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isExpense = viewType === 'expense';
  const title = isExpense ? 'Daily Spending' : 'Daily Income';

  // CSS var name — matches calendar tab: expense = --expense-color, income = --teal
  const accentColorVar = isExpense ? '--expense-color' : '--teal';

  // Resolved hex (needed for SVG opacity suffixes like `${color}50`)
  const [accentColor, setAccentColor] = useState('');

  const readColor = useCallback(() => {
    const el = containerRef.current || document.documentElement;
    const style = getComputedStyle(el);
    setAccentColor(style.getPropertyValue(accentColorVar).trim());
  }, [accentColorVar]);

  useEffect(() => { readColor(); }, [readColor]);

  useEffect(() => {
    const observer = new MutationObserver(readColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [readColor]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Calculate month progress based on current day
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDayOfMonth = isCurrentMonth ? today.getDate() : daysInMonth;
  const monthProgress = (currentDayOfMonth / daysInMonth) * 100;

  // Aggregate daily totals
  const { dailyTotals, maxDaily, avgDaily, total, activeDays } = useMemo(() => {
    const totals = new Array(daysInMonth).fill(0);

    transactions.forEach((t) => {
      if (isExpense && t.amount >= 0) return;
      if (!isExpense && t.amount <= 0) return;
      const d = t.date.toDate();
      const day = d.getDate();
      if (day >= 1 && day <= daysInMonth) {
        totals[day - 1] += Math.abs(t.amount);
      }
    });

    const max = Math.max(...totals, 1);
    const totalVal = totals.reduce((s, v) => s + v, 0);
    const active = totals.filter((v) => v > 0).length;
    const avg = active > 0 ? totalVal / active : 0;

    return { dailyTotals: totals, maxDaily: max, avgDaily: avg, total: totalVal, activeDays: active };
  }, [transactions, daysInMonth, isExpense]);

  // Chart layout — smaller viewBox on mobile makes text proportionally bigger
  const viewBoxWidth = isMobile ? 480 : 900;
  const viewBoxHeight = isMobile ? 220 : 340;
  const padding = isMobile
    ? { top: 18, right: 12, bottom: 10, left: 40 }
    : { top: 28, right: 24, bottom: 16, left: 62 };
  const chartWidth = viewBoxWidth - padding.left - padding.right;
  const chartHeight = viewBoxHeight - padding.top - padding.bottom;
  const baseY = padding.top + chartHeight;

  // Responsive sizes for SVG elements
  const sizes = isMobile
    ? { yLabel: 11, lineStroke: 2.5, dotR: 3.5, dotRHover: 5, hoverDotR: 6, tooltipW: 100, tooltipH: 40, tooltipDateFs: 10, tooltipValFs: 12, tooltipRx: 6 }
    : { yLabel: 13, lineStroke: 3, dotR: 4, dotRHover: 6, hoverDotR: 7, tooltipW: 130, tooltipH: 48, tooltipDateFs: 12, tooltipValFs: 14, tooltipRx: 8 };

  // Y-axis scale
  const { gridLines, niceMax } = useMemo(() => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxDaily)));
    const nice = Math.ceil(maxDaily / magnitude) * magnitude;
    return { gridLines: [0, nice * 0.25, nice * 0.5, nice * 0.75, nice], niceMax: nice };
  }, [maxDaily]);

  // Compute line points for every day
  const points = useMemo(() => {
    const xStep = chartWidth / (daysInMonth - 1);
    return dailyTotals.map((val, i) => ({
      x: padding.left + i * xStep,
      y: baseY - (val / niceMax) * chartHeight,
    }));
  }, [dailyTotals, niceMax, chartWidth, chartHeight, daysInMonth, baseY]);

  const linePath = useMemo(() => smoothPath(points, baseY), [points, baseY]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
  }, [linePath, points, baseY]);

  // Average line Y
  const avgY = total > 0 ? baseY - (avgDaily / niceMax) * chartHeight : baseY;

  const formatCompact = (value: number): string => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * viewBoxWidth;
      const chartX = relX - padding.left;

      if (chartX < -10 || chartX > chartWidth + 10) {
        setHoveredDay(null);
        return;
      }

      const xStep = chartWidth / (daysInMonth - 1);
      const idx = Math.round(chartX / xStep);
      const clamped = Math.max(0, Math.min(daysInMonth - 1, idx));
      setHoveredDay(clamped);
    },
    [chartWidth, daysInMonth]
  );

  const handlePointerLeave = useCallback(() => {
    setHoveredDay(null);
  }, []);

  const hasData = total > 0;

  return (
    <div
      className="w-[calc(100%-2rem)] max-w-full sm:w-[480px] lg:w-[1188px] rounded-xl sm:rounded-2xl bg-[var(--surface)] p-3 sm:p-6 lg:p-8 relative overflow-hidden mt-0 md:mt-4"
      style={{
        border: `1px solid color-mix(in srgb, var(${accentColorVar}) 12%, transparent)`,
        boxShadow: `0 0 40px color-mix(in srgb, var(${accentColorVar}) 6%, transparent), inset 0 1px 0 color-mix(in srgb, var(${accentColorVar}) 6%, transparent)`,
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl pointer-events-none"
        style={{ background: `var(${accentColorVar})` }}
      />

      {/* Header */}
      <div className="flex items-center justify-center mb-1 sm:mb-3.5">
        <h3 className="text-sm sm:text-2xl font-semibold text-[var(--text-primary)]">{title}</h3>
        
      </div>

      {!hasData ? (
        <div className="h-[140px] sm:h-[180px] flex items-center justify-center">
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            No {isExpense ? 'expenses' : 'income'} this month
          </p>
        </div>
      ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full min-h-[160px] sm:min-h-0 sm:h-auto"
          preserveAspectRatio="xMidYMid meet"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{ touchAction: 'none' }}
        >
          <defs>
            <linearGradient id={`areaGrad-${viewType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis gridlines */}
          {gridLines.map((val, i) => {
            const y = baseY - (val / niceMax) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="var(--fill-subtle)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4.5}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize={sizes.yLabel}
                >
                  {formatCompact(val)}
                </text>
              </g>
            );
          })}

          {/* Average line */}
          <line
            x1={padding.left}
            y1={avgY}
            x2={padding.left + chartWidth}
            y2={avgY}
            stroke={accentColor + '50'}
            strokeWidth="1"
            strokeDasharray="5 3"
          />

          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill={`url(#areaGrad-${viewType})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />

          {/* Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth={sizes.lineStroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Data point dots — show on non-zero days */}
          {(() => {
            const now = new Date();
            const todayIndex = (now.getFullYear() === year && now.getMonth() === month)
              ? now.getDate() - 1
              : -1;

            return points.map((pt, i) => {
              const isHovered = hoveredDay === i;
              const isToday = i === todayIndex;
              if (dailyTotals[i] === 0 && !isToday) return null;
              return (
                <g key={i}>
                  {/* Today's pulsing ring */}
                  {isToday && (
                    <>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={sizes.dotRHover + 4}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="1.5"
                        opacity="0.3"
                      >
                        <animate attributeName="r" from={String(sizes.dotRHover + 2)} to={String(sizes.dotRHover + 8)} dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={sizes.dotRHover + 2}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="1"
                        opacity="0.5"
                      />
                    </>
                  )}
                  <motion.circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isToday ? sizes.dotRHover : isHovered ? sizes.dotRHover : sizes.dotR}
                    fill={isToday ? '#ffffff' : accentColor}
                    stroke={isToday ? accentColor : 'var(--surface)'}
                    strokeWidth={isToday ? 2.5 : 2}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, delay: 0.8 + i * 0.01 }}
                  />
                </g>
              );
            });
          })()}


          {/* Hover indicator */}
          {hoveredDay !== null && (() => {
            const pt = points[hoveredDay];
            const val = dailyTotals[hoveredDay];

            const tooltipWidth = sizes.tooltipW;
            const tooltipHeight = sizes.tooltipH;
            const tooltipX = Math.min(
              Math.max(pt.x - tooltipWidth / 2, 4),
              viewBoxWidth - tooltipWidth - 4
            );
            const tooltipY = Math.max(pt.y - tooltipHeight - 14, 2);

            return (
              <g>
                {/* Vertical line */}
                <line
                  x1={pt.x}
                  y1={padding.top}
                  x2={pt.x}
                  y2={baseY}
                  stroke="var(--text-faint)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Highlight dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={sizes.hoverDotR}
                  fill={accentColor}
                  stroke="var(--surface)"
                  strokeWidth="2.5"
                />

                {/* Tooltip */}
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx={sizes.tooltipRx}
                  fill="var(--surface-hover)"
                  stroke={`${accentColor}33`}
                  strokeWidth="1"
                />
                <text
                  x={tooltipX + tooltipWidth / 2}
                  y={tooltipY + tooltipHeight * 0.38}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  fontSize={sizes.tooltipDateFs}
                >
                  {currentDate.toLocaleString('default', { month: 'short' })} {hoveredDay + 1}
                </text>
                <text
                  x={tooltipX + tooltipWidth / 2}
                  y={tooltipY + tooltipHeight * 0.8}
                  textAnchor="middle"
                  fill={accentColor}
                  fontSize={sizes.tooltipValFs}
                  fontWeight="600"
                >
                  {val > 0 ? formatCurrency(val) : 'No activity'}
                </text>
              </g>
            );
          })()}
        </svg>
      )}

      {/* Summary footer */}
      {hasData && (
        <>
          {/* Desktop: single row */}
          <div className="hidden sm:flex items-center justify-between mt-4 pt-4 border-t border-[var(--fill-subtle)]">
            <span className="text-xs text-[var(--text-muted)]">
              {activeDays} active day{activeDays !== 1 ? 's' : ''}
              <span className="mx-1.5">|</span>
              Month Progress: <span style={{ color: `var(${accentColorVar})` }} className="font-medium">{monthProgress.toFixed(1)}%</span>
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Total: <span style={{ color: `var(${accentColorVar})` }} className="font-medium">{formatCurrency(total)}</span>
              <span className="mx-1.5">|</span>
              Peak: <span style={{ color: `var(${accentColorVar})` }} className="font-medium">{formatCurrency(maxDaily)}</span>
              <span className="mx-1.5">|</span>
              Average: <span style={{ color: `var(${accentColorVar})` }} className="font-medium">{formatCurrency(avgDaily)}</span>
            </span>
          </div>

          {/* Mobile: compact two rows centered */}
          <div className="sm:hidden mt-2 pt-1.5 border-t border-[var(--fill-subtle)] flex flex-col items-center gap-1">
            <span className="text-[9px] text-[var(--text-muted)]">
              Total: <span style={{ color: `var(${accentColorVar})` }} className="font-medium">{formatCurrency(total, { compact: true })}</span>
              <span className="mx-1 text-[var(--text-faint)]">|</span>
              Peak: <span style={{ color: `var(${accentColorVar})` }} className="font-medium">{formatCurrency(maxDaily, { compact: true })}</span>
              <span className="mx-1 text-[var(--text-faint)]">|</span>
              Avg: <span style={{ color: `var(${accentColorVar})` }} className="font-medium">{formatCurrency(avgDaily, { compact: true })}</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)]">
              {activeDays} active day{activeDays !== 1 ? 's' : ''}
              <span className="mx-1">|</span>
              Month Progress: <span style={{ color: `var(${accentColorVar})` }} className="font-medium">{monthProgress.toFixed(1)}%</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
