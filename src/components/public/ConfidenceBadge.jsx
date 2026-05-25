import React from 'react';

export default function ConfidenceBadge({ score }) {
  if (score === null || score === undefined) return null;

  const pct = Math.round(score * 100);
  const label = pct >= 80 ? 'High' : pct >= 50 ? 'Med' : 'Low';
  const colors = pct >= 80
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : pct >= 50
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-700 border-red-200';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colors}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
      {label} {pct}%
    </span>
  );
}