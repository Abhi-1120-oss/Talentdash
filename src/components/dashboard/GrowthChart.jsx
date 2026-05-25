import React from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3.5 shadow-xl text-sm min-w-[160px]">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
            {p.name}
          </span>
          <span className="font-bold text-foreground">₹{p.value}L</span>
        </div>
      ))}
    </div>
  );
};

export default function GrowthChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        Add career entries to see your compensation growth chart.
      </div>
    );
  }

  const hasMarket = data.some(d => d.market != null);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="myGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="marketGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={v => `₹${v}L`}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />

        {/* My total comp bar */}
        <Bar dataKey="total" name="My Total Comp" fill="#6366f1" opacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={700} />

        {/* My base area */}
        <Area dataKey="base" name="My Base" type="monotone" stroke="#6366f1" strokeWidth={2.5} fill="url(#myGrad)"
          dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
          animationDuration={800}
        />

        {/* Market median line */}
        {hasMarket && (
          <Line dataKey="market" name="Market P50" type="monotone" stroke="#10b981" strokeWidth={2} strokeDasharray="6 3"
            dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 5 }}
            animationDuration={900}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}