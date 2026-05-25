import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function KpiCard({ title, value, delta, deltaLabel, icon: Icon, color = 'indigo', loading }) {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  };

  const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-white/50 font-medium">{title}</p>
        {Icon && (
          <div className={cn('p-2 rounded-lg border', colorMap[color])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
      ) : (
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      )}
      {delta !== undefined && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium',
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-white/30'
        )}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {delta > 0 ? '+' : ''}{delta} {deltaLabel || 'vs yesterday'}
        </div>
      )}
    </div>
  );
}