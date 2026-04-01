/**
 * Alnasser Tech — BattleRoom
 * غرفة المنافسة: الانتظار + المنافسة المباشرة + النتائج
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Swords, Crown, Medal, Trophy, Clock, Users, Play, Copy, Check,
  Loader2, ChevronLeft, Flame, Target, CheckCircle2, XCircle,
  Share2, RotateCcw, Star, Zap, AlertCircle
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────
interface BattleRoom {
  id: string; code: string; subject_id: string; creator_name: string;
  status: 'waiting' | 'active' | 'finished';
  max_players: number; questions_count: number; time_minutes: number;
  question_ids: string[]; started_at: string | null; finished_at: string | null;
  expires_at: string;
  subjects?: { name: string };
}

interface BattlePlayer {
  id: string; room_id: string; player_name: string; is_creator: boolean;
  status: 'waiting' | 'playing' | 'finished';
  score: number; total_answered: number; correct_count: number;
  percentage: number; time_seconds: number | null; progress: number;
  joined_at: string; finished_at: string | null;
}

interface Question {
  id: string; question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-black text-slate-400">{rank}</span>;
};

// ── Player Card ──────────────────────────────────────
function PlayerCard({ player, rank, isMe }: { player: BattlePlayer; rank: number; isMe: boolean }) {
  const pct = player.percentage || 0;
  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className={cn(
      'rounded-2xl border p-4 transition-all',
      isMe ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-border bg-card',
      rank === 1 && 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20'
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-border flex items-center justify-center shrink-0 shadow-sm">
          {rankIcon(rank)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-black text-sm truncate">{player.player_name}</p>
            {player.is_creator && <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">منشئ</span>}
            {isMe && <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full">أنت</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {player.status === 'finished' ? (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> أنهى
              </span>
            ) : player.status === 'playing' ? (
              <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">
                <Zap className="w-3 h-3 animate-pulse" /> يجيب...
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold">ينتظر</span>
            )}
          </div>
        </div>
        <div className="text-left shrink-0">
          <span className={cn('font-black text-xl', pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-500' : 'text-rose-500')}>
            {player.status === 'waiting' ? '—' : `${Math.round(pct)}%`}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${player.progress || 0}%` }} />
      </div>

      {/* Stats */}
      {player.status !== 'waiting' && (
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-1.5">
            <div className="flex items-center justify-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="text-xs font-black text-emerald-600">{player.correct_count}</span>
            </div>
            <p className="text-[9px] text-slate-400 font-semibold">صحيح</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-1.5">
            <div className="flex items-center justify-center gap-0.5">
              <XCircle className="w-3 h-3 text-rose-500" />
              <span className="text-xs font-black text-rose-600">{player.total_answered - player.correct_count}</span>
            </div>
            <p className="text-[9px] text-slate-400 font-semibold">خطأ</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-1.5">
            <div className="flex items-center justify-center gap-0.5">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-black text-blue-600">
                {player.time_seconds ? `${Math.floor(player.time_seconds / 60)}د` : '—'}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-semibold">وقت</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────
const BattleRoom = () => {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const locationState = location.state as { playerName?: string; isCreator?: boolean } | null;

  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [players, setPlayers] = useState<BattlePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myName, setMyName] = useState(locationState?.playerName || localStorage.getItem('alnaseer_student_name') || '');
  const [joinName, setJoinName] = useState('');
  const [myPlayer, setMyPlayer] = useState<BattlePlayer | null>(null);
  const [isJoined, setIsJoined] = useState(!!locationState?.playerName);

  // Exam state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const myPlayerId = useRef<string | null>(null);

  // ── Fetch room ──
  const fetchRoom = useCallback(async () => {
    if (!code) return;
    const { data } = await (supabase.from('battle_rooms' as any) as any)
      .select('*, subjects(name)').eq('code', code).maybeSingle();
    if (data) {
      setRoom({ ...data, question_ids: data.question_ids as string[] });
      if (data.status === 'active' && !examStarted && isJoined) {
        loadQuestions(data.question_ids as string[]);
        setTimeLeft(data.time_minutes * 60);
      }
    }
  }, [code, examStarted, isJoined]);

  const fetchPlayers = useCallback(async () => {
    if (!room?.id) return;
    const { data } = await (supabase.from('battle_players' as any) as any)
      .select('*').eq('room_id', room.id).order('percentage', { ascending: false });
    if (data) {
      setPlayers(data);
      if (myPlayerId.current) {
        const me = data.find((p: BattlePlayer) => p.id === myPlayerId.current);
        if (me) setMyPlayer(me);
      }
    }
  }, [room?.id]);

  const loadQuestions = async (ids: string[]) => {
    const { data } = await supabase.from('questions').select('*').in('id', ids).eq('status', 'active');
    if (data) setQuestions(data.sort(() => Math.random() - 0.5) as Question[]);
  };

  // ── Initial load ──
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (!code) return;
      const { data } = await (supabase.from('battle_rooms' as any) as any)
        .select('*, subjects(name)').eq('code', code).maybeSingle();
      if (data) {
        const r = { ...data, question_ids: data.question_ids as string[] } as BattleRoom;
        setRoom(r);
        const { data: pData } = await (supabase.from('battle_players' as any) as any)
          .select('*').eq('room_id', data.id).order('percentage', { ascending: false });
        if (pData) setPlayers(pData);
        // If creator and came back
        if (locationState?.isCreator && locationState.playerName) {
          const me = pData?.find((p: BattlePlayer) => p.player_name === locationState.playerName && p.is_creator);
          if (me) { myPlayerId.current = me.id; setMyPlayer(me); }
        }
      }
      setLoading(false);
    };
    init();
  }, [code]);

  // ── Realtime ──
  useEffect(() => {
    if (!room?.id) return;
    const channel = supabase.channel(`battle-room-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_players', filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const p = payload.new as BattlePlayer;
            setPlayers(prev => [...prev, p]);
            if (p.player_name !== myName) toast({ title: `👋 ${p.player_name} انضم للغرفة!` });
          } else if (payload.eventType === 'UPDATE') {
            setPlayers(prev => prev.map(p => p.id === (payload.new as BattlePlayer).id ? payload.new as BattlePlayer : p)
              .sort((a, b) => b.percentage - a.percentage));
            if ((payload.new as BattlePlayer).id === myPlayerId.current) setMyPlayer(payload.new as BattlePlayer);
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: `id=eq.${room.id}` },
        async (payload) => {
          const updated = payload.new as any;
          setRoom(prev => prev ? { ...prev, status: updated.status, started_at: updated.started_at } : prev);
          if (updated.status === 'active' && !examStarted) {
            await loadQuestions(updated.question_ids as string[]);
            setTimeLeft(updated.time_minutes * 60);
            setExamStarted(true);
            toast({ title: '🚀 بدأ الاختبار!' });
          }
          if (updated.status === 'finished') setExamFinished(true);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id, myName, examStarted]);

  // ── Timer ──
  useEffect(() => {
    if (!examStarted || examFinished || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); handleFinishExam(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [examStarted, examFinished]);

  const handleJoin = async () => {
    const name = joinName.trim() || myName.trim();
    if (!name || !room) return;
    if (players.length >= room.max_players) { toast({ title: 'الغرفة ممتلئة!', variant: 'destructive' }); return; }
    if (players.some(p => p.player_name === name)) { toast({ title: 'هذا الاسم مستخدم بالفعل', variant: 'destructive' }); return; }

    setJoining(true);
    const { data } = await (supabase.from('battle_players' as any) as any).insert({
      room_id: room.id, player_name: name, is_creator: false, status: 'waiting',
    }).select().single();
    if (data) {
      myPlayerId.current = data.id;
      setMyPlayer(data);
      setMyName(name);
      setIsJoined(true);
      localStorage.setItem('alnaseer_student_name', name);
    }
    setJoining(false);
  };

  const handleStartRoom = async () => {
    if (!room) return;
    setStarting(true);
    await (supabase.from('battle_rooms' as any) as any).update({
      status: 'active', started_at: new Date().toISOString(),
    }).eq('id', room.id);
    // Update my status to playing
    if (myPlayerId.current) {
      await (supabase.from('battle_players' as any) as any).update({ status: 'playing' }).eq('id', myPlayerId.current);
    }
    await loadQuestions(room.question_ids);
    setTimeLeft(room.time_minutes * 60);
    setExamStarted(true);
    setStarting(false);
  };

  const updateProgress = async (correct: number, total: number, answered: number) => {
    if (!myPlayerId.current || !room) return;
    const pct = room.questions_count > 0 ? (correct / room.questions_count) * 100 : 0;
    const progress = (answered / room.questions_count) * 100;
    await (supabase.from('battle_players' as any) as any).update({
      correct_count: correct, total_answered: answered,
      score: correct, percentage: pct, progress,
      status: answered >= room.questions_count ? 'finished' : 'playing',
    }).eq('id', myPlayerId.current);
  };

  const handleAnswer = async (option: string) => {
    if (selectedAnswer || !questions[currentQ]) return;
    setSelectedAnswer(option);
    setShowFeedback(true);

    const q = questions[currentQ];
    const isCorrect = option === q.correct_option;
    const newAnswers = { ...answers, [q.id]: option };
    setAnswers(newAnswers);

    const correctCount = Object.keys(newAnswers).filter(id => {
      const qObj = questions.find(q => q.id === id);
      return qObj && newAnswers[id] === qObj.correct_option;
    }).length;

    await updateProgress(correctCount, questions.length, currentQ + 1);

    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        handleFinishExam(correctCount, currentQ + 1);
      } else {
        setCurrentQ(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    }, 800);
  };

  const handleFinishExam = async (finalCorrect?: number, finalTotal?: number) => {
    if (examFinished || !myPlayerId.current || !room) return;
    clearInterval(timerRef.current!);
    setExamFinished(true);

    const elapsed = room.time_minutes * 60 - timeLeft;
    const correct = finalCorrect ?? Object.keys(answers).filter(id => {
      const q = questions.find(q => q.id === id);
      return q && answers[id] === q.correct_option;
    }).length;
    const total = finalTotal ?? Object.keys(answers).length;
    const pct = room.questions_count > 0 ? (correct / room.questions_count) * 100 : 0;

    await (supabase.from('battle_players' as any) as any).update({
      status: 'finished', correct_count: correct, total_answered: total,
      score: correct, percentage: pct, progress: 100,
      time_seconds: elapsed, finished_at: new Date().toISOString(),
    }).eq('id', myPlayerId.current);

    // Check if all finished → end room
    const { data: allP } = await (supabase.from('battle_players' as any) as any)
      .select('status').eq('room_id', room.id);
    const allDone = allP?.every((p: any) => p.status === 'finished');
    if (allDone) {
      await (supabase.from('battle_rooms' as any) as any).update({
        status: 'finished', finished_at: new Date().toISOString(),
      }).eq('id', room.id);
    }
  };

  const handleShare = () => {
    const me = myPlayer;
    if (!me || !room) return;
    const rank = players.findIndex(p => p.id === me.id) + 1;
    const text = `🏆 حصلت على المركز ${rank} في اختبار ${(room as any).subjects?.name} على منصة الناصر!\nنتيجتي: ${Math.round(me.percentage)}% ✅\n\nانضم للتحدي: ${window.location.origin}/battle/${room.code}`;
    if (navigator.share) navigator.share({ text });
    else { navigator.clipboard.writeText(text); toast({ title: '✅ تم نسخ النتيجة!' }); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/battle/${room?.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <MainLayout><div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div></MainLayout>
  );

  if (!room) return (
    <MainLayout>
      <div className="container mx-auto px-4 py-24 text-center" dir="rtl">
        <AlertCircle className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-xl font-black text-muted-foreground mb-6">الغرفة غير موجودة أو انتهت صلاحيتها</p>
        <Button onClick={() => navigate('/battle/create')} className="rounded-2xl font-black">إنشاء غرفة جديدة</Button>
      </div>
    </MainLayout>
  );

  const sortedPlayers = [...players].sort((a, b) => b.percentage - a.percentage || (a.time_seconds || 999) - (b.time_seconds || 999));
  const myRank = sortedPlayers.findIndex(p => p.id === myPlayerId.current) + 1;
  const isCreator = myPlayer?.is_creator;
  const subjectName = (room as any).subjects?.name || '';

  // ── EXAM VIEW ──
  if (examStarted && !examFinished && questions.length > 0) {
    const q = questions[currentQ];
    const options = [
      { key: 'A', label: 'أ', text: q.option_a },
      { key: 'B', label: 'ب', text: q.option_b },
      { key: 'C', label: 'ج', text: q.option_c },
      { key: 'D', label: 'د', text: q.option_d },
    ].filter(o => o.text);

    return (
      <MainLayout>
        <section className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-muted/30 py-4" dir="rtl">
          <div className="container mx-auto px-4 max-w-lg">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-4 bg-white dark:bg-card rounded-2xl px-4 py-3 border border-border shadow-sm">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-slate-500">{currentQ + 1} / {questions.length}</span>
              </div>
              <div className={cn('flex items-center gap-1.5 font-black text-lg', timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-700 dark:text-white')}>
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black">#{myRank || '—'}</span>
              </div>
            </div>

            {/* Live leaderboard mini */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border p-3 mb-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ترتيب مباشر</p>
              </div>
              <div className="space-y-1.5">
                {sortedPlayers.slice(0, 5).map((p, i) => (
                  <div key={p.id} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-bold',
                    p.id === myPlayerId.current ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300')}>
                    <span className="w-4 text-center font-black">{i + 1}</span>
                    <span className="flex-1 truncate">{p.player_name}</span>
                    <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="w-8 text-left">{Math.round(p.percentage)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Question */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border p-6 shadow-sm mb-4">
              <p className="font-black text-slate-900 dark:text-white text-lg leading-relaxed text-right">{q.question_text}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {options.map(opt => {
                const isSelected = selectedAnswer === opt.key;
                const isCorrect = opt.key === q.correct_option;
                let style = 'bg-white dark:bg-card border-border hover:border-primary hover:bg-primary/5';
                if (showFeedback) {
                  if (isCorrect) style = 'bg-emerald-50 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700';
                  else if (isSelected) style = 'bg-rose-50 border-rose-400 dark:bg-rose-950/30 dark:border-rose-700';
                } else if (isSelected) style = 'bg-primary/10 border-primary';

                return (
                  <button key={opt.key} onClick={() => handleAnswer(opt.key)} disabled={!!selectedAnswer}
                    className={cn('w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-right font-bold', style)}>
                    <span className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black shrink-0">
                      {opt.label}
                    </span>
                    <span className="flex-1 text-sm leading-snug">{opt.text}</span>
                    {showFeedback && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {showFeedback && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </MainLayout>
    );
  }

  // ── RESULTS VIEW ──
  if (examFinished) {
    const me = sortedPlayers.find(p => p.id === myPlayerId.current);
    const rank = me ? sortedPlayers.indexOf(me) + 1 : 0;
    const winner = sortedPlayers[0];
    const isWinner = me?.id === winner?.id;

    return (
      <MainLayout>
        <section className="min-h-[calc(100vh-80px)] py-6" dir="rtl">
          <div className="container mx-auto px-4 max-w-lg space-y-4">

            {/* Result header */}
            <div className={cn('rounded-[2rem] p-8 text-center text-white',
              isWinner ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-slate-700 to-slate-900')}>
              <div className="text-5xl mb-3">{isWinner ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎯'}</div>
              <p className="text-sm font-black opacity-80 mb-1">المركز {rank} من {sortedPlayers.length}</p>
              <p className="text-5xl font-black">{me ? `${Math.round(me.percentage)}%` : '—'}</p>
              <p className="text-sm font-bold opacity-70 mt-1">{subjectName}</p>
              {isWinner && <p className="mt-3 text-sm font-black bg-white/20 rounded-full px-4 py-1 inline-block">🎉 أنت الفائز!</p>}
            </div>

            {/* My stats */}
            {me && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, val: me.correct_count, label: 'صحيح', color: 'text-emerald-600' },
                  { icon: <XCircle className="w-4 h-4 text-rose-500" />, val: me.total_answered - me.correct_count, label: 'خطأ', color: 'text-rose-600' },
                  { icon: <Clock className="w-4 h-4 text-blue-500" />, val: me.time_seconds ? `${Math.floor(me.time_seconds / 60)}:${(me.time_seconds % 60).toString().padStart(2, '0')}` : '—', label: 'الوقت', color: 'text-blue-600' },
                ].map((s, i) => (
                  <div key={i} className="bg-white dark:bg-card rounded-2xl border border-border p-4 text-center">
                    <div className="flex justify-center mb-1">{s.icon}</div>
                    <p className={cn('font-black text-xl', s.color)}>{s.val}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Leaderboard */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="font-black text-sm">الترتيب النهائي</h2>
              </div>
              <div className="p-4 space-y-3">
                {sortedPlayers.map((p, i) => (
                  <PlayerCard key={p.id} player={p} rank={i + 1} isMe={p.id === myPlayerId.current} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pb-4">
              <Button onClick={handleShare} variant="outline" className="h-12 rounded-2xl font-black gap-2">
                <Share2 className="w-4 h-4" /> مشاركة النتيجة
              </Button>
              <Button onClick={() => navigate('/battle/create')} className="h-12 rounded-2xl font-black gap-2 bg-gradient-to-l from-amber-500 to-orange-600 text-white">
                <RotateCcw className="w-4 h-4" /> غرفة جديدة
              </Button>
            </div>
          </div>
        </section>
      </MainLayout>
    );
  }

  // ── WAITING ROOM VIEW ──
  return (
    <MainLayout>
      <section className="min-h-[calc(100vh-80px)] py-6" dir="rtl">
        <div className="container mx-auto px-4 max-w-lg space-y-4">

          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-primary transition-colors bg-white dark:bg-card border border-slate-200 rounded-xl px-4 py-2">
            <ChevronLeft className="w-4 h-4" /> رجوع
          </button>

          {/* Room header */}
          <div className="bg-white dark:bg-card rounded-[2rem] border border-slate-100 dark:border-border shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-10 bg-amber-500/30 blur-xl" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Swords className="w-7 h-7 text-white" />
                </div>
                <div className="text-4xl font-black text-white font-mono tracking-[0.2em] mb-1">{room.code}</div>
                <p className="text-blue-300 text-xs font-bold">{subjectName}</p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-xs font-bold text-white/60"><Target className="w-3.5 h-3.5" />{room.questions_count} سؤال</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-white/60"><Clock className="w-3.5 h-3.5" />{room.time_minutes} دقيقة</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-white/60"><Users className="w-3.5 h-3.5" />{players.length}/{room.max_players}</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Join form - if not joined */}
              {!isJoined && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-2xl border border-slate-100 dark:border-border">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">انضم للغرفة</p>
                  <Input placeholder="أدخل اسمك" value={joinName} onChange={e => setJoinName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    className="h-12 rounded-xl font-bold bg-white dark:bg-card text-right" />
                  <Button onClick={handleJoin} disabled={joining || !joinName.trim()}
                    className="w-full h-11 rounded-xl font-black bg-gradient-to-l from-amber-500 to-orange-600 text-white">
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'انضم الآن'}
                  </Button>
                </div>
              )}

              {/* Players list */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">المشاركون ({players.length}/{room.max_players})</p>
                </div>
                <div className="space-y-2">
                  {players.map(p => (
                    <div key={p.id} className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border font-bold text-sm',
                      p.id === myPlayerId.current ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-50 dark:bg-muted border-border'
                    )}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {p.player_name.charAt(0)}
                      </div>
                      <span className="flex-1">{p.player_name}</span>
                      {p.is_creator && <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">منشئ</span>}
                      {p.id === myPlayerId.current && <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full">أنت</span>}
                    </div>
                  ))}
                  {/* Empty slots */}
                  {Array.from({ length: Math.max(0, room.max_players - players.length) }).slice(0, 3).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-200 dark:border-border">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                      <span className="text-xs text-slate-300 font-bold">ينتظر...</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <Button onClick={handleCopyLink} variant="outline" className="w-full h-11 rounded-xl font-black gap-2">
                {copied ? <><Check className="w-4 h-4 text-emerald-500" /> تم النسخ!</> : <><Copy className="w-4 h-4" /> مشاركة رابط الغرفة</>}
              </Button>

              {isCreator && isJoined && (
                <Button onClick={handleStartRoom} disabled={starting || players.length < 2}
                  className="w-full h-13 rounded-xl font-black gap-2 bg-gradient-to-l from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50 text-base">
                  {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5" /> ابدأ الاختبار ({players.length} لاعبين)</>}
                </Button>
              )}
              {!isCreator && isJoined && (
                <div className="flex items-center gap-2 justify-center py-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  <p className="text-xs font-black text-amber-600">في انتظار المنشئ للبدء...</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-bold pb-2">
            الغرفة صالحة حتى {new Date(room.expires_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </section>
    </MainLayout>
  );
};

export default BattleRoom;
