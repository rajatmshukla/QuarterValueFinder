
import React, { useState, useRef, useMemo } from 'react';
import type { HistoricalValue } from '../types';

interface PriceChartProps {
  data: HistoricalValue[];
}

const PADDING = { top: 20, right: 30, bottom: 40, left: 50 };
const SVG_WIDTH = 500;
const SVG_HEIGHT = 250;

export const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; value: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const sortedData = useMemo(() =>
    [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [data]
  );
  
  const { min, max } = useMemo(() => {
    const values = sortedData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal;
    // Add some padding to the y-axis
    return {
      min: Math.max(0, minVal - range * 0.1),
      max: maxVal + range * 0.1
    };
  }, [sortedData]);

  const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;

  const getX = (index: number) => PADDING.left + (index / (sortedData.length - 1)) * chartWidth;
  const getY = (value: number) => PADDING.top + chartHeight - ((value - min) / (max - min)) * chartHeight;

  const linePath = useMemo(() => {
    if (sortedData.length < 2) return '';
    return sortedData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`)
      .join(' ');
  }, [sortedData, min, max]);

  const areaPath = useMemo(() => {
    if (sortedData.length < 2) return '';
    const path = linePath;
    return `${path} V ${PADDING.top + chartHeight} H ${PADDING.left} Z`;
  }, [linePath]);

  const yAxisLabels = useMemo(() => {
    const numLabels = 5;
    const labels = [];
    const step = (max - min) / (numLabels - 1);
    for (let i = 0; i < numLabels; i++) {
        const value = min + (step * i);
        labels.push({ value, y: getY(value) });
    }
    return labels;
  }, [min, max]);

  const xAxisLabels = useMemo(() => {
    if (sortedData.length < 2) return [];
    const labels = [sortedData[0], sortedData[Math.floor(sortedData.length / 2)], sortedData[sortedData.length - 1]];
    return labels.map((d) => {
        const index = sortedData.findIndex(item => item.date === d.date);
        return { value: d.date, x: getX(index) }
    });
  }, [sortedData]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;

    const index = Math.round(((mouseX - PADDING.left) / chartWidth) * (sortedData.length - 1));

    if (index >= 0 && index < sortedData.length) {
      const point = sortedData[index];
      setTooltip({
        x: getX(index),
        y: getY(point.value),
        date: point.date,
        value: point.value,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  if (sortedData.length < 2) {
    return <div className="text-center text-slate-400 p-4">Not enough historical data to display a trend.</div>;
  }
  
  return (
    <div className="relative w-full overflow-hidden animate-fade-in-down mt-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Y-axis grid lines and labels */}
        {yAxisLabels.map(({ value, y }) => (
          <g key={value} className="text-xs text-slate-500">
            <line
              x1={PADDING.left} y1={y}
              x2={SVG_WIDTH - PADDING.right} y2={y}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <text x={PADDING.left - 8} y={y + 4} textAnchor="end" fill="currentColor">
              ${value.toFixed(2)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xAxisLabels.map(({ value, x }) => (
          <g key={value} className="text-xs text-slate-500">
             <text x={x} y={SVG_HEIGHT - PADDING.bottom + 16} textAnchor="middle" fill="currentColor">
               {new Date(value + '-02').toLocaleString('default', { month: 'short', year: '2-digit' })}
            </text>
          </g>
        ))}

        {/* Gradient for area chart */}
        <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
        </defs>

        {/* Area path */}
        <path d={areaPath} fill="url(#areaGradient)" stroke="none" />
        
        {/* Line path */}
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Tooltip */}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={PADDING.top} x2={tooltip.x} y2={PADDING.top + chartHeight} stroke="#a78bfa" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
            <rect x={tooltip.x < SVG_WIDTH / 2 ? tooltip.x + 8 : tooltip.x - 98} y={tooltip.y - 20} width="90" height="36" rx="4" fill="rgba(17, 24, 39, 0.8)" stroke="#4b5563" strokeWidth="1" />
            <text x={tooltip.x < SVG_WIDTH / 2 ? tooltip.x + 14 : tooltip.x - 92} y={tooltip.y - 4} fill="#e5e7eb" className="text-xs font-semibold">
              {new Date(tooltip.date + '-02').toLocaleString('default', { month: 'short', year: 'numeric' })}
            </text>
            <text x={tooltip.x < SVG_WIDTH / 2 ? tooltip.x + 14 : tooltip.x - 92} y={tooltip.y + 10} fill="#c7d2fe" className="text-xs font-bold">
              ${tooltip.value.toFixed(2)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};