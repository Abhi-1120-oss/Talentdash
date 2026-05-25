import React, { useState } from 'react';
import { CheckCircle, XCircle, Edit3, Save, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ConfidenceBadge from '@/components/public/ConfidenceBadge';

export default function ReviewRecordPanel({ record, onAction }) {
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);

  if (!record) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
        Select a record to review
      </div>
    );
  }

  const raw = (() => { try { return JSON.parse(record.raw_scraped_json || '{}'); } catch { return {}; } })();

  const handleApprove = async () => {
    setSaving(true);
    await base44.entities.SalaryRecord.update(record.id, {
      review_status: 'approved', is_verified: true, is_rejected: false
    });
    toast.success('Record approved and verified');
    onAction('approved', record.id);
    setSaving(false);
  };

  const handleReject = async () => {
    setSaving(true);
    await base44.entities.SalaryRecord.update(record.id, {
      review_status: 'rejected', is_rejected: true, is_verified: false
    });
    toast.error('Record rejected');
    onAction('rejected', record.id);
    setSaving(false);
  };

  const handleSaveEdits = async () => {
    setSaving(true);
    await base44.entities.SalaryRecord.update(record.id, { ...edits, review_status: 'approved', is_verified: true });
    toast.success('Record updated and approved');
    onAction('approved', record.id);
    setSaving(false);
    setEditing(false);
    setEdits({});
  };

  const FIELDS = [
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    { key: 'level_standardized', label: 'Level' },
    { key: 'location', label: 'Location' },
    { key: 'base_salary', label: 'Base (LPA)', type: 'number' },
    { key: 'bonus', label: 'Bonus (LPA)', type: 'number' },
    { key: 'stock', label: 'Stock (LPA)', type: 'number' },
    { key: 'experience_years_min', label: 'Exp Min', type: 'number' },
    { key: 'experience_years_max', label: 'Exp Max', type: 'number' },
  ];

  return (
    <div className="flex-1 overflow-auto p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">{record.company}</h3>
          <p className="text-white/50 text-sm">{record.role} · {record.level_standardized}</p>
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBadge score={record.confidence_score} />
          {!editing && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}
              className="text-white/50 hover:text-white gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Side-by-side diff */}
      <div className="grid grid-cols-2 gap-3">
        {/* Raw */}
        <div className="bg-[#0B1120] rounded-lg p-4">
          <p className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-3">Raw Scraped</p>
          <div className="space-y-2">
            {Object.entries(raw).slice(0, 8).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-xs text-white/30 w-24 flex-shrink-0">{k}</span>
                <span className="text-xs text-white/70 break-all">{String(v || '—')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Normalized */}
        <div className="bg-[#0B1120] rounded-lg p-4">
          <p className="text-xs text-emerald-400/60 font-semibold uppercase tracking-wider mb-3">Normalized</p>
          <div className="space-y-2">
            {FIELDS.map(({ key, label, type }) => (
              <div key={key} className="flex gap-2 items-center">
                <span className="text-xs text-white/30 w-24 flex-shrink-0">{label}</span>
                {editing ? (
                  <Input
                    type={type || 'text'}
                    defaultValue={record[key] ?? ''}
                    onChange={(e) => setEdits(prev => ({ ...prev, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                    className="h-6 text-xs bg-white/5 border-white/10 text-white px-2 py-0"
                  />
                ) : (
                  <span className={`text-xs ${record[key] !== undefined ? 'text-white/80' : 'text-white/20'}`}>
                    {String(record[key] ?? '—')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {editing ? (
          <>
            <Button size="sm" onClick={handleSaveEdits} disabled={saving}
              className="bg-primary hover:bg-primary/90 gap-1.5 flex-1">
              <Save className="w-3.5 h-3.5" /> Save & Approve
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEdits({}); }}
              className="text-white/50 hover:text-white gap-1.5">
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={handleApprove} disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 gap-1.5 flex-1">
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </Button>
            <Button size="sm" onClick={handleReject} disabled={saving}
              variant="destructive" className="gap-1.5 flex-1">
              <XCircle className="w-3.5 h-3.5" /> Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}