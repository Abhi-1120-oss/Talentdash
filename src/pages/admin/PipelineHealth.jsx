import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import KpiCard from '@/components/admin/KpiCard';
import ConfidenceHistogram from '@/components/admin/ConfidenceHistogram';
import { Activity, Database, AlertTriangle, Copy, Zap, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-lg p-3 text-xs text-white shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
}

export default function PipelineHealth() {
  const [runs, setRuns] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.PipelineRun.list('-started_at', 30),
      base44.entities.SalaryRecord.list('-created_date', 500),
    ]).then(([r, rec]) => { setRuns(r); setRecords(rec); })
      .finally(() => setLoading(false));
  }, []);

  const latest = runs[0] || {};
  const totalRecords = records.length;
  const verified = records.filter(r => r.is_verified).length;
  const pending = records.filter(r => r.review_status === 'pending').length;
  const rejected = records.filter(r => r.is_rejected).length;
  const avgConfidence = records.length
    ? (records.reduce((s, r) => s + (r.confidence_score || 0), 0) / records.length).toFixed(2)
    : '—';

  const sourceData = useMemo(() => {
    const map = {};
    records.forEach(r => { map[r.source_platform] = (map[r.source_platform] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [records]);

  const runChartData = runs.slice(0, 10).reverse().map(r => ({
    name: r.started_at ? new Date(r.started_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—',
    Scraped: r.records_scraped || 0,
    Inserted: r.records_inserted || 0,
    Failures: (r.validation_failures || 0) + (r.llm_failures || 0),
  }));

  const exportReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      total_records: totalRecords,
      verified, pending, rejected,
      avg_confidence: avgConfidence,
      latest_run: latest,
      source_breakdown: sourceData,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'quality-report.json'; a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Pipeline Health</h1>
          <p className="text-white/40 text-sm mt-0.5">Ingestion metrics and data quality overview</p>
        </div>
        <Button onClick={exportReport} size="sm" variant="outline"
          className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export Report
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Total Records" value={totalRecords} icon={Database} color="indigo" loading={loading} />
        <KpiCard title="Verified" value={verified} icon={CheckCircle} color="green" loading={loading} />
        <KpiCard title="Pending Review" value={pending} icon={Activity} color="amber" loading={loading} />
        <KpiCard title="Rejected" value={rejected} icon={AlertTriangle} color="red" loading={loading} />
        <KpiCard title="Avg Confidence" value={avgConfidence} icon={Zap} color="sky" loading={loading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Confidence Distribution */}
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Confidence Score Distribution</h3>
          <ConfidenceHistogram records={records} />
        </div>

        {/* Source Breakdown */}
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Records by Source</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sourceData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Run History */}
      {runChartData.length > 0 && (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Pipeline Run History</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={runChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="Scraped" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Inserted" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Failures" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Latest Run Details */}
      {latest.run_id && (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Latest Run Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              ['Run ID', latest.run_id?.slice(0, 8) + '…'],
              ['Source', latest.source],
              ['Status', latest.status],
              ['Scraped', latest.records_scraped],
              ['Normalized', latest.records_normalized],
              ['Duplicates Skipped', latest.duplicates_skipped],
              ['Validation Failures', latest.validation_failures],
              ['LLM Failures', latest.llm_failures],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-white/30 text-xs">{label}</p>
                <p className="text-white font-medium">{val ?? '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}