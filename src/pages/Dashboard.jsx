import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import PublicNavbar from '@/components/public/PublicNavbar';
import CareerEntryForm from '@/components/dashboard/CareerEntryForm';
import CareerTimeline from '@/components/dashboard/CareerTimeline';
import GrowthChart from '@/components/dashboard/GrowthChart';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Award, BarChart2, ArrowUpRight, Target, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, differenceInMonths } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className={`p-2 rounded-lg border ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value ?? '—'}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [marketRecords, setMarketRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.CareerEntry.list('start_date', 50),
      base44.entities.SalaryRecord.filter({ review_status: 'approved' }, '-confidence_score', 200),
    ]).then(([u, e, m]) => {
      setUser(u);
      // Only show current user's entries
      setEntries(e.filter(x => !u || x.created_by === u.email));
      setMarketRecords(m);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.CareerEntry.update(editing.id, data);
      setEntries(prev => prev.map(e => e.id === editing.id ? { ...e, ...data } : e).sort((a, b) => a.start_date.localeCompare(b.start_date)));
      toast.success('Entry updated');
    } else {
      const created = await base44.entities.CareerEntry.create(data);
      setEntries(prev => [...prev, created].sort((a, b) => a.start_date.localeCompare(b.start_date)));
      toast.success('Entry added');
    }
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.CareerEntry.delete(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('Entry removed');
  };

  const handleEdit = (entry) => {
    setEditing(entry);
    setFormOpen(true);
  };

  // Sorted entries (oldest first for chart)
  const sorted = useMemo(() => [...entries].sort((a, b) => a.start_date.localeCompare(b.start_date)), [entries]);

  // Current role
  const current = entries.find(e => e.is_current) || entries[entries.length - 1];

  // Stats
  const stats = useMemo(() => {
    if (!sorted.length) return null;
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const growthPct = first.base_salary > 0
      ? Math.round(((last.base_salary - first.base_salary) / first.base_salary) * 100)
      : 0;
    const monthsExp = sorted.reduce((acc, e) => {
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : new Date();
      return acc + Math.max(0, differenceInMonths(end, start));
    }, 0);
    const yrsExp = Math.floor(monthsExp / 12);
    const mthsRem = monthsExp % 12;

    // Market P50 for current role family
    const family = current?.role_family || 'Engineering';
    const relevant = marketRecords.filter(r => r.role_family === family && r.base_salary);
    const marketSalaries = relevant.map(r => r.base_salary).sort((a, b) => a - b);
    const marketP50 = marketSalaries.length
      ? marketSalaries[Math.floor(marketSalaries.length * 0.5)]
      : null;
    const vsMarket = marketP50 && current
      ? Math.round(((current.base_salary - marketP50) / marketP50) * 100)
      : null;

    return { growthPct, yrsExp, mthsRem, marketP50, vsMarket, totalRoles: sorted.length };
  }, [sorted, current, marketRecords]);

  // Chart data — one point per entry, plus market P50 overlay
  const chartData = useMemo(() => {
    return sorted.map(e => {
      const family = e.role_family || 'Engineering';
      const relevant = marketRecords.filter(r => r.role_family === family && r.base_salary);
      const sals = relevant.map(r => r.base_salary).sort((a, b) => a - b);
      const p50 = sals.length ? sals[Math.floor(sals.length * 0.5)] : null;
      let label;
      try {
        label = format(new Date(e.start_date), 'MMM yy');
      } catch { label = e.start_date; }
      return {
        label,
        company: e.company,
        base: e.base_salary,
        total: e.total_compensation || e.base_salary,
        market: p50,
      };
    });
  }, [sorted, marketRecords]);

  // Reverse for timeline display (newest first)
  const timelineEntries = useMemo(() => [...entries].sort((a, b) => b.start_date.localeCompare(a.start_date)), [entries]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground">
              {user ? `${user.full_name?.split(' ')[0]}'s Career Dashboard` : 'Career Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your compensation growth and benchmark against the market
            </p>
          </motion.div>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-7 h-7 border-4 border-secondary border-t-primary rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
              <Briefcase className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Start tracking your career</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
              Add your salary history to see how your compensation has grown and how it stacks up against market data.
            </p>
            <Button onClick={() => setFormOpen(true)} className="bg-primary gap-2">
              <Plus className="w-4 h-4" /> Add your first entry
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={TrendingUp} label="Salary Growth" color="indigo"
                value={stats?.growthPct != null ? `${stats.growthPct > 0 ? '+' : ''}${stats.growthPct}%` : '—'}
                sub="From first to latest role"
              />
              <StatCard icon={Briefcase} label="Total Experience" color="emerald"
                value={stats ? `${stats.yrsExp}y ${stats.mthsRem}m` : '—'}
                sub={`${stats?.totalRoles} role${stats?.totalRoles !== 1 ? 's' : ''} logged`}
              />
              <StatCard icon={Award} label="Current Base" color="amber"
                value={current ? `₹${current.base_salary}L` : '—'}
                sub={current ? `${current.company} · ${current.role}` : undefined}
              />
              <StatCard icon={Target} label="vs Market P50" color="purple"
                value={stats?.vsMarket != null
                  ? `${stats.vsMarket > 0 ? '+' : ''}${stats.vsMarket}%`
                  : '—'}
                sub={stats?.marketP50 ? `Market median: ₹${stats.marketP50}L` : 'Not enough market data'}
              />
            </div>

            {/* Growth Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground">Compensation Progression</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-5">
                Your salary history vs market P50 benchmark (dashed line)
              </p>
              <GrowthChart data={chartData} />
            </motion.div>

            {/* Market comparison callout */}
            {stats?.vsMarket != null && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-medium ${
                  stats.vsMarket >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <ArrowUpRight className={`w-5 h-5 flex-shrink-0 ${stats.vsMarket >= 0 ? 'text-emerald-600' : 'text-amber-600 rotate-45'}`} />
                <span>
                  {stats.vsMarket >= 0
                    ? `Your current base is ${stats.vsMarket}% above the market median for ${current?.role_family || 'your role family'} in India. Strong positioning!`
                    : `Your current base is ${Math.abs(stats.vsMarket)}% below the market median. Consider benchmarking your next negotiation.`}
                </span>
              </motion.div>
            )}

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-foreground">Career Timeline</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{entries.length} role{entries.length !== 1 ? 's' : ''} logged</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              <CareerTimeline entries={timelineEntries} onEdit={handleEdit} onDelete={handleDelete} />
            </motion.div>
          </div>
        )}
      </div>

      <CareerEntryForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing ? { ...editing } : undefined}
      />
    </div>
  );
}