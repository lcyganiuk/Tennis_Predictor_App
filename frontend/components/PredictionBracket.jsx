import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle2, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function getRoundName(round, totalRounds) {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return 'Quarterfinal';
  return `Round of ${Math.pow(2, fromEnd + 1)}`;
}

function PredMatchCard({ match, predictedWinnerId, onPick, isDisabled, correctWinnerId, isScored, isByeMatch }) {
  const p1 = match.player1_name || 'TBD';
  const p2 = match.player2_name || 'TBD';
  const hasBothPlayers = match.player1_name && match.player2_name;

  const getStyle = (playerId, playerName) => {
    if (!playerId || !playerName) return 'opacity-50';
    if (isScored && correctWinnerId) {
      if (playerId === correctWinnerId) return 'bg-primary/10 border-primary text-primary font-semibold';
      if (playerId === predictedWinnerId && playerId !== correctWinnerId) return 'bg-destructive/10 border-destructive/30 text-destructive line-through';
    }
    if (predictedWinnerId === playerId) return 'bg-primary/10 border-primary text-primary font-semibold';
    return 'hover:bg-secondary/70 cursor-pointer';
  };

  if (isByeMatch) {
    const byeWinnerId = match.winner_id;
    return (
      <div className="bg-card border border-dashed border-border rounded-xl overflow-hidden shadow-sm text-sm opacity-75">
        {[{ id: match.player1_id, name: p1 }, { id: match.player2_id, name: p2 }].map(({ id, name }, idx) => {
          const isWinner = id && id === byeWinnerId;
          const isBye = name === 'BYE';
          return (
            <div
              key={idx}
              className={`flex items-center justify-between px-3 py-2.5 border-b last:border-b-0 border-border ${
                isWinner ? 'bg-primary/10 text-primary font-semibold' : isBye ? 'text-muted-foreground italic' : ''
              }`}
            >
              <span className="truncate max-w-[130px] font-medium">{name}</span>
              {isWinner && <CheckCircle2 className="w-4 h-4 text-primary shrink-0 ml-1" />}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm text-sm">
      {[{ id: match.player1_id, name: p1 }, { id: match.player2_id, name: p2 }].map(({ id, name }, idx) => (
        <div
          key={idx}
          onClick={() => !isDisabled && hasBothPlayers && id && name && onPick(match, id, name)}
          className={`flex items-center justify-between px-3 py-2.5 border-b last:border-b-0 border-border transition-colors ${getStyle(id, name)} ${!isDisabled && hasBothPlayers && id ? 'cursor-pointer' : ''}`}
        >
          <span className="truncate max-w-[130px] font-medium">{name}</span>
          {predictedWinnerId === id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0 ml-1" />}
        </div>
      ))}
    </div>
  );
}

export default function PredictionBracket({ tournament, matches, players, user, existingPrediction, onSaved }) {
  const [predictions, setPredictions] = useState({});
  const [dynamicMatches, setDynamicMatches] = useState([]);
  const [saving, setSaving] = useState(false);
  const isScored = existingPrediction?.is_scored;

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const totalRounds = rounds.length;

  const byeMatchIds = new Set(matches.filter((m) => m.player1_name === 'BYE' || m.player2_name === 'BYE').map((m) => m.id));
  const predictableMatches = matches.filter((m) => !byeMatchIds.has(m.id));

  useEffect(() => {
    const copy = matches.map((m) => ({ ...m }));
    setDynamicMatches(copy);

    if (existingPrediction?.predicted_winners) {
      const preds = {};
      existingPrediction.predicted_winners.forEach((pw) => {
        preds[pw.match_id] = { winner_id: pw.predicted_winner_id, winner_name: pw.predicted_winner_name };
      });
      setPredictions(preds);

      const rebuilt = copy.map((m) => ({ ...m }));
      existingPrediction.predicted_winners.forEach((pw) => {
        advanceInArray(rebuilt, pw.match_id, pw.predicted_winner_id, pw.predicted_winner_name, rounds);
      });
      setDynamicMatches(rebuilt);
    }
  }, [matches, existingPrediction]);

  function advanceInArray(matchArr, matchId, winnerId, winnerName, roundList) {
    const match = matchArr.find((m) => m.id === matchId);
    if (!match) return;
    const round = match.round;
    const nextRound = roundList[roundList.indexOf(round) + 1];
    if (!nextRound) return;
    const nextMatchIndex = Math.floor(match.match_index / 2);
    const isPlayer1Slot = match.match_index % 2 === 0;
    const nextMatch = matchArr.find((m) => m.round === nextRound && m.match_index === nextMatchIndex);
    if (!nextMatch) return;
    if (isPlayer1Slot) {
      nextMatch.player1_id = winnerId;
      nextMatch.player1_name = winnerName;
    } else {
      nextMatch.player2_id = winnerId;
      nextMatch.player2_name = winnerName;
    }
  }

  const handlePick = (match, winnerId, winnerName) => {
    if (isScored) return;

    const updatedMatches = dynamicMatches.map((m) => ({ ...m }));

    const clearDownstream = (fromRound, matchIndex) => {
      const nextRoundIdx = rounds.indexOf(fromRound) + 1;
      if (nextRoundIdx >= rounds.length) return;
      const nextRound = rounds[nextRoundIdx];
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const isP1Slot = matchIndex % 2 === 0;

      const nextMatch = updatedMatches.find((m) => m.round === nextRound && m.match_index === nextMatchIndex);
      if (!nextMatch) return;

      const oldWinner = predictions[match.id];
      if (oldWinner) {
        if (isP1Slot && nextMatch.player1_id === oldWinner.winner_id) {
          nextMatch.player1_id = null;
          nextMatch.player1_name = null;
          const nextMatchOrig = updatedMatches.find((m) => m.round === nextRound && m.match_index === nextMatchIndex);
          if (nextMatchOrig && predictions[nextMatchOrig.id]) {
            delete predictions[nextMatchOrig.id];
            clearDownstream(nextRound, nextMatchIndex);
          }
        } else if (!isP1Slot && nextMatch.player2_id === oldWinner.winner_id) {
          nextMatch.player2_id = null;
          nextMatch.player2_name = null;
          if (predictions[nextMatch.id]) {
            delete predictions[nextMatch.id];
            clearDownstream(nextRound, nextMatchIndex);
          }
        }
      }
    };

    clearDownstream(match.round, match.match_index);

    const newPreds = { ...predictions, [match.id]: { winner_id: winnerId, winner_name: winnerName } };
    setPredictions(newPreds);

    advanceInArray(updatedMatches, match.id, winnerId, winnerName, rounds);
    setDynamicMatches(updatedMatches);
  };

  const handleSave = async () => {
    setSaving(true);
    const predictedWinners = Object.entries(predictions).map(([matchId, { winner_id, winner_name }]) => {
      const m = matches.find((x) => x.id === matchId);
      return {
        match_id: matchId,
        round: m?.round,
        match_index: m?.match_index,
        predicted_winner_id: winner_id,
        predicted_winner_name: winner_name,
        is_correct: null,
        points_earned: 0,
      };
    });

    const data = {
      tournament_id: tournament.id,
      user_email: user.email,
      predicted_winners: predictedWinners,
      total_points: 0,
      is_scored: false,
    };

    let saved;
    if (existingPrediction) {
      saved = await api.entities.Prediction.update(existingPrediction.id, data);
    } else {
      saved = await api.entities.Prediction.create(data);
    }
    onSaved(saved);
    toast.success('Predictions saved!');
    setSaving(false);
  };

  const totalPredicted = Object.keys(predictions).filter((id) => !byeMatchIds.has(id)).length;
  const totalMatches = predictableMatches.length;
  const progress = totalMatches === 0 ? 0 : Math.round((totalPredicted / totalMatches) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 mr-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{totalPredicted} of {totalMatches} matches predicted</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || totalPredicted === 0} className="gap-2 shrink-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {existingPrediction ? 'Update' : 'Save'}
        </Button>
      </div>

      {isScored && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-4 text-sm">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-foreground font-medium">Scored! You earned {existingPrediction.total_points} points from this tournament.</span>
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {rounds.map((round) => {
            const roundMatches = dynamicMatches.filter((m) => m.round === round).sort((a, b) => a.match_index - b.match_index);
            const realRoundMatches = matches.filter((m) => m.round === round);
            const roundName = getRoundName(round, totalRounds);
            return (
              <div key={round} style={{ minWidth: 180 }} className="flex flex-col">
                <div className="text-center mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{roundName}</span>
                </div>
                <div className="flex flex-col justify-around flex-1 gap-2">
                  {roundMatches.map((match) => {
                    const realMatch = realRoundMatches.find((rm) => rm.match_index === match.match_index);
                    const isByeMatch = byeMatchIds.has(match.id);
                    return (
                      <PredMatchCard
                        key={match.id || `${round}-${match.match_index}`}
                        match={match}
                        predictedWinnerId={predictions[match.id]?.winner_id}
                        onPick={handlePick}
                        isDisabled={isScored}
                        correctWinnerId={realMatch?.winner_id}
                        isScored={isScored}
                        isByeMatch={isByeMatch}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
