import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Briefcase, Layers, Plus, Trash2, Edit3, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

function EntityTable({ entity, columns, blankRow, onSave, onDelete, loading, data }) {
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState(blankRow);
  const [saving, setSaving] = useState(false);

  const handleSave = async (id) => {
    setSaving(true);
    await onSave(id, id === 'new' ? newRow : editData);
    setEditId(null); setAdding(false); setNewRow(blankRow);
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdding(true)} className="bg-primary gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
      <div className="bg-[#1E293B] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-[#0B1120]/50">
              {columns.map(c => (
                <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">{c.label}</th>
              ))}
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr className="border-b border-white/5 bg-primary/5">
                {columns.map(c => (
                  <td key={c.key} className="px-3 py-2.5">
                    {c.options ? (
                      <Select value={newRow[c.key] || ''} onValueChange={v => setNewRow(r => ({ ...r, [c.key]: v }))}>
                        <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 text-white/60 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>{c.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input value={newRow[c.key] || ''} onChange={e => setNewRow(r => ({ ...r, [c.key]: e.target.value }))}
                        className="h-7 text-xs bg-white/5 border-white/10 text-white px-2" />
                    )}
                  </td>
                ))}
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleSave('new')} disabled={saving} className="w-6 h-6 p-0 text-emerald-400 hover:text-emerald-300">
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewRow(blankRow); }} className="w-6 h-6 p-0 text-white/30 hover:text-white">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-white/30 mx-auto" /></td></tr>
            ) : data.map((row, i) => (
              <tr key={row.id} className={`border-b border-white/5 hover:bg-white/3 ${i % 2 ? 'bg-white/[0.02]' : ''}`}>
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-3">
                    {editId === row.id ? (
                      c.options ? (
                        <Select value={editData[c.key] || ''} onValueChange={v => setEditData(d => ({ ...d, [c.key]: v }))}>
                          <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 text-white/60 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>{c.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <Input value={editData[c.key] ?? ''} onChange={e => setEditData(d => ({ ...d, [c.key]: e.target.value }))}
                          className="h-7 text-xs bg-white/5 border-white/10 text-white px-2" />
                      )
                    ) : (
                      <span className={c.primary ? 'font-medium text-white' : 'text-white/60'}>{row[c.key] ?? '—'}</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {editId === row.id ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleSave(row.id)} disabled={saving} className="w-6 h-6 p-0 text-emerald-400">
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="w-6 h-6 p-0 text-white/30">
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => { setEditId(row.id); setEditData({ ...row }); }} className="w-6 h-6 p-0 text-white/30 hover:text-white">
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onDelete(row.id)} className="w-6 h-6 p-0 text-white/20 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && data.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="py-10 text-center text-white/30 text-sm">No records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReferenceData() {
  const [tab, setTab] = useState('companies');
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState({ companies: true, roles: true, levels: true });

  useEffect(() => {
    base44.entities.Company.list('-created_date', 100).then(d => { setCompanies(d); setLoading(l => ({ ...l, companies: false })); });
    base44.entities.Role.list('-created_date', 100).then(d => { setRoles(d); setLoading(l => ({ ...l, roles: false })); });
    base44.entities.Level.list('seniority_rank', 50).then(d => { setLevels(d); setLoading(l => ({ ...l, levels: false })); });
  }, []);

  const save = (entity, setter) => async (id, data) => {
    if (id === 'new') {
      const created = await base44.entities[entity].create(data);
      setter(prev => [created, ...prev]);
      toast.success('Created');
    } else {
      await base44.entities[entity].update(id, data);
      setter(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
      toast.success('Updated');
    }
  };

  const del = (entity, setter) => async (id) => {
    await base44.entities[entity].delete(id);
    setter(prev => prev.filter(r => r.id !== id));
    toast.success('Deleted');
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Reference Data</h1>
        <p className="text-white/40 text-sm mt-0.5">Manage master lists used by the normalization engine</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="companies" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white text-white/50">
            <Building2 className="w-3.5 h-3.5" /> Companies
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white text-white/50">
            <Briefcase className="w-3.5 h-3.5" /> Roles
          </TabsTrigger>
          <TabsTrigger value="levels" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white text-white/50">
            <Layers className="w-3.5 h-3.5" /> Levels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="mt-4">
          <EntityTable
            entity="Company" data={companies} loading={loading.companies}
            onSave={save('Company', setCompanies)} onDelete={del('Company', setCompanies)}
            blankRow={{ canonical_name: '', industry: 'Technology', hq_location: '', website: '' }}
            columns={[
              { key: 'canonical_name', label: 'Company Name', primary: true },
              { key: 'industry', label: 'Industry', options: ['Technology', 'Fintech', 'E-commerce', 'SaaS', 'Consulting', 'Banking', 'Healthcare', 'Other'] },
              { key: 'hq_location', label: 'HQ City' },
              { key: 'website', label: 'Website' },
            ]}
          />
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <EntityTable
            entity="Role" data={roles} loading={loading.roles}
            onSave={save('Role', setRoles)} onDelete={del('Role', setRoles)}
            blankRow={{ canonical_title: '', role_family: 'Engineering' }}
            columns={[
              { key: 'canonical_title', label: 'Canonical Title', primary: true },
              { key: 'role_family', label: 'Family', options: ['Engineering', 'Data', 'Product', 'Design', 'Other'] },
            ]}
          />
        </TabsContent>

        <TabsContent value="levels" className="mt-4">
          <EntityTable
            entity="Level" data={levels} loading={loading.levels}
            onSave={save('Level', setLevels)} onDelete={del('Level', setLevels)}
            blankRow={{ code: '', display_name: '', seniority_rank: '', role_family: 'All', experience_min: '', experience_max: '' }}
            columns={[
              { key: 'code', label: 'Code', primary: true },
              { key: 'display_name', label: 'Display Name' },
              { key: 'seniority_rank', label: 'Rank' },
              { key: 'role_family', label: 'Family', options: ['Engineering', 'Data', 'Product', 'Design', 'All'] },
              { key: 'experience_min', label: 'Exp Min' },
              { key: 'experience_max', label: 'Exp Max' },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}