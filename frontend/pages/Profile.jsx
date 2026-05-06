import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Loader2, Save, Trophy } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [form, setForm] = useState({ full_name: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const currentUser = await api.auth.me().catch(() => null);
      if (!currentUser) {
        navigate('/');
        return;
      }

      setUser(currentUser);
      setForm({ full_name: currentUser.full_name || '' });

      const userPredictions = await api.entities.Prediction.filter({ user_email: currentUser.email });
      setPredictions(userPredictions);
      setLoading(false);
    };

    load();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updatedUser = await api.auth.updateMe(form);
    setUser(updatedUser);
    toast.success('Profile updated');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPoints = predictions.reduce((sum, prediction) => sum + (prediction.total_points || 0), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl text-foreground">{user?.full_name || user?.email}</h1>
        <p className="text-muted-foreground text-sm">{user?.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Points', value: totalPoints, icon: Trophy },
          { label: 'Brackets', value: predictions.length, icon: User },
          { label: 'Role', value: user?.role || 'user', icon: User },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="font-display text-2xl text-primary">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold text-foreground mb-4">Edit Profile</h2>
        <div className="space-y-4">
          <div>
            <Label>Display Name</Label>
            <Input
              className="mt-1.5"
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Your name"
            />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="mt-5 gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </form>
    </div>
  );
}
