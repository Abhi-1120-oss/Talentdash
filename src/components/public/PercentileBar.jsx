import React from 'react';

export default function PercentileBar({ p25, p50, p75, min = 0, max = 100 }) {
  const range = max - min;
  const toPercent = (val) => Math.max(0, Math.min(100, ((val - min) / range) * 100));

  const leftPct = toPercent(p25);
  const widthPct = toPercent(p75) - leftPct;
  const medianPct = toPercent(p50);

  return (
    <div className="space-y-1.5">
      <div className="relative h-3 bg-secondary rounded-full overflow-visible">
        {/* Range bar */}
        <div
          className="absolute top-0 h-full bg-primary/20 rounded-full"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        {/* Median marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-md z-10"
          style={{ left: `calc(${medianPct}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground font-medium">
        <span>P25: ₹{p25}L</span>
        <span className="text-primary font-semibold">P50: ₹{p50}L</span>
        <span>P75: ₹{p75}L</span>
      </div>
    </div>
  );
}
