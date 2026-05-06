import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchManager from './MatchManager';

export default function TournamentManage({ tournament, onBack }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('players');
  const [newPlayer, setNewPlayer] = useState({ name: '', nationality: '', ranking: '', seed: '' });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [playerData, matchData] = await Promise.all([
        api.entities.Player.filter({ tournament_id: tournament.id }),
        api.entities.Match.filter({ tournament_id: tournament.id }),
      ]);
      setPlayers(playerData.sort((a, b) => (a.bracket_position || 999) - (b.bracket_position || 999)));
      setMatches(matchData);
      setLoading(false);
    };

    load();
  }, [tournament.id]);

  const bracketGenerated = matches.length > 0;
  const atCapacity = players.length >= tournament.size;

  const addPlayer = async () => {
    if (!newPlayer.name.trim()) return;
    if (atCapacity) {
      toast.error(`Draw is full (${tournament.size} players max)`);
      return;
    }
    if (bracketGenerated) {
      toast.error('Cannot add players after bracket is generated');
      return;
    }

    const position = players.length + 1;
    const created = await api.entities.Player.create({
      ...newPlayer,
      ranking: newPlayer.ranking ? Number(newPlayer.ranking) : null,
      seed: newPlayer.seed ? Number(newPlayer.seed) : null,
      bracket_position: position,
      tournament_id: tournament.id,
      is_bye: false,
    });
    setPlayers((prev) => [...prev, created]);
    setNewPlayer({ name: '', nationality: '', ranking: '', seed: '' });
    toast.success('Player added');
  };

  const addBye = async () => {
    if (atCapacity) {
      toast.error(`Draw is full (${tournament.size} players max)`);
      return;
    }
    if (bracketGenerated) {
      toast.error('Cannot add players after bracket is generated');
      return;
    }

    const lastPlayer = players[players.length - 1];
    if (lastPlayer?.is_bye) {
      toast.error('Cannot place two BYEs in a row.');
      return;
    }

    const position = players.length + 1;
    const created = await api.entities.Player.create({
      name: 'BYE',
      bracket_position: position,
      tournament_id: tournament.id,
      is_bye: true,
    });
    setPlayers((prev) => [...prev, created]);
    toast.success('Bye added');
  };

  const removePlayer = async (id) => {
    await api.entities.Player.delete(id);
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  };

  const generateBracket = async () => {
    if (players.length !== tournament.size) {
      toast.error(`Need exactly ${tournament.size} players to generate bracket (have ${players.length})`);
      return;
    }

    setGenerating(true);

    for (const match of matches) {
      await api.entities.Match.delete(match.id);
    }

    const size = tournament.size;
    const totalRounds = Math.log2(size);
    const sortedPlayers = [...players].sort((a, b) => (a.bracket_position || 999) - (b.bracket_position || 999));

    const newMatches = [];
    const matchCount = size / 2;
    for (let i = 0; i < matchCount; i += 1) {
      const player1 = sortedPlayers[i * 2];
      const player2 = sortedPlayers[i * 2 + 1];
      const fromEnd = totalRounds - 1;
      const roundName =
        fromEnd === 0 ? 'Final' : fromEnd === 1 ? 'Semifinal' : fromEnd === 2 ? 'Quarterfinal' : `Round of ${2 ** (fromEnd + 1)}`;

      const created = await api.entities.Match.create({
        tournament_id: tournament.id,
        round: 1,
        round_name: roundName,
        match_index: i,
        player1_id: player1?.id || null,
        player2_id: player2?.id || null,
        player1_name: player1?.name || 'TBD',
        player2_name: player2?.name || 'TBD',
        status: 'scheduled',
      });
      newMatches.push(created);
    }

    for (let round = 2; round <= totalRounds; round += 1) {
      const fromEnd = totalRounds - round;
      const roundName =
        fromEnd === 0 ? 'Final' : fromEnd === 1 ? 'Semifinal' : fromEnd === 2 ? 'Quarterfinal' : `Round of ${2 ** (fromEnd + 1)}`;
      const count = 2 ** (totalRounds - round);

      for (let i = 0; i < count; i += 1) {
        const created = await api.entities.Match.create({
          tournament_id: tournament.id,
          round,
          round_name: roundName,
          match_index: i,
          player1_name: 'TBD',
          player2_name: 'TBD',
          status: 'scheduled',
        });
        newMatches.push(created);
      }
    }

    const firstRoundByes = newMatches.filter(
      (match) => match.round === 1 && (match.player1_name === 'BYE' || match.player2_name === 'BYE'),
    );

    for (const byeMatch of firstRoundByes) {
      const isPlayer2Bye = byeMatch.player2_name === 'BYE';
      const realId = isPlayer2Bye ? byeMatch.player1_id : byeMatch.player2_id;
      const realName = isPlayer2Bye ? byeMatch.player1_name : byeMatch.player2_name;
      const updated = await api.entities.Match.update(byeMatch.id, {
        winner_id: realId,
        winner_name: realName,
        status: 'completed',
      });
      const matchIndex = newMatches.findIndex((match) => match.id === byeMatch.id);
      if (matchIndex !== -1) newMatches[matchIndex] = updated;

      if (totalRounds >= 2) {
        const nextMatchIndex = Math.floor(byeMatch.match_index / 2);
        const isPlayer1Slot = byeMatch.match_index % 2 === 0;
        const nextMatch = newMatches.find((match) => match.round === 2 && match.match_index === nextMatchIndex);
        if (nextMatch) {
          const updateData = isPlayer1Slot
            ? { player1_id: realId, player1_name: realName }
            : { player2_id: realId, player2_name: realName };
          const updatedNext = await api.entities.Match.update(nextMatch.id, updateData);
          const nextIndex = newMatches.findIndex((match) => match.id === nextMatch.id);
          if (nextIndex !== -1) newMatches[nextIndex] = updatedNext;
        }
      }
    }

    setMatches(newMatches);
    toast.success(`Bracket generated.`);
    setGenerating(false);
    setTab('matches');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display text-3xl text-foreground">{tournament.name}</h1>
          <p className="text-muted-foreground text-sm">{tournament.size}-player bracket management</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="players">Players ({players.length})</TabsTrigger>
          <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          <div className="bg-card border border-border rounded-2xl p-5 mb-5">
            <h3 className="font-semibold mb-4">Add Player</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Name *</Label>
                <Input
                  className="mt-1"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Player name"
                />
              </div>
              <div>
                <Label className="text-xs">Nationality</Label>
                <Input
                  className="mt-1"
                  value={newPlayer.nationality}
                  onChange={(e) => setNewPlayer((prev) => ({ ...prev, nationality: e.target.value }))}
                  placeholder="e.g. ESP"
                  maxLength={3}
                />
              </div>
              <div>
                <Label className="text-xs">Ranking</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={newPlayer.ranking}
                  onChange={(e) => setNewPlayer((prev) => ({ ...prev, ranking: e.target.value }))}
                  placeholder="e.g. 1"
                />
              </div>
              <div>
                <Label className="text-xs">Seed</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={newPlayer.seed}
                  onChange={(e) => setNewPlayer((prev) => ({ ...prev, seed: e.target.value }))}
                  placeholder="e.g. 1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addPlayer} size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> Add Player
              </Button>
              <Button onClick={addBye} variant="outline" size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> Add Bye
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {players.length} / {tournament.size} slots filled
              {bracketGenerated && <span className="ml-2 text-primary font-medium">- Bracket generated</span>}
            </p>
            <Button
              onClick={generateBracket}
              disabled={generating || players.length !== tournament.size || bracketGenerated}
              variant="outline"
              className="gap-2"
              title={bracketGenerated ? 'Bracket already generated' : players.length !== tournament.size ? `Need ${tournament.size} players` : ''}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {bracketGenerated ? 'Bracket Generated' : 'Generate Bracket'}
            </Button>
          </div>

          <div className="space-y-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                <span className="text-xs text-muted-foreground w-6 text-right">{player.bracket_position}</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className={`font-medium text-sm ${player.is_bye ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                    {player.name}
                  </span>
                  {player.seed && (
                    <Badge variant="outline" className="text-xs">
                      S{player.seed}
                    </Badge>
                  )}
                  {player.nationality && <span className="text-xs text-muted-foreground">{player.nationality}</span>}
                  {player.ranking && <span className="text-xs text-muted-foreground">#{player.ranking}</span>}
                  {player.is_bye && (
                    <Badge variant="outline" className="text-xs">
                      BYE
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => removePlayer(player.id)}
                  disabled={bracketGenerated}
                  className={`transition-colors ${bracketGenerated ? 'opacity-30 cursor-not-allowed' : 'text-muted-foreground hover:text-destructive'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matches">
          <MatchManager tournament={tournament} matches={matches} setMatches={setMatches} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
