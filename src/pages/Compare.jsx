import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PublicNavbar from '@/components/public/PublicNavbar';
import ConfidenceBadge from '@/components/public/ConfidenceBadge';
import { Plus, X, TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const COMP_FIELDS = [
  { key: 'base_salary', label: 'Base Salary (LPA)' },
  { key: 'bonus', label: 'Annual Bonus (LPA)' },
  { key: 'stock', label: 'Stock / ESOP (LPA)' },
  { key: 'total_compensation', label: 'Total Comp (LPA)' },
];

const SLOT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

function Delta({ a, b }) {
  if (a == null || b == null) return <span className="text-muted-foreground">—</span>;
  const diff = a - b;
  const pct = b !== 0 ? Math.round((diff / b) * 100) : 0;
  if (diff > 0) return (
    <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 text-xs">
      <TrendingUp className="w-3 h-3" />+{pct}%
    </span>
  );
  if (diff < 0) return (
    <span className="inline-flex items-center gap-0.5 text-red-500 font-semibold bg-red-50 border border-red-100 rounded px-1.5 py-0.5 text-xs">
      <TrendingDown className="w-3 h-3" />{pct}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground bg-secondary rounded px-1.5 py-0.5 text-xs">
      <Minus className="w-3 h-3" />0%
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            {p.name}
          </span>
          <span className="font-bold text-foreground">₹{p.value}L</span>
        </div>
      ))}
    </div>
  );
};

export default function Compare() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([null, null]);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    base44.entities.SalaryRecord.filter({ review_status: 'approved' }, '-confidence_score', 300)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, []);

  const options = records.map(r => ({
    id: r.id,
    label: `${r.company} — ${r.role}${r.level_standardized ? ` (${r.level_standardized})` : ''}`,
  }));

  const setSlot = (i, id) => {
    const updated = [...slots];
    updated[i] = records.find(r => r.id === id) || null;
    setSlots(updated);
  };

  const addSlot = () => { if (slots.length < 4) setSlots([...slots, null]); };
  const removeSlot = (i) => setSlots(slots.filter((_, idx) => idx !== i));

  const filled = slots.filter(Boolean);

  // Build bar chart data
  const barData = COMP_FIELDS.map(({ key, label }) => {
    const entry = { label };
    slots.forEach((slot, i) => {
      if (slot) entry[slot.company || `Role ${i + 1}`] = slot[key] || 0;
    });
    return entry;
  });

  const barKeys = slots.filter(Boolean).map(s => s.company || '?');

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">Role Comparison</h1>
          <p className="text-sm text-muted-foreground">Compare compensation packages side-by-side across roles and companies</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Slot selectors */}
            <div className="flex flex-wrap gap-3 mb-8 items-center">
              {slots.map((slot, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: SLOT_COLORS[i] }}
                    />
                    <Select value={slot?.id || ''} onValueChange={(v) => setSlot(i, v)}>
                      <SelectTrigger className="w-72 bg-card border-border hover:border-primary/40 transition-colors">
                        <SelectValue placeholder={`Select role ${i + 1}…`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {slots.length > 2 && (
                    <Button size="sm" variant="ghost" onClick={() => removeSlot(i)} className="w-8 h-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </motion.div>
              ))}
              {slots.length < 4 && (
                <Button variant="outline" size="sm" onClick={addSlot} className="gap-1.5 h-10 hover:border-primary/40 hover:text-primary transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add role
                </Button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {filled.length >= 2 ? (
                <motion.div
                  key="comparison"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  {/* Bar chart visualization */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart2 className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Compensation Breakdown</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${v}L`} axisLine={false} tickLine={false} width={48} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.5 }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                        {barKeys.map((key, i) => (
                          <Bar key={key} dataKey={key} fill={SLOT_COLORS[i]} radius={[4, 4, 0, 0]} maxBarSize={48} animationDuration={700} animationEasing="ease-out" />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left px-5 py-4 text-muted-foreground font-medium w-44 text-xs uppercase tracking-wider">Field</th>
                          {slots.map((slot, i) => (
                            <th key={i} className="text-center px-5 py-4 font-semibold text-foreground">
                              {slot ? (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SLOT_COLORS[i] }} />
                                    <span>{slot.company}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground font-normal">{slot.role}</div>
                                  {slot.level_standardized && (
                                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold border border-primary/15">
                                      {slot.level_standardized}
                                    </span>
                                  )}
                                </div>
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </th>
                          ))}
                          {filled.length >= 2 && (
                            <th className="px-5 py-4 text-center text-muted-foreground font-medium text-xs uppercase tracking-wider">Δ 1 vs 2</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {COMP_FIELDS.map(({ key, label }, ri) => (
                          <tr
                            key={key}
                            className={`border-b border-border transition-colors duration-100 ${hoveredRow === key ? 'bg-primary/5' : ri % 2 === 1 ? 'bg-secondary/10' : ''}`}
                            onMouseEnter={() => setHoveredRow(key)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            <td className="px-5 py-3.5 font-medium text-muted-foreground text-sm">{label}</td>
                            {slots.map((slot, i) => (
                              <td key={i} className="px-5 py-3.5 text-center font-bold text-foreground text-base">
                                {slot?.[key] != null ? `₹${slot[key]}L` : <span className="text-muted-foreground font-normal text-sm">—</span>}
                              </td>
                            ))}
                            {filled.length >= 2 && (
                              <td className="px-5 py-3.5 text-center">
                                <Delta a={slots[0]?.[key]} b={slots[1]?.[key]} />
                              </td>
                            )}
                          </tr>
                        ))}
                        {/* Confidence */}
                        <tr
                          className={`border-b border-border transition-colors ${hoveredRow === 'conf' ? 'bg-primary/5' : ''}`}
                          onMouseEnter={() => setHoveredRow('conf')}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td className="px-5 py-3.5 font-medium text-muted-foreground text-sm">Confidence</td>
                          {slots.map((slot, i) => (
                            <td key={i} className="px-5 py-3.5 text-center">
                              {slot ? <ConfidenceBadge score={slot.confidence_score} /> : <span className="text-muted-foreground">—</span>}
                            </td>
                          ))}
                          {filled.length >= 2 && <td />}
                        </tr>
                        {/* Source */}
                        <tr
                          className={`transition-colors ${hoveredRow === 'src' ? 'bg-primary/5' : ''}`}
                          onMouseEnter={() => setHoveredRow('src')}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td className="px-5 py-3.5 font-medium text-muted-foreground text-sm">Source</td>
                          {slots.map((slot, i) => (
                            <td key={i} className="px-5 py-3.5 text-center text-muted-foreground text-xs">
                              {slot?.source_platform || '—'}
                            </td>
                          ))}
                          {filled.length >= 2 && <td />}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-64 text-center gap-3"
                >
                  <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center">
                    <BarChart2 className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">Select roles to compare</p>
                  <p className="text-sm text-muted-foreground max-w-xs">Choose at least two roles from the dropdowns above to see a side-by-side compensation breakdown.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}