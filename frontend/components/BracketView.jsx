import { CheckCircle2 } from 'lucide-react';

function getRoundName(round, totalRounds) {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return 'Quarterfinal';
  return `Round of ${Math.pow(2, fromEnd + 1)}`;
}

function MatchCard({ match, isCompact }) {
  const isCompleted = match.status === 'completed';
  return (
    <div className={`bg-card border rounded-xl overflow-hidden shadow-sm ${isCompleted ? 'border-primary/30' : 'border-border'} ${isCompact ? 'text-xs' : 'text-sm'}`}>
      <div className={`flex items-center justify-between px-3 py-2 border-b border-border ${match.winner_id === match.player1_id && isCompleted ? 'bg-primary/5' : ''}`}>
        <span className={`font-medium truncate max-w-[120px] ${match.winner_id === match.player1_id && isCompleted ? 'text-primary' : 'text-foreground'}`}>
          {match.player1_name || 'TBD'}
        </span>
        {match.winner_id === match.player1_id && isCompleted && (
          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />
        )}
      </div>
      <div className={`flex items-center justify-between px-3 py-2 ${match.winner_id === match.player2_id && isCompleted ? 'bg-primary/5' : ''}`}>
        <span className={`font-medium truncate max-w-[120px] ${match.winner_id === match.player2_id && isCompleted ? 'text-primary' : 'text-foreground'}`}>
          {match.player2_name || 'TBD'}
        </span>
        {match.winner_id === match.player2_id && isCompleted && (
          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />
        )}
      </div>
      {match.score && (
        <div className="px-3 py-1 bg-secondary/50 text-xs text-muted-foreground text-right">{match.score}</div>
      )}
    </div>
  );
}

export default function BracketView({ matches, players, tournament }) {
  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
  const totalRounds = rounds.length;
  const isCompact = totalRounds >= 5;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {rounds.map(round => {
          const roundMatches = matches.filter(m => m.round === round).sort((a, b) => a.match_index - b.match_index);
          const roundName = getRoundName(round, totalRounds);
          return (
            <div key={round} className="flex flex-col" style={{ minWidth: isCompact ? 160 : 200 }}>
              <div className="text-center mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {roundName}
                </span>
              </div>
              <div className="flex flex-col justify-around flex-1 gap-2">
                {roundMatches.map(match => (
                  <MatchCard key={match.id} match={match} isCompact={isCompact} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}