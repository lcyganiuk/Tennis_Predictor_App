import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trophy, Loader2, Settings } from 'lucide-react';

import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TournamentForm from '@/components/admin/TournamentForm';
import TournamentManage from '@/components/admin/TournamentManage';

export default function Admin() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTournament, setEditTournament] = useState(null);
  const [manageTournament, setManageTournament] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const user = await api.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') {
        navigate('/');
        return;
      }

      const data = await api.entities.Tournament.list('-created_date');
      setTournaments(data);
      setLoading(false);
    };

    load();
  }, [navigate]);

  const handleSaved = (tournament) => {
    if (editTournament) {
      setTournaments((prev) => prev.map((item) => (item.id === tournament.id ? tournament : item)));
    } else {
      setTournaments((prev) => [tournament, ...prev]);
    }
    setShowForm(false);
    setEditTournament(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tournament and all related data?')) return;
    await api.entities.Tournament.delete(id);
    setTournaments((prev) => prev.filter((tournament) => tournament.id !== id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (manageTournament) {
    return <TournamentManage tournament={manageTournament} onBack={() => setManageTournament(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage tournaments, brackets, and matches</p>
        </div>
        <Button onClick={() => { setEditTournament(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Tournament
        </Button>
      </div>

      {(showForm || editTournament) && (
        <div className="mb-8">
          <TournamentForm
            initial={editTournament}
            onSaved={handleSaved}
            onCancel={() => {
              setShowForm(false);
              setEditTournament(null);
            }}
          />
        </div>
      )}

      {tournaments.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No tournaments yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((tournament, i) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-1">
                  <Badge variant="outline" className="capitalize text-xs">
                    {tournament.status}
                  </Badge>
                  {tournament.surface && (
                    <Badge variant="outline" className="text-xs">
                      {tournament.surface}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-foreground">{tournament.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tournament.size} players
                  {tournament.location ? ` - ${tournament.location}` : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditTournament(tournament);
                    setShowForm(false);
                  }}
                >
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setManageTournament(tournament)} className="gap-1">
                  <Settings className="w-3.5 h-3.5" /> Bracket
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(tournament.id)}>
                  Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
