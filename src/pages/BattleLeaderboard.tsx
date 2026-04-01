/**
 * Alnasser Tech — BattleLeaderboard
 * لوحة الصدارة العالمية للمنافسات
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Crown, Medal, Star, Swords, ChevronLeft, Loader2, TrendingUp, Target, Zap } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const BADGES = [
  { key: 'first_win', label: 'أول فوز', icon: '🏆', color: 'bg-amber-100 text-amber-600' },
  { key: 'five_wins', label: '5 انتصارات', icon: '⭐', color: 'bg-blue-100 text-blue-600' },
  { key: 'perfect', label: 'مئة بالمئة', icon: '💯', color: 'bg-emerald-100 text-emerald-600' },
  { key: 'veteran', label: 'متمرس (10 مباريات)', icon: '🎖', color: 'bg-indigo-100 text-indigo-600' },
];

const AVATAR_COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6',
];

const BattleLeaderboard = () => {
  const navigate = useNavigate();

  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ['battle-leaderboard'],
    queryFn: async () => {
      const { data } = await (supabase.from('battle_leaderboard' as any) as any)
        .select('*').order('total_wins', { ascending: false }).order('best_pct', { ascending: false }).limit(50);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-sm font-black text-slate-500">#{rank}</span>;
  };

  const getAvatarColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  const getBadges = (player: any) => {
    const b = [];
    if (player.total_wins >= 1) b.push(BADGES[0]);
    if (player.total_wins >= 5) b.push(BADGES[1]);
    if (player.best_pct >= 100) b.push(BADGES[2]);
    if (player.total_games >= 10) b.push(BADGES[3]);
    return b;
  };

  return (
    <MainLayout>
      <section className="min-h-[calc(100vh-80px)] py-6" dir="rtl">
        <div className="container mx-auto px-4 max-w-lg">

          <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-primary transition-colors bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl px-4 py-2">
            <ChevronLeft className="w-4 h-4" /> رجوع
          </button>

          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-[2rem] p-8 text-center mb-6 overflow-hidden shadow-2xl">
            <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize:'24px 24px'}} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-amber-500/25 blur-3xl" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/30">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white">لوحة الصدارة العالمية</h1>
              <p className="text-blue-300 text-sm font-bold mt-1">أبطال منافسات الناصر</p>
            </div>
          </div>

          {/* Top 3 podium */}
          {leaders.length >= 3 && (
            <div className="flex items-end justify-center gap-3 mb-6">
              {/* 2nd */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg"
                  style={{ backgroundColor: getAvatarColor(leaders[1].player_name) }}>
                  {leaders[1].player_name.charAt(0)}
                </div>
                <p className="text-xs font-black text-center truncate w-full text-center">{leaders[1].player_name}</p>
                <div className="bg-slate-200 dark:bg-slate-700 w-full rounded-t-2xl h-20 flex flex-col items-center justify-center gap-1">
                  <Medal className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-black">{leaders[1].total_wins} 🏆</span>
                </div>
              </div>
              {/* 1st */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="relative">
                  <div className="w-18 h-18 w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center text-white text-2xl font-black shadow-xl ring-4 ring-amber-400 ring-offset-2"
                    style={{ backgroundColor: getAvatarColor(leaders[0].player_name) }}>
                    {leaders[0].player_name.charAt(0)}
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                </div>
                <p className="text-sm font-black text-center truncate w-full text-center text-amber-600">{leaders[0].player_name}</p>
                <div className="bg-gradient-to-b from-amber-400 to-orange-500 w-full rounded-t-2xl h-28 flex flex-col items-center justify-center gap-1 shadow-lg shadow-amber-200/50">
                  <Crown className="w-6 h-6 text-white" />
                  <span className="text-sm font-black text-white">{leaders[0].total_wins} 🏆</span>
                </div>
              </div>
              {/* 3rd */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg"
                  style={{ backgroundColor: getAvatarColor(leaders[2].player_name) }}>
                  {leaders[2].player_name.charAt(0)}
                </div>
                <p className="text-xs font-black text-center truncate w-full text-center">{leaders[2].player_name}</p>
                <div className="bg-amber-600/20 dark:bg-amber-800/30 w-full rounded-t-2xl h-14 flex flex-col items-center justify-center gap-1">
                  <Medal className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-black">{leaders[2].total_wins} 🏆</span>
                </div>
              </div>
            </div>
          )}

          {/* Full list */}
          <div className="bg-white dark:bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h2 className="font-black text-sm">قائمة الأبطال</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : leaders.length === 0 ? (
              <div className="text-center py-12">
                <Swords className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">لا توجد نتائج بعد</p>
                <p className="text-xs text-slate-400 mt-1">العب أول منافسة وكن الأول!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {leaders.map((player: any, i: number) => {
                  const badges = getBadges(player);
                  const winRate = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0;
                  return (
                    <div key={player.id} className={cn(
                      'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-muted/50',
                      i === 0 && 'bg-amber-50/50 dark:bg-amber-950/10'
                    )}>
                      <div className="w-8 flex items-center justify-center shrink-0">
                        {rankIcon(i + 1)}
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black shrink-0 shadow-sm"
                        style={{ backgroundColor: getAvatarColor(player.player_name) }}>
                        {player.player_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate">{player.player_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400">{player.total_games} مباراة</span>
                          <span className="text-[10px] font-bold text-emerald-600">{winRate}% فوز</span>
                          {badges.slice(0, 2).map(b => (
                            <span key={b.key} className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full', b.color)}>
                              {b.icon} {b.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="font-black text-sm text-amber-600">{player.total_wins} <Crown className="w-3 h-3 inline text-amber-500" /></p>
                        <p className="text-[10px] text-slate-400 font-bold">{Math.round(player.best_pct)}% أفضل</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pb-4">
            <Button onClick={() => navigate('/battle/create')}
              className="w-full h-13 rounded-2xl font-black gap-2 bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/50">
              <Swords className="w-5 h-5" /> ابدأ منافسة جديدة
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default BattleLeaderboard;
