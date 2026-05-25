import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BUCKETS = [
  { label: '0–20%', range: [0, 0.2], color: '#ef4444' },
  { label: '20–40%', range: [0.2, 0.4], color: '#f97316' },
  { label: '40–60%', range: [0.4, 0.6], color: '#f59e0b' },
  { label: '60–80%', range: [0.6, 0.8], color: '#84cc16' },
  { label: '80–100%', range: [0.8, 1.01], color: '#10b981' },
];

export default function ConfidenceHistogram({ records }) {
  const data = BUCKETS.map(({ label, range, color }) => ({
    label,
    count: records.filter(r => r.confidence_score >= range[0] && r.confidence_score < range[1]).length,
    color,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
        <Tooltip
          contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}