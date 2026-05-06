import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [form, setForm] = useState({ email: '', full_name: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.auth.register(form.email, form.password, form.full_name);
      await api.auth.login(form.email, form.password);
      navigate('/');
      window.location.reload();
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join the prediction game</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input className="mt-1" value={form.full_name} onChange={set('full_name')} placeholder="Your name" required />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input className="mt-1" type="password" value={form.password} onChange={set('password')} placeholder="********" required minLength={6} />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input className="mt-1" type="password" value={form.confirm} onChange={set('confirm')} placeholder="********" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
