import { useState } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function getRoundName(round, totalRounds) {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return 'Quarterfinal';
  return `Round of ${Math.pow(2, fromEnd + 1)}`;
}

export default function MatchManager({ tournament, matches, setMatches }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [scores, setScores] = useState({});
  const [pendingWinner, setPendingWinner] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
  const totalRounds = rounds.length;

  const scorePredictionsForMatch = async (matchId, winnerId, pointsMultiplier = 1) => {
    const match = matches.find(m => m.id === matchId);
    const predictions = await api.entities.Prediction.filter({ tournament_id: tournament.id });
    const pointsPerRound = Math.pow(2, match.round - 1);
    for (const pred of predictions) {
      const pw = pred.predicted_winners?.find(x => x.match_id === matchId);
      if (!pw) continue;
      const isCorrect = pointsMultiplier > 0 ? pw.predicted_winner_id === winnerId : null;
      const pointsEarned = isCorrect ? pointsPerRound * pointsMultiplier : 0;
      const newWinners = pred.predicted_winners.map(x =>
        x.match_id === matchId ? { ...x, is_correct: isCorrect, points_earned: pointsEarned } : x
      );
      const newTotal = newWinners.reduce((sum, x) => sum + (x.points_earned || 0), 0);
      const allScored = pointsMultiplier > 0
        ? newWinners.every(x => x.is_correct !== null && x.is_correct !== undefined)
        : false;
      await api.entities.Prediction.update(pred.id, {
        predicted_winners: newWinners,
        total_points: newTotal,
        is_scored: allScored,
      });
    }
  };

  const confirmWinner = async (match) => {
    const pending = pendingWinner?.[match.id];
    if (!pending) return;
    const { winnerId, winnerName } = pending;
    setPendingWinner(prev => { const n = { ...prev }; delete n[match.id]; return n; });
    setUpdatingId(match.id);

    const updated = await api.entities.Match.update(match.id, {
      winner_id: winnerId,
      winner_name: winnerName,
      status: 'completed',
      score: scores[match.id] || '',
    });

    if (rounds.indexOf(match.round) < rounds.length - 1) {
      const nextRound = rounds[rounds.indexOf(match.round) + 1];
      const nextMatchIndex = Math.floor(match.match_index / 2);
      const isP1Slot = match.match_index % 2 === 0;
      const nextMatch = matches.find(m => m.round === nextRound && m.match_index === nextMatchIndex);
      if (nextMatch) {
        const updateData = isP1Slot
          ? { player1_id: winnerId, player1_name: winnerName }
          : { player2_id: winnerId, player2_name: winnerName };
        const updatedNext = await api.entities.Match.update(nextMatch.id, updateData);
        setMatches(prev => prev.map(m => m.id === updatedNext.id ? updatedNext : m));
      }
    }

    setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
    await scorePredictionsForMatch(match.id, winnerId, 1);

    toast.success(`${winnerName} advances! Predictions scored.`);
    setUpdatingId(null);
  };

  const deleteResult = async (match) => {
    setDeletingId(match.id);
    const prevWinnerId = match.winner_id;

    await scorePredictionsForMatch(match.id, prevWinnerId, 0);

    if (rounds.indexOf(match.round) < rounds.length - 1) {
      const nextRound = rounds[rounds.indexOf(match.round) + 1];
      const nextMatchIndex = Math.floor(match.match_index / 2);
      const isP1Slot = match.match_index % 2 === 0;
      const nextMatch = matches.find(m => m.round === nextRound && m.match_index === nextMatchIndex);
      if (nextMatch) {
        const clearData = isP1Slot
          ? { player1_id: null, player1_name: 'TBD' }
          : { player2_id: null, player2_name: 'TBD' };
        const updatedNext = await api.entities.Match.update(nextMatch.id, clearData);
        setMatches(prev => prev.map(m => m.id === updatedNext.id ? updatedNext : m));
      }
    }

    const updated = await api.entities.Match.update(match.id, {
      winner_id: null,
      winner_name: null,
      status: 'scheduled',
      score: '',
    });
    setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));

    toast.success('Result deleted.');
    setDeletingId(null);
  };

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-2xl">
        <p className="text-muted-foreground">No matches yet. Go to Players tab and click "Generate Bracket".</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rounds.map(round => {
        const roundMatches = matches.filter(m => m.round === round).sort((a, b) => a.match_index - b.match_index);
        const roundName = getRoundName(round, totalRounds);
        return (
          <div key={round}>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span>{roundName}</span>
              <span className="text-xs text-muted-foreground font-normal">({Math.pow(2, round - 1)} pts/correct)</span>
            </h3>
            <div className="space-y-3">
              {roundMatches.filter(m => m.player1_name !== 'BYE' && m.player2_name !== 'BYE').map(match => {
                const isPending = !!pendingWinner?.[match.id];
                const pending = pendingWinner?.[match.id];
                return (
                  <div key={match.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 space-y-2">
                        {[
                          { id: match.player1_id, name: match.player1_name },
                          { id: match.player2_id, name: match.player2_name },
                        ].map(({ id, name }, idx) => (
                          <div key={id || idx} className="flex items-center gap-2">
                            {match.winner_id === id && match.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                            ) : (
                              <div className="w-4 h-4 shrink-0" />
                            )}
                            <span className={`text-sm font-medium ${match.winner_id === id ? 'text-primary' : name ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                              {name || 'TBD'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {match.status !== 'completed' && match.player1_name && match.player2_name && match.player1_name !== 'TBD' && match.player2_name !== 'TBD' ? (
                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <Input
                            className="w-28 text-sm h-8"
                            placeholder="Score"
                            value={scores[match.id] || ''}
                            onChange={e => setScores(s => ({ ...s, [match.id]: e.target.value }))}
                          />
                          <Select onValueChange={(val) => {
                            const [wId, wName] = val.split('::');
                            setPendingWinner(prev => ({ ...prev, [match.id]: { winnerId: wId, winnerName: wName } }));
                          }}>
                            <SelectTrigger className="w-40 h-8 text-sm">
                              <SelectValue placeholder="Set winner" />
                            </SelectTrigger>
                            <SelectContent>
                              {match.player1_id && <SelectItem value={`${match.player1_id}::${match.player1_name}`}>{match.player1_name}</SelectItem>}
                              {match.player2_id && <SelectItem value={`${match.player2_id}::${match.player2_name}`}>{match.player2_name}</SelectItem>}
                            </SelectContent>
                          </Select>
                          {updatingId === match.id && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                        </div>
                      ) : match.status === 'completed' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{match.score}</span>
                          <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">Done</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteResult(match)}
                            disabled={deletingId === match.id}
                            title="Delete result & reverse points"
                          >
                            {deletingId === match.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Waiting for players</span>
                      )}
                    </div>

                    {isPending && (
                      <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                        <p className="text-amber-800 text-sm flex-1">
                          Confirm <strong>{pending.winnerName}</strong> as winner?
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => confirmWinner(match)} className="bg-amber-600 hover:bg-amber-700 text-white h-7">Yes, confirm</Button>
                          <Button size="sm" variant="outline" className="h-7" onClick={() => setPendingWinner(prev => { const n = { ...prev }; delete n[match.id]; return n; })}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
