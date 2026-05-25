import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import PublicNavbar from '@/components/public/PublicNavbar';
import ExplorerFilters from '@/components/public/ExplorerFilters';
import SalaryCard from '@/components/public/SalaryCard';
import SalaryTrendChart from '@/components/public/SalaryTrendChart';
import { Loader2, TrendingUp, AlertCircle, ChevronDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_FILTERS = {
  location: 'All Locations',
  experience: 'all',
  level: 'All Levels',
  source: 'All Sources',
};

const PAGE_SIZE = 12;

function buildTrendData(records) {
  // Group by month and compute median salary
  const monthly = {};
  records.forEach(r => {
    if (!r.scraped_at || !r.base_salary) return;
    const month = r.scraped_at.slice(0, 7);
    if (!monthly[month]) monthly[month] = [];
    monthly[month].push(r.base_salary);
  });
  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([period, values]) => {
      const sorted = values.slice().sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)] || 0;
      return { period, Median: Math.round(med) };
    });
}

export default function Explorer() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showTrend, setShowTrend] = useState(false);

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const company = params.get('company');
    if (company) setSearchQuery(company);
  }, []);

  useEffect(() => {
    setLoading(true);
    base44.entities.SalaryRecord.filter({ review_status: 'approved', is_rejected: false }, '-confidence_score', 500)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || r.company?.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q) || r.level_standardized?.toLowerCase().includes(q);
      const matchLocation = filters.location === 'All Locations' || r.location === filters.location;
      const matchLevel = filters.level === 'All Levels' || r.level_standardized === filters.level;
      const matchSource = filters.source === 'All Sources' || r.source_platform === filters.source;
      let matchExp = true;
      if (filters.experience !== 'all') {
        const [min, max] = filters.experience.split('-').map(Number);
        matchExp = (r.experience_years_min ?? 0) >= min && (r.experience_years_max ?? 99) <= max;
      }
      return matchSearch && matchLocation && matchLevel && matchSource && matchExp;
    });
  }, [records, filters, searchQuery]);

  const trendData = useMemo(() => buildTrendData(filtered), [filtered]);
  const paginated = filtered.slice(0, page * PAGE_SIZE);

  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const salaries = filtered.map(r => r.base_salary).filter(Boolean).sort((a, b) => a - b);
    if (!salaries.length) return null;
    const p25 = salaries[Math.floor(salaries.length * 0.25)] || 0;
    const p50 = salaries[Math.floor(salaries.length * 0.5)] || 0;
    const p75 = salaries[Math.floor(salaries.length * 0.75)] || 0;
    const avg = Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length);
    return { p25, p50, p75, avg, count: filtered.length };
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-foreground mb-1">Salary Explorer</h1>
          <p className="text-muted-foreground text-sm">Browse verified compensation data across India's tech industry</p>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-card border border-border rounded-xl p-4">
          <ExplorerFilters
            filters={filters}
            onChange={(f) => { setFilters(f); setPage(1); }}
            searchQuery={searchQuery}
            onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
          />
        </div>

        {/* Stats Banner */}
        <AnimatePresence mode="wait">
          {stats && !loading && (
            <motion.div
              key={`${stats.count}-${stats.p50}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3"
            >
              {[
                { label: 'Results', value: stats.count, highlight: false },
                { label: 'P25 Base', value: `₹${stats.p25}L`, highlight: false },
                { label: 'P50 Median', value: `₹${stats.p50}L`, highlight: true },
                { label: 'P75 Base', value: `₹${stats.p75}L`, highlight: false },
                { label: 'Avg Base', value: `₹${stats.avg}L`, highlight: false },
              ].map(({ label, value, highlight }) => (
                <div key={label} className={`rounded-lg px-4 py-3 text-center border transition-colors ${highlight ? 'bg-primary/8 border-primary/25' : 'bg-card border-border'}`}>
                  <p className={`text-xs mb-0.5 ${highlight ? 'text-primary/70 font-semibold' : 'text-muted-foreground'}`}>{label}</p>
                  <p className={`font-bold text-base ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trend Chart Toggle */}
        {filtered.length > 0 && (
          <div className="mb-6 bg-card border border-border rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/20 transition-colors group"
              onClick={() => setShowTrend(v => !v)}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BarChart3 className="w-4 h-4 text-primary" />
                Salary Trend
                <span className="text-xs text-muted-foreground font-normal">— median base salary over time</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showTrend ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {showTrend && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-2">
                    <SalaryTrendChart data={trendData} roles={['Median']} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground mb-1">No records found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {paginated.map((r, i) => <SalaryCard key={r.id} record={r} index={i} />)}
            </div>
            {filtered.length > paginated.length && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setPage(p => p + 1)} className="gap-2">
                  Load more <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}