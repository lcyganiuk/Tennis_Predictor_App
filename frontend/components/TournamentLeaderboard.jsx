import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2 } from 'lucide-react';

import { api } from '@/api/client';

export default function TournamentLeaderboard({ tournament, currentUser }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [predictions, users] = await Promise.all([
        api.entities.Prediction.filter({ tournament_id: tournament.id }),
        api.entities.User.list(),
      ]);

      const userMap = {};
      users.forEach((user) => {
        userMap[user.email] = user.full_name || user.email;
      });

      const sorted = predictions
        .map((prediction) => ({
          email: prediction.user_email,
          name: userMap[prediction.user_email] || prediction.user_email,
          points: prediction.total_points || 0,
        }))
        .sort((a, b) => b.points - a.points);

      setEntries(sorted);
      setLoading(false);
    };

    load();
  }, [tournament.id]);

  const podiumLabels = ['1st', '2nd', '3rd'];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-2xl">
        <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No predictions submitted yet for this tournament.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {entries.map((entry, i) => {
        const isMe = currentUser?.email === entry.email;
        return (
          <motion.div
            key={entry.email}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-4 bg-card border rounded-2xl px-5 py-4 ${
              isMe ? 'border-primary shadow-md shadow-primary/10' : 'border-border'
            } ${i < 3 ? 'ring-1 ring-inset ' + (i === 0 ? 'ring-yellow-500/20' : i === 1 ? 'ring-gray-400/20' : 'ring-amber-600/20') : ''}`}
          >
            <div className="w-10 text-center">
              {i < 3 ? (
                <span className="font-display text-base text-muted-foreground">{podiumLabels[i]}</span>
              ) : (
                <span className="font-display text-xl text-muted-foreground">{i + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className={`font-semibold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                {entry.name}
              </span>
              {isMe && (
                <span className="shrink-0 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">You</span>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-2xl text-primary">{entry.points}</div>
              <div className="text-xs text-muted-foreground">points</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
