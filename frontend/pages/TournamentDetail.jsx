import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { Trophy, ArrowLeft, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BracketView from '@/components/BracketView';
import PredictionBracket from '@/components/PredictionBracket';
import TournamentLeaderboard from '@/components/TournamentLeaderboard';
import { format } from 'date-fns';

function computeStatus(start, end) {
  if (!start) return 'upcoming';
  const now = new Date();
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const endDay = end ? new Date(end) : null;
  if (endDay) endDay.setHours(23, 59, 59, 999);

  const predDeadline = new Date(startDay);
  predDeadline.setDate(predDeadline.getDate() - 1);
  predDeadline.setHours(23, 59, 59, 999);

  if (now <= predDeadline) return 'upcoming';
  if (endDay && now > endDay) return 'completed';
  return 'ongoing';
}

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [user, setUser] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bracket');

  useEffect(() => {
    const load = async () => {
      const [tournaments, matchData, playerData, currentUser] = await Promise.all([
        api.entities.Tournament.filter({ id }),
        api.entities.Match.filter({ tournament_id: id }),
        api.entities.Player.filter({ tournament_id: id }),
        api.auth.me().catch(() => null),
      ]);

      let currentTournament = tournaments[0] || null;
      if (currentTournament && currentTournament.start_date) {
        const expectedStatus = computeStatus(currentTournament.start_date, currentTournament.end_date);
        if (currentTournament.status !== expectedStatus) {
          await api.entities.Tournament.update(currentTournament.id, { status: expectedStatus });
          currentTournament = { ...currentTournament, status: expectedStatus };
        }
      }

      setTournament(currentTournament);
      setMatches(matchData);
      setPlayers(playerData);
      setUser(currentUser);

      if (currentUser) {
        const predictions = await api.entities.Prediction.filter({ tournament_id: id, user_email: currentUser.email });
        setPrediction(predictions[0] || null);
      }

      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Tournament not found.</p>
        <Button variant="ghost" onClick={() => navigate('/tournaments')} className="mt-4">Back</Button>
      </div>
    );
  }

  const canPredict = tournament.status === 'upcoming';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-start gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tournaments')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="capitalize">{tournament.status}</Badge>
            {tournament.surface && <Badge variant="outline">{tournament.surface}</Badge>}
            {tournament.category && <Badge variant="outline">{tournament.category}</Badge>}
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground">{tournament.name}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            {tournament.location && <span>{tournament.location}</span>}
            {tournament.start_date && (
              <span>
                {format(new Date(tournament.start_date), 'MMM d')}
                {tournament.end_date ? ` - ${format(new Date(tournament.end_date), 'MMM d, yyyy')}` : ''}
              </span>
            )}
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{tournament.size} players</span>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="bracket">Official Bracket</TabsTrigger>
          {user && <TabsTrigger value="predict">My Predictions</TabsTrigger>}
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="bracket">
          {matches.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No matches defined yet. Check back soon.</p>
            </div>
          ) : (
            <BracketView matches={matches} players={players} tournament={tournament} />
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <TournamentLeaderboard tournament={tournament} currentUser={user} />
        </TabsContent>

        {user && (
          <TabsContent value="predict">
            {!canPredict ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">Predictions are closed</p>
                <p className="text-muted-foreground text-sm">You can only predict matches before the tournament starts.</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <p className="text-muted-foreground">Bracket not set up yet. Come back when matches are defined.</p>
              </div>
            ) : (
              <PredictionBracket
                tournament={tournament}
                matches={matches}
                players={players}
                user={user}
                existingPrediction={prediction}
                onSaved={setPrediction}
              />
            )}
          </TabsContent>
        )}
      </Tabs>

      {!user && (
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <p className="text-foreground font-medium mb-2">Want to predict this tournament?</p>
          <p className="text-muted-foreground text-sm mb-4">Sign in or create an account to submit your bracket predictions.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/login')}>Sign In</Button>
            <Button variant="outline" onClick={() => navigate('/register')}>Register</Button>
          </div>
        </div>
      )}
    </div>
  );
}
