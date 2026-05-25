import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ConfidenceBadge from '@/components/public/ConfidenceBadge';
import { Plus, Search, Trash2, Edit3, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BLANK = { company: '', role: '', level_standardized: '', location: '', base_salary: '', bonus: '', stock: '', total_compensation: '', experience_years_min: '', experience_years_max: '', source_platform: 'Manual', confidence_score: 1.0, review_status: 'approved', is_verified: true, is_rejected: false };

const STATUS_BADGE = {
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function SalaryRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const load = () => {
    setLoading(true);
    base44.entities.SalaryRecord.list('-created_date', 300)
      .then(setRecords).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.company?.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.review_status === statusFilter;
    return matchQ && matchStatus;
  });

  const openCreate = () => { setEditing(null); setForm(BLANK); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      base_salary: parseFloat(form.base_salary) || 0,
      bonus: parseFloat(form.bonus) || 0,
      stock: parseFloat(form.stock) || 0,
      experience_years_min: parseFloat(form.experience_years_min) || 0,
      experience_years_max: parseFloat(form.experience_years_max) || 0,
      total_compensation: (parseFloat(form.base_salary) || 0) + (parseFloat(form.bonus) || 0),
    };
    if (editing) {
      await base44.entities.SalaryRecord.update(editing.id, data);
      toast.success('Record updated');
    } else {
      await base44.entities.SalaryRecord.create(data);
      toast.success('Record created');
    }
    setModalOpen(false); load(); setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.SalaryRecord.delete(id);
    toast.success('Deleted'); load();
  };

  const handleBulkApprove = async () => {
    for (const id of selected) {
      await base44.entities.SalaryRecord.update(id, { review_status: 'approved', is_verified: true });
    }
    toast.success(`${selected.size} records approved`); setSelected(new Set()); load();
  };

  const exportCsv = () => {
    const headers = ['company', 'role', 'level_standardized', 'location', 'base_salary', 'bonus', 'stock', 'total_compensation', 'source_platform', 'review_status', 'confidence_score'];
    const rows = filtered.map(r => headers.map(h => r[h] ?? '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'salary-records.csv'; a.click();
  };

  const toggleSelect = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Salary Records</h1>
          <p className="text-white/40 text-sm mt-0.5">{records.length} total records</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button size="sm" onClick={handleBulkApprove} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Approve {selected.size}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={exportCsv} className="border-white/10 text-white/60 hover:text-white gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <Button size="sm" onClick={openCreate} className="bg-primary gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Record
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or role…"
            className="pl-8 h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm bg-white/5 border-white/10 text-white/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
      ) : (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0B1120]/50">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" className="rounded" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(r => r.id)) : new Set())} />
                  </th>
                  {['Company', 'Role', 'Level', 'Location', 'Base', 'Total', 'Source', 'Status', 'Confidence', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{r.company}</td>
                    <td className="px-4 py-3 text-white/60 whitespace-nowrap">{r.role}</td>
                    <td className="px-4 py-3">
                      {r.level_standardized && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-semibold">{r.level_standardized}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/60">{r.location || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-white">₹{r.base_salary || '—'}L</td>
                    <td className="px-4 py-3 text-white/60">₹{r.total_compensation || r.base_salary || '—'}L</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{r.source_platform}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_BADGE[r.review_status] || ''}`}>
                        {r.review_status}
                      </span>
                    </td>
                    <td className="px-4 py-3"><ConfidenceBadge score={r.confidence_score} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)} className="w-7 h-7 p-0 text-white/30 hover:text-white">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)} className="w-7 h-7 p-0 text-white/20 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">No records match your filters</div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1E293B] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'Edit Record' : 'Add Salary Record'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {[
              { key: 'company', label: 'Company' },
              { key: 'role', label: 'Role' },
              { key: 'level_standardized', label: 'Level' },
              { key: 'location', label: 'Location' },
              { key: 'base_salary', label: 'Base (LPA)', type: 'number' },
              { key: 'bonus', label: 'Bonus (LPA)', type: 'number' },
              { key: 'stock', label: 'Stock (LPA)', type: 'number' },
              { key: 'experience_years_min', label: 'Exp Min', type: 'number' },
              { key: 'experience_years_max', label: 'Exp Max', type: 'number' },
            ].map(({ key, label, type }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-white/60 text-xs">{label}</Label>
                <Input type={type || 'text'} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="h-8 text-sm bg-white/5 border-white/10 text-white" />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Source</Label>
              <Select value={form.source_platform} onValueChange={v => setForm(f => ({ ...f, source_platform: v }))}>
                <SelectTrigger className="h-8 text-sm bg-white/5 border-white/10 text-white/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['AmbitionBox', 'Glassdoor', 'LinkedIn', 'Manual', 'Other'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-white/50">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}