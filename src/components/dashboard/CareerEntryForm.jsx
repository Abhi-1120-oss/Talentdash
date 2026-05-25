import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const BLANK = {
  company: '', role: '', level: '', location: '',
  start_date: '', end_date: '', is_current: false,
  base_salary: '', bonus: '', stock: '',
  role_family: 'Engineering', notes: '',
};

export default function CareerEntryForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || BLANK);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const base = parseFloat(form.base_salary) || 0;
    const bonus = parseFloat(form.bonus) || 0;
    const stock = parseFloat(form.stock) || 0;
    await onSave({
      ...form,
      base_salary: base,
      bonus,
      stock,
      total_compensation: base + bonus,
      end_date: form.is_current ? '' : form.end_date,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Career Entry' : 'Add Career Entry'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs text-muted-foreground">Company *</Label>
            <Input value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Google" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs text-muted-foreground">Role / Title *</Label>
            <Input value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Senior Software Engineer" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Level</Label>
            <Input value={form.level} onChange={e => set('level', e.target.value)} placeholder="e.g. L5, SDE-II" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bangalore" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Start Date *</Label>
            <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} disabled={form.is_current} />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <Switch checked={form.is_current} onCheckedChange={v => set('is_current', v)} />
            <Label className="text-sm">This is my current role</Label>
          </div>

          <div className="col-span-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Compensation (INR LPA)</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Base Salary *</Label>
            <Input type="number" value={form.base_salary} onChange={e => set('base_salary', e.target.value)} placeholder="e.g. 45" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Bonus</Label>
            <Input type="number" value={form.bonus} onChange={e => set('bonus', e.target.value)} placeholder="e.g. 8" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Stock / ESOP</Label>
            <Input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="e.g. 12" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Role Family</Label>
            <Select value={form.role_family} onValueChange={v => set('role_family', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Engineering', 'Data', 'Product', 'Design', 'Other'].map(f =>
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs text-muted-foreground">Notes (private)</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any context about this role…" className="h-16 resize-none" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.company || !form.role || !form.start_date || !form.base_salary} className="bg-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : initial ? 'Save Changes' : 'Add Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}