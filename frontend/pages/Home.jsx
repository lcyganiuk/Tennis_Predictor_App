import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap, Users, ChevronRight, Target } from 'lucide-react';

import { api } from '@/api/client';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const features = [
    { icon: Trophy, title: 'Predict Brackets', desc: 'Pick winners round by round and watch your predictions play out.' },
    { icon: Zap, title: 'Earn Points', desc: 'Exponential scoring: 1-2-4-8 points per correct pick per round.' },
    { icon: Users, title: 'Compete Globally', desc: 'Climb the leaderboard and challenge every player.' },
    { icon: Target, title: 'Track Results', desc: 'Real-time bracket updates as matches complete.' },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-primary/80 text-primary-foreground py-28 px-4">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">The Ultimate Prediction Game</span>
            </div>
            <h1 className="font-display text-6xl md:text-8xl mb-6 leading-none text-white">
              Tennis Tournament
              <br />
              Predictor
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Predict match winners, build your bracket, and compete against the world. Every correct pick earns you
              points - who will you back?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button
                  size="lg"
                  onClick={() => navigate('/tournaments')}
                  className="bg-primary hover:bg-primary/90 text-white gap-2 px-8 py-6 text-base"
                >
                  View Tournaments <ChevronRight className="w-5 h-5" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate('/register')}
                    className="bg-primary hover:bg-primary/90 text-white gap-2 px-8 py-6 text-base"
                  >
                    Get Started <ChevronRight className="w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-3">How It Works</h2>
          <p className="text-muted-foreground text-lg">Simple, competitive, and rewarding.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {!user && (
        <section className="py-20 px-4 text-center">
          <h2 className="font-display text-4xl text-foreground mb-4">Ready to Compete?</h2>
          <p className="text-muted-foreground mb-8">Create your account and start predicting today.</p>
          <Button size="lg" onClick={() => navigate('/register')} className="gap-2 px-10 py-6 text-base">
            Join Now <ChevronRight className="w-5 h-5" />
          </Button>
        </section>
      )}
    </div>
  );
}
