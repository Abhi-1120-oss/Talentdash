import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ReviewRecordPanel from '@/components/admin/ReviewRecordPanel';
import ConfidenceBadge from '@/components/public/ConfidenceBadge';
import { Loader2, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReviewQueue() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all'); // all, low, med

  const load = () => {
    setLoading(true);
    base44.entities.SalaryRecord.filter({ review_status: 'pending', is_rejected: false }, '-created_date', 100)
      .then(r => { setRecords(r); if (r.length > 0) setSelected(r[0]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter(r => {
    if (filter === 'low') return (r.confidence_score || 0) < 0.5;
    if (filter === 'med') return (r.confidence_score || 0) >= 0.5 && r.confidence_score < 0.8;
    return true;
  });

  const handleAction = (action, id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    const remaining = filtered.filter(r => r.id !== id);
    setSelected(remaining[0] || null);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left pane — list */}
      <div className="w-72 bg-[#0B1120] border-r border-white/5 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Review Queue
              <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
                {filtered.length}
              </span>
            </h2>
            <Button size="sm" variant="ghost" onClick={load} className="w-7 h-7 p-0 text-white/30 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All pending</SelectItem>
              <SelectItem value="low">Low confidence (&lt;50%)</SelectItem>
              <SelectItem value="med">Medium (50–80%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-5 h-5 animate-spin text-white/30" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/30 text-sm">
              No pending records
            </div>
          ) : filtered.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full text-left px-4 py-3.5 border-b border-white/5 hover:bg-white/5 transition-colors ${selected?.id === r.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-white truncate">{r.company}</span>
                <ConfidenceBadge score={r.confidence_score} />
              </div>
              <p className="text-xs text-white/40 truncate">{r.role}</p>
              {r.level_standardized && (
                <span className="mt-1 inline-block text-xs text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">
                  {r.level_standardized}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right pane — detail */}
      <div className="flex-1 bg-[#0F172A] flex flex-col overflow-hidden">
        <div className="h-14 border-b border-white/5 flex items-center px-5">
          <h3 className="text-sm font-semibold text-white/60">Record Detail</h3>
        </div>
        <ReviewRecordPanel record={selected} onAction={handleAction} />
      </div>
    </div>
  );
}