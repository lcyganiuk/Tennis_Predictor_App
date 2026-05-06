import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { Trophy, MapPin, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const surfaceColors = {
  Hard: 'bg-blue-100 text-blue-700 border-blue-200',
  Clay: 'bg-orange-100 text-orange-700 border-orange-200',
  Grass: 'bg-green-100 text-green-700 border-green-200',
  'Indoor Hard': 'bg-purple-100 text-purple-700 border-purple-200',
};

const statusColors = {
  upcoming: 'bg-secondary text-secondary-foreground',
  ongoing: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-muted text-muted-foreground',
};

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.entities.Tournament.list('-start_date').then((data) => {
      setTournaments(data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'all' ? tournaments : tournaments.filter((tournament) => tournament.status === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-foreground">Tournaments</h1>
          <p className="text-muted-foreground mt-1">Choose a tournament and make your predictions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'upcoming', 'ongoing', 'completed'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No tournaments found.</p>
          <p className="text-muted-foreground text-sm mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tournament, i) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => navigate(`/tournaments/${tournament.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline" className={`text-xs ${statusColors[tournament.status] || ''}`}>
                      {tournament.status}
                    </Badge>
                    {tournament.surface && (
                      <Badge variant="outline" className={`text-xs ${surfaceColors[tournament.surface] || ''}`}>
                        {tournament.surface}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
                    {tournament.name}
                  </h3>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center ml-3 group-hover:bg-primary/20 transition-colors">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
              </div>

              {tournament.category && (
                <p className="text-xs text-muted-foreground font-medium mb-3">{tournament.category}</p>
              )}

              <div className="space-y-2 text-sm text-muted-foreground">
                {tournament.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{tournament.location}</span>
                  </div>
                )}
                {tournament.start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {format(new Date(tournament.start_date), 'MMM d')}
                      {tournament.end_date ? ` - ${format(new Date(tournament.end_date), 'MMM d, yyyy')}` : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">{tournament.size || 0} players</span>
                {tournament.prize_money && <span className="text-xs font-semibold text-primary">{tournament.prize_money}</span>}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
