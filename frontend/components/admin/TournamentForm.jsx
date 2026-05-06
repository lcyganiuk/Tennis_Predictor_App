import { useState } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';

export default function TournamentForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    location: initial?.location || '',
    surface: initial?.surface || 'Hard',
    size: initial?.size || 32,
    start_date: initial?.start_date || '',
    end_date: initial?.end_date || '',
    category: initial?.category || 'ATP 250',
  });
  const [saving, setSaving] = useState(false);

  const computeStatus = (start, end) => {
    if (!start) return 'upcoming';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const s = new Date(start);
    const e = end ? new Date(end) : null;
    if (today < s) return 'upcoming';
    if (e && today > e) return 'completed';
    return 'ongoing';
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const status = computeStatus(form.start_date, form.end_date);
    const data = { ...form, size: Number(form.size), status };
    let result;
    if (initial) {
      result = await api.entities.Tournament.update(initial.id, data);
    } else {
      result = await api.entities.Tournament.create(data);
    }
    onSaved(result);
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-foreground text-lg">{initial ? 'Edit Tournament' : 'New Tournament'}</h2>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Tournament Name *</Label>
          <Input className="mt-1.5" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Wimbledon 2026" required />
        </div>
        <div>
          <Label>Location</Label>
          <Input className="mt-1.5" value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Country" />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => set('category', v)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Grand Slam', 'ATP 1000', 'ATP 500', 'ATP 250', 'WTA 1000', 'WTA 500', 'WTA 250'].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Surface</Label>
          <Select value={form.surface} onValueChange={v => set('surface', v)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Hard', 'Clay', 'Grass'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Draw Size</Label>
          <Select value={String(form.size)} onValueChange={v => set('size', Number(v))}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="32">32 players</SelectItem>
              <SelectItem value="64">64 players</SelectItem>
              <SelectItem value="128">128 players</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Start Date</Label>
          <Input className="mt-1.5" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input className="mt-1.5" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </div>
        <div className="hidden">
          <Select value={form.status} onValueChange={v => set('status', v)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 flex gap-3 pt-2">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? 'Update Tournament' : 'Create Tournament'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}