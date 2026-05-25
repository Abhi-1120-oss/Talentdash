import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3.5 shadow-xl text-sm min-w-[140px]">
      <p className="font-semibold text-foreground mb-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-foreground">₹{p.value}L</span>
        </div>
      ))}
    </div>
  );
};

export default function SalaryTrendChart({ data, roles }) {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
  const GRADIENTS = ['indigo', 'emerald', 'amber', 'red'];

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        No trend data available for the selected filters.
      </div>
    );
  }

  const allRoles = roles || ['Median'];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
        <defs>
          {allRoles.map((role, i) => (
            <linearGradient key={role} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.15} />
              <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v) => `₹${v}L`}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
        />
        {allRoles.map((role, i) => (
          <Area
            key={role}
            type="monotone"
            dataKey={role}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2.5}
            fill={`url(#grad-${i})`}
            dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}