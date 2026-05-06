import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Trophy, Users, LayoutDashboard, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => setUser(null));
  }, [location.pathname]);

  const handleLogout = () => {
    api.auth.logout('/');
  };

  const navItems = [
    { label: 'Tournaments', icon: Trophy, path: '/tournaments' },
    { label: 'Leaderboard', icon: Users, path: '/leaderboard' },
    ...(user?.role === 'admin' ? [{ label: 'Admin', icon: LayoutDashboard, path: '/admin' }] : []),
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl text-foreground tracking-wider">TTP</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {user.full_name || user.email}
                </button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                <Button size="sm" onClick={() => navigate('/register')}>Register</Button>
              </div>
            )}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-secondary"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(item.path) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2"><item.icon className="w-4 h-4" />{item.label}</div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            ))}
            <div className="pt-2 border-t border-border">
              {user ? (
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-destructive">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate('/login'); setMobileOpen(false); }}>Login</Button>
                  <Button size="sm" className="flex-1" onClick={() => { navigate('/register'); setMobileOpen(false); }}>Register</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Copyright 2026 Tennis Tournament Predictor
      </footer>
    </div>
  );
}
