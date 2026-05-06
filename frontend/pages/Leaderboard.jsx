import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2 } from 'lucide-react';

import { api } from '@/api/client';

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [predictions, user, users] = await Promise.all([
        api.entities.Prediction.list('-total_points'),
        api.auth.me().catch(() => null),
        api.entities.User.list(),
      ]);

      setCurrentUser(user);

      const userMap = {};
      users.forEach((entry) => {
        userMap[entry.email] = entry.full_name || entry.email;
      });

      const aggregated = {};
      predictions.forEach((prediction) => {
        if (!aggregated[prediction.user_email]) {
          aggregated[prediction.user_email] = {
            email: prediction.user_email,
            name: userMap[prediction.user_email] || prediction.user_email,
            total: 0,
            tournaments: 0,
          };
        }

        aggregated[prediction.user_email].total += prediction.total_points || 0;
        aggregated[prediction.user_email].tournaments += 1;
      });

      const sorted = Object.values(aggregated).sort((a, b) => b.total - a.total);
      setEntries(sorted);
      setLoading(false);
    };

    load();
  }, []);

  const podiumLabels = ['1st', '2nd', '3rd'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-4xl text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Global rankings across all tournaments</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <p className="text-muted-foreground">No scored predictions yet. Check back after tournaments complete.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => {
            const isMe = currentUser?.email === entry.email;
            return (
              <motion.div
                key={entry.email}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-4 bg-card border rounded-2xl px-5 py-4 transition-all ${
                  isMe ? 'border-primary shadow-md shadow-primary/10' : 'border-border hover:border-primary/30'
                } ${i < 3 ? 'ring-1 ring-inset ' + (i === 0 ? 'ring-yellow-500/20' : i === 1 ? 'ring-gray-400/20' : 'ring-amber-600/20') : ''}`}
              >
                <div className="w-10 text-center">
                  {i < 3 ? (
                    <span className="font-display text-base text-muted-foreground">{podiumLabels[i]}</span>
                  ) : (
                    <span className="font-display text-xl text-muted-foreground">{i + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                      {entry.name}
                    </span>
                    {isMe && (
                      <span className="shrink-0 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">You</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entry.tournaments} tournament{entry.tournaments !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-display text-2xl text-primary">{entry.total}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
