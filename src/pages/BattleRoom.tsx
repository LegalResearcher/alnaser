/**
 * Alnasser Tech — BattleRoom V2
 * غرفة المنافسة الشاملة: فرق، تحكم منشئ، تحليلات، سجل، نتائج احترافية
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Swords, Crown, Medal, Trophy, Clock, Users, Play, Copy, Check,
  Loader2, ChevronLeft, Flame, Target, CheckCircle2, XCircle,
  Share2, RotateCcw, Star, Zap, AlertCircle, Lock, UserX,
  TimerReset, BarChart3, Users2, Shield, Sparkles, ChevronRight,
  Award, Wifi, WifiOff
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
  expires_at: string; is_private: boolean; password?: string;
  allow_teams: boolean; team1_name: string; team2_name: string;
  locked: boolean; extra_time_minutes: number; question_type: string;
  subjects?: { name: string };
}

interface BattlePlayer {
  id: string; room_id: string; player_name: string; is_creator: boolean;
  status: 'waiting' | 'playing' | 'finished';
  score: number; total_answered: number; correct_count: number;
  percentage: number; time_seconds: number | null; progress: number;
  joined_at: string; finished_at: string | null;
  team: string | null; kicked: boolean; avatar_color: string;
  answers_json: Record<string, string>;
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

const AVATAR_COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6',
  '#f97316','#06b6d4','#84cc16','#a855f7'
];

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-black text-slate-400">{rank}</span>;
};

const getTeamColor = (team: string | null) => {
  if (team === 'team1') return { bg: 'bg-blue-500/10', border: 'border-blue-400/30', text: 'text-blue-600', badge: 'bg-blue-500' };
  if (team === 'team2') return { bg: 'bg-rose-500/10', border: 'border-rose-400/30', text: 'text-rose-600', badge: 'bg-rose-500' };
  return { bg: '', border: '', text: '', badge: 'bg-slate-400' };
};

// ── Welcome Toast Component ──────────────────────
const WelcomeOverlay = ({ name, onDone }: { name: string; onDone: () => void }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="text-center space-y-4 px-8 animate-in zoom-in-50 duration-500">
        <div className="text-7xl mb-2">🎉</div>
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-[2rem] px-10 py-6 shadow-2xl">
          <p className="text-xl font-black mb-1">مرحباً بك</p>
          <p className="text-3xl font-black">{name}</p>
          <p className="text-sm font-bold mt-2 opacity-90">انضممت للغرفة بنجاح! 🏆</p>
        </div>
        <div className="flex justify-center gap-1">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{animationDelay:`${i*0.1}s`}} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Player Card ──────────────────────────────────────
function PlayerCard({ player, rank, isMe, isCreator: iAmCreator, onKick, teamName }: {
  player: BattlePlayer; rank: number; isMe: boolean;
  isCreator: boolean; onKick?: (id: string) => void; teamName?: string;
}) {
  const pct = player.percentage || 0;
  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  const tc = getTeamColor(player.team);

  return (
    <div className={cn(
      'rounded-2xl border-2 p-4 transition-all',
      isMe ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-border bg-card',
      rank === 1 && 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20',
      player.team && tc.bg, player.team && tc.border
    )}>
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md"
            style={{ backgroundColor: player.avatar_color || '#6366f1' }}>
            {player.player_name.charAt(0)}
          </div>
          {rank <= 3 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-card border border-border flex items-center justify-center shadow">
              {rankIcon(rank)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-black text-sm truncate">{player.player_name}</p>
            {player.is_creator && <span className="text-[9px] font-black bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full">👑 منشئ</span>}
            {isMe && <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full">أنت</span>}
            {teamName && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{backgroundColor: player.team === 'team1' ? '#3b82f6' : '#ef4444'}}>{teamName}</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {player.status === 'finished' ? (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> أنهى · {player.total_answered}/{player.total_answered} سؤال
              </span>
            ) : player.status === 'playing' ? (
              <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">
                <Zap className="w-3 h-3 animate-pulse" /> يجيب... ({player.total_answered} أجاب)
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold">ينتظر البدء</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('font-black text-xl', pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-500' : 'text-rose-500')}>
            {player.status === 'waiting' ? '—' : `${Math.round(pct)}%`}
          </span>
          {iAmCreator && !isMe && !player.kicked && (
            <button onClick={() => onKick?.(player.id)}
              className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center justify-center hover:bg-rose-100 transition-colors"
              title="طرد اللاعب">
              <UserX className="w-3.5 h-3.5 text-rose-500" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', barColor)}
          style={{ width: `${player.progress || 0}%` }} />
      </div>

      {/* Stats */}
      {player.status !== 'waiting' && (
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          {[
            { icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" />, val: player.correct_count, label: 'صحيح', color: 'text-emerald-600' },
            { icon: <XCircle className="w-3 h-3 text-rose-500" />, val: player.total_answered - player.correct_count, label: 'خطأ', color: 'text-rose-600' },
            { icon: <Clock className="w-3 h-3 text-blue-500" />, val: player.time_seconds ? `${Math.floor(player.time_seconds / 60)}:${(player.time_seconds % 60).toString().padStart(2, '0')}` : '—', label: 'وقت', color: 'text-blue-600' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-1.5">
              <div className="flex items-center justify-center gap-0.5">{s.icon}<span className={cn('text-xs font-black', s.color)}>{s.val}</span></div>
              <p className="text-[9px] text-slate-400 font-semibold">{s.label}</p>
            </div>
          ))}
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
  const [joinPassword, setJoinPassword] = useState('');
  const [myPlayer, setMyPlayer] = useState<BattlePlayer | null>(null);
  const [isJoined, setIsJoined] = useState(!!locationState?.playerName);
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2'>('team1');
  const [kickedOut, setKickedOut] = useState(false);

  // Exam state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
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
        setTimeLeft((data.time_minutes + (data.extra_time_minutes || 0)) * 60);
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
        if (me) {
          setMyPlayer(me);
          if (me.kicked && !kickedOut) { setKickedOut(true); }
        }
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
    const channel = supabase.channel(`battle-room-v2-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_players', filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const p = payload.new as BattlePlayer;
            setPlayers(prev => [...prev, p]);
            if (p.player_name !== myName) {
              toast({ title: `👋 ${p.player_name} انضم للغرفة!` });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as BattlePlayer;
            setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p)
              .sort((a, b) => b.percentage - a.percentage));
            if (updated.id === myPlayerId.current) {
              setMyPlayer(updated);
              if (updated.kicked && !kickedOut) {
                setKickedOut(true);
                toast({ title: '⛔ تم طردك من الغرفة!', variant: 'destructive' });
              }
            }
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: `id=eq.${room.id}` },
        async (payload) => {
          const updated = payload.new as any;
          setRoom(prev => prev ? { ...prev, ...updated } : prev);
          if (updated.status === 'active' && !examStarted) {
            await loadQuestions(updated.question_ids as string[]);
            setTimeLeft((updated.time_minutes + (updated.extra_time_minutes || 0)) * 60);
            setExamStarted(true);
            toast({ title: '🚀 انطلقت المنافسة!' });
          }
          if (updated.status === 'finished') setExamFinished(true);
          // Extra time added
          if (updated.extra_time_minutes > (room?.extra_time_minutes || 0)) {
            const added = (updated.extra_time_minutes - (room?.extra_time_minutes || 0)) * 60;
            setTimeLeft(prev => prev + added);
            toast({ title: `⏱ تمت إضافة ${updated.extra_time_minutes - (room?.extra_time_minutes || 0)} دقيقة للوقت!` });
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id, myName, examStarted, kickedOut]);

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

  // ── Join ──
  const handleJoin = async () => {
    const name = joinName.trim() || myName.trim();
    if (!name || !room) return;
    if (room.locked) { toast({ title: '🔒 الغرفة مغلقة، لا يمكن الانضمام بعد البدء', variant: 'destructive' }); return; }
    if (room.is_private && joinPassword.trim() !== room.password) {
      toast({ title: '🔑 كلمة المرور غير صحيحة', variant: 'destructive' }); return;
    }
    if (players.filter(p => !p.kicked).length >= room.max_players) {
      toast({ title: '⚠️ الغرفة ممتلئة!', variant: 'destructive' }); return;
    }
    if (players.some(p => p.player_name === name && !p.kicked)) {
      toast({ title: '⚠️ هذا الاسم مستخدم بالفعل', variant: 'destructive' }); return;
    }
    if (room.status === 'active') {
      toast({ title: '⛔ الاختبار بدأ بالفعل، لا يمكن الانضمام', variant: 'destructive' }); return;
    }

    setJoining(true);
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const { data } = await (supabase.from('battle_players' as any) as any).insert({
      room_id: room.id, player_name: name, is_creator: false, status: 'waiting',
      avatar_color: avatarColor,
      team: room.allow_teams ? selectedTeam : null,
    }).select().single();
    if (data) {
      myPlayerId.current = data.id;
      setMyPlayer(data);
      setMyName(name);
      setIsJoined(true);
      setShowWelcome(true);
      localStorage.setItem('alnaseer_student_name', name);
    }
    setJoining(false);
  };

  // ── Creator controls ──
  const handleStartRoom = async () => {
    if (!room) return;
    setStarting(true);
    await (supabase.from('battle_rooms' as any) as any).update({
      status: 'active', started_at: new Date().toISOString(), locked: true,
    }).eq('id', room.id);
    if (myPlayerId.current) {
      await (supabase.from('battle_players' as any) as any).update({ status: 'playing' }).eq('id', myPlayerId.current);
    }
    await loadQuestions(room.question_ids);
    setTimeLeft((room.time_minutes + (room.extra_time_minutes || 0)) * 60);
    setExamStarted(true);
    setStarting(false);
  };

  const handleKickPlayer = async (playerId: string) => {
    await (supabase.from('battle_players' as any) as any).update({ kicked: true, status: 'finished' }).eq('id', playerId);
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    toast({ title: '✅ تم طرد اللاعب من الغرفة' });
  };

  const handleAddTime = async (minutes: number) => {
    if (!room) return;
    const newExtra = (room.extra_time_minutes || 0) + minutes;
    await (supabase.from('battle_rooms' as any) as any).update({ extra_time_minutes: newExtra }).eq('id', room.id);
    toast({ title: `✅ تمت إضافة ${minutes} دقيقة للوقت` });
  };

  const handleForceFinish = async () => {
    if (!room) return;
    await (supabase.from('battle_rooms' as any) as any).update({
      status: 'finished', finished_at: new Date().toISOString()
    }).eq('id', room.id);
  };

  // ── Exam ──
  const updateProgress = async (correct: number, total: number, answered: number, answersJson: Record<string, string>) => {
    if (!myPlayerId.current || !room) return;
    const pct = room.questions_count > 0 ? (correct / room.questions_count) * 100 : 0;
    const progress = (answered / room.questions_count) * 100;
    await (supabase.from('battle_players' as any) as any).update({
      correct_count: correct, total_answered: answered,
      score: correct, percentage: pct, progress,
      answers_json: answersJson,
      status: answered >= room.questions_count ? 'finished' : 'playing',
    }).eq('id', myPlayerId.current);
  };

  const handleAnswer = async (option: string) => {
    if (selectedAnswer || !questions[currentQ]) return;
    setSelectedAnswer(option);
    setShowFeedback(true);

    const q = questions[currentQ];
    const newAnswers = { ...answers, [q.id]: option };
    setAnswers(newAnswers);

    const correctCount = Object.keys(newAnswers).filter(id => {
      const qObj = questions.find(q => q.id === id);
      return qObj && newAnswers[id] === qObj.correct_option;
    }).length;

    await updateProgress(correctCount, questions.length, currentQ + 1, newAnswers);

    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        handleFinishExam(correctCount, currentQ + 1, newAnswers);
      } else {
        setCurrentQ(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    }, 900);
  };

  const handleFinishExam = async (finalCorrect?: number, finalTotal?: number, finalAnswers?: Record<string, string>) => {
    if (examFinished || !myPlayerId.current || !room) return;
    clearInterval(timerRef.current!);
    setExamFinished(true);

    const elapsed = (room.time_minutes + (room.extra_time_minutes || 0)) * 60 - timeLeft;
    const usedAnswers = finalAnswers || answers;
    const correct = finalCorrect ?? Object.keys(usedAnswers).filter(id => {
      const q = questions.find(q => q.id === id); return q && usedAnswers[id] === q.correct_option;
    }).length;
    const total = finalTotal ?? Object.keys(usedAnswers).length;
    const pct = room.questions_count > 0 ? (correct / room.questions_count) * 100 : 0;

    await (supabase.from('battle_players' as any) as any).update({
      status: 'finished', correct_count: correct, total_answered: total,
      score: correct, percentage: pct, progress: 100,
      time_seconds: elapsed, finished_at: new Date().toISOString(),
      answers_json: usedAnswers,
    }).eq('id', myPlayerId.current);

    // Update leaderboard
    try {
      const { data: existing } = await (supabase.from('battle_leaderboard' as any) as any)
        .select('*').eq('player_name', myName).maybeSingle();
      const isWinner = players[0]?.player_name === myName;
      if (existing) {
        await (supabase.from('battle_leaderboard' as any) as any).update({
          total_games: (existing.total_games || 0) + 1,
          total_wins: isWinner ? (existing.total_wins || 0) + 1 : existing.total_wins,
          total_score: (existing.total_score || 0) + correct,
          best_pct: Math.max(existing.best_pct || 0, pct),
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await (supabase.from('battle_leaderboard' as any) as any).insert({
          player_name: myName, total_games: 1, total_wins: isWinner ? 1 : 0,
          total_score: correct, best_pct: pct,
        });
      }
    } catch (_) {}

    const { data: allP } = await (supabase.from('battle_players' as any) as any)
      .select('status, kicked').eq('room_id', room.id);
    const activePlayers = allP?.filter((p: any) => !p.kicked);
    const allDone = activePlayers?.every((p: any) => p.status === 'finished');
    if (allDone) {
      await (supabase.from('battle_rooms' as any) as any).update({
        status: 'finished', finished_at: new Date().toISOString(),
      }).eq('id', room.id);
    }
  };

  const handleShare = () => {
    const me = myPlayer;
    if (!me || !room) return;
    const rank = sortedPlayers.findIndex(p => p.id === me.id) + 1;
    const text = `🏆 حصلت على المركز ${rank} في ${(room as any).subjects?.name} على منصة الناصر!\nنتيجتي: ${Math.round(me.percentage)}% ✅ (${me.correct_count}/${room.questions_count})\n\n🎯 انضم للتحدي: ${window.location.origin}/battle/${room.code}`;
    if (navigator.share) navigator.share({ text });
    else { navigator.clipboard.writeText(text); toast({ title: '✅ تم نسخ النتيجة!' }); }
  };

  // ── Analytics ──
  const getQuestionAnalytics = () => {
    if (!questions.length || !players.length) return [];
    return questions.map((q, i) => {
      const responses = players.filter(p => p.answers_json && p.answers_json[q.id]);
      const correct = responses.filter(p => p.answers_json[q.id] === q.correct_option).length;
      const errorRate = responses.length > 0 ? ((responses.length - correct) / responses.length) * 100 : 0;
      return { q, index: i + 1, total: responses.length, correct, errorRate };
    }).sort((a, b) => b.errorRate - a.errorRate);
  };

  // ── Kicked ──
  if (kickedOut) return (
    <MainLayout>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4 px-6">
          <div className="text-7xl">⛔</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">تم طردك من الغرفة</h2>
          <p className="text-slate-500 font-bold">قام منشئ الغرفة بطردك من المنافسة</p>
          <Button onClick={() => navigate('/battle/create')} className="rounded-2xl font-black bg-gradient-to-l from-amber-500 to-orange-600 text-white">
            إنشاء غرفة جديدة
          </Button>
        </div>
      </div>
    </MainLayout>
  );

  if (loading) return (
    <MainLayout><div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-sm font-bold text-slate-400">جارٍ تحميل الغرفة...</p>
      </div>
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

  const activePlayers = players.filter(p => !p.kicked);
  const sortedPlayers = [...activePlayers].sort((a, b) =>
    b.percentage - a.percentage || (a.time_seconds || 9999) - (b.time_seconds || 9999));
  const myRank = sortedPlayers.findIndex(p => p.id === myPlayerId.current) + 1;
  const isCreator = myPlayer?.is_creator;
  const subjectName = (room as any).subjects?.name || '';
  const team1Players = sortedPlayers.filter(p => p.team === 'team1');
  const team2Players = sortedPlayers.filter(p => p.team === 'team2');
  const team1Score = team1Players.reduce((s, p) => s + p.correct_count, 0);
  const team2Score = team2Players.reduce((s, p) => s + p.correct_count, 0);

  // ── EXAM VIEW ──
  if (examStarted && !examFinished && questions.length > 0) {
    const q = questions[currentQ];
    const options = [
      { key: 'A', label: 'أ', text: q.option_a },
      { key: 'B', label: 'ب', text: q.option_b },
      { key: 'C', label: 'ج', text: q.option_c },
      { key: 'D', label: 'د', text: q.option_d },
    ].filter(o => o.text);

    const progressPct = ((currentQ) / questions.length) * 100;
    const urgentTime = timeLeft < 60;

    return (
      <MainLayout>
        <section className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-4" dir="rtl">
          <div className="container mx-auto px-4 max-w-lg">

            {/* Top bar */}
            <div className={cn("flex items-center justify-between mb-4 rounded-2xl px-4 py-3 border shadow-sm transition-all",
              urgentTime ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800' : 'bg-white dark:bg-card border-border')}>
              <div className="flex flex-col items-start">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">سؤال</span>
                <span className="text-sm font-black">{currentQ + 1} / {questions.length}</span>
              </div>
              <div className={cn('flex items-center gap-1.5 font-black text-2xl tabular-nums transition-all',
                urgentTime ? 'text-rose-500 animate-pulse scale-110' : 'text-slate-700 dark:text-white')}>
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ترتيبك</span>
                <span className="text-sm font-black flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />#{myRank || '—'}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-l from-amber-500 to-orange-600 transition-all duration-700"
                style={{ width: `${progressPct}%` }} />
            </div>

            {/* Live leaderboard */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border p-3 mb-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المتسابقون الآن</p>
              </div>
              <div className="space-y-1.5">
                {sortedPlayers.slice(0, 6).map((p, i) => (
                  <div key={p.id} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-bold transition-all',
                    p.id === myPlayerId.current ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300')}>
                    <span className="w-4 text-center font-black text-slate-400">{i + 1}</span>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black shrink-0"
                      style={{ backgroundColor: p.avatar_color || '#6366f1' }}>
                      {p.player_name.charAt(0)}
                    </div>
                    <span className="flex-1 truncate">{p.player_name}</span>
                    <span className="text-[10px] font-bold text-slate-400">{p.total_answered} أجاب</span>
                    <div className="w-14 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question */}
            <div className="bg-white dark:bg-card rounded-2xl border-2 border-border p-6 shadow-sm mb-4 relative overflow-hidden">
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
                {currentQ + 1}
              </div>
              <p className="font-black text-slate-900 dark:text-white text-lg leading-relaxed text-right mt-2">{q.question_text}</p>
            </div>

            {/* Options */}
            <div className="space-y-3 pb-6">
              {options.map(opt => {
                const isSelected = selectedAnswer === opt.key;
                const isCorrect = opt.key === q.correct_option;
                let style = 'bg-white dark:bg-card border-border hover:border-primary hover:bg-primary/5 hover:shadow-md';
                if (showFeedback) {
                  if (isCorrect) style = 'bg-emerald-50 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700 shadow-emerald-100';
                  else if (isSelected) style = 'bg-rose-50 border-rose-400 dark:bg-rose-950/30 dark:border-rose-700';
                } else if (isSelected) style = 'bg-primary/10 border-primary shadow-md';

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

            {/* Creator controls during exam */}
            {isCreator && (
              <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-50">
                <button onClick={() => handleAddTime(5)}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-black px-3 py-2 rounded-xl shadow-lg hover:bg-indigo-700 transition-colors">
                  <TimerReset className="w-3.5 h-3.5" /> +5 دقائق
                </button>
                <button onClick={handleForceFinish}
                  className="flex items-center gap-1.5 bg-rose-600 text-white text-xs font-black px-3 py-2 rounded-xl shadow-lg hover:bg-rose-700 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> إنهاء
                </button>
              </div>
            )}
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
    const analytics = getQuestionAnalytics();

    // Teams result
    const teamsMode = room.allow_teams;
    const winningTeam = team1Score > team2Score ? 'team1' : team2Score > team1Score ? 'team2' : 'draw';

    return (
      <MainLayout>
        <section className="min-h-[calc(100vh-80px)] py-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir="rtl">
          <div className="container mx-auto px-4 max-w-lg space-y-4">

            {/* ── Main Result Card ── */}
            <div className={cn('rounded-[2rem] overflow-hidden shadow-2xl',
              isWinner
                ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500'
                : rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-600'
                : rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                : 'bg-gradient-to-br from-slate-700 to-slate-900')}>
              <div className="relative p-8 text-center text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize:'20px 20px'}} />
                {isWinner && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />}
                <div className="relative z-10">
                  <div className="text-6xl mb-3">
                    {isWinner ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎯'}
                  </div>
                  {isWinner && (
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-white text-white" style={{animationDelay:`${i*0.1}s`}} />)}
                    </div>
                  )}
                  <p className="text-sm font-black opacity-80 mb-1">المركز {rank} من {sortedPlayers.length}</p>
                  <p className="text-6xl font-black">{me ? `${Math.round(me.percentage)}%` : '—'}</p>
                  <p className="text-sm font-bold opacity-70 mt-1">{subjectName}</p>
                  {isWinner && (
                    <div className="mt-3 bg-white/20 backdrop-blur rounded-2xl px-6 py-2 inline-block">
                      <p className="font-black text-sm">🎉 أنت الفائز! تهانينا {myName}!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* My stats */}
            {me && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, val: me.correct_count, label: 'صحيح', color: 'text-emerald-600' },
                  { icon: <XCircle className="w-4 h-4 text-rose-500" />, val: me.total_answered - me.correct_count, label: 'خطأ', color: 'text-rose-600' },
                  { icon: <Clock className="w-4 h-4 text-blue-500" />, val: me.time_seconds ? formatTime(me.time_seconds) : '—', label: 'وقتي', color: 'text-blue-600' },
                ].map((s, i) => (
                  <div key={i} className="bg-white dark:bg-card rounded-2xl border border-border p-4 text-center shadow-sm">
                    <div className="flex justify-center mb-1">{s.icon}</div>
                    <p className={cn('font-black text-xl', s.color)}>{s.val}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── TEAMS RESULT ── */}
            {teamsMode && (
              <div className="bg-white dark:bg-card rounded-[1.5rem] border border-border overflow-hidden shadow-lg">
                <div className="px-5 py-4 bg-gradient-to-l from-slate-900 to-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-amber-400" />
                    <h2 className="font-black text-white text-sm">نتيجة الفرق</h2>
                  </div>
                  {winningTeam !== 'draw' && (
                    <span className="text-xs font-black bg-amber-500 text-white px-3 py-1 rounded-full">
                      🏆 {winningTeam === 'team1' ? room.team1_name : room.team2_name} فاز!
                    </span>
                  )}
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {/* Team 1 */}
                  <div className={cn('rounded-2xl border-2 p-3', winningTeam === 'team1' ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20' : 'border-blue-200 dark:border-blue-800')}>
                    <div className="text-center mb-3">
                      <p className="font-black text-blue-600 text-sm">{room.team1_name}</p>
                      <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{team1Score}</p>
                      <p className="text-[10px] text-slate-400 font-bold">نقطة</p>
                    </div>
                    <div className="space-y-1.5">
                      {team1Players.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-1.5 text-xs">
                          <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[8px] font-black"
                            style={{backgroundColor: p.avatar_color || '#3b82f6'}}>
                            {p.player_name.charAt(0)}
                          </div>
                          <span className="flex-1 truncate font-bold text-slate-700 dark:text-slate-300">{p.player_name}</span>
                          <span className="font-black text-blue-600">{Math.round(p.percentage)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Team 2 */}
                  <div className={cn('rounded-2xl border-2 p-3', winningTeam === 'team2' ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20' : 'border-rose-200 dark:border-rose-800')}>
                    <div className="text-center mb-3">
                      <p className="font-black text-rose-600 text-sm">{room.team2_name}</p>
                      <p className="text-3xl font-black text-rose-700 dark:text-rose-400">{team2Score}</p>
                      <p className="text-[10px] text-slate-400 font-bold">نقطة</p>
                    </div>
                    <div className="space-y-1.5">
                      {team2Players.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-1.5 text-xs">
                          <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[8px] font-black"
                            style={{backgroundColor: p.avatar_color || '#ef4444'}}>
                            {p.player_name.charAt(0)}
                          </div>
                          <span className="flex-1 truncate font-bold text-slate-700 dark:text-slate-300">{p.player_name}</span>
                          <span className="font-black text-rose-600">{Math.round(p.percentage)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Leaderboard ── */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h2 className="font-black text-sm">الترتيب النهائي</h2>
                </div>
                {/* Top 3 medal */}
                <div className="flex items-center gap-1">
                  {sortedPlayers.slice(0, 3).map((p, i) => (
                    <div key={p.id} title={p.player_name}
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-card -ml-1 flex items-center justify-center text-white text-[8px] font-black"
                      style={{backgroundColor: p.avatar_color || '#6366f1'}}>
                      {p.player_name.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 space-y-3">
                {sortedPlayers.map((p, i) => (
                  <PlayerCard
                    key={p.id} player={p} rank={i + 1}
                    isMe={p.id === myPlayerId.current}
                    isCreator={isCreator || false}
                    teamName={room.allow_teams ? (p.team === 'team1' ? room.team1_name : p.team === 'team2' ? room.team2_name : undefined) : undefined}
                  />
                ))}
              </div>
            </div>

            {/* ── Analytics ── */}
            {analytics.length > 0 && (
              <div className="bg-white dark:bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="w-full px-4 py-3 flex items-center justify-between border-b border-border hover:bg-slate-50 dark:hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <h2 className="font-black text-sm">تحليل الأسئلة</h2>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform", showAnalytics && "rotate-90")} />
                </button>
                {showAnalytics && (
                  <div className="p-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">أصعب الأسئلة (نسبة الخطأ)</p>
                    {analytics.slice(0, 5).map(item => (
                      <div key={item.q.id} className="rounded-xl border border-border p-3 space-y-1.5">
                        <div className="flex items-start gap-2 justify-between">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1 leading-snug">{item.q.question_text.slice(0, 80)}...</p>
                          <span className={cn('text-xs font-black shrink-0 px-2 py-0.5 rounded-lg',
                            item.errorRate >= 70 ? 'bg-rose-100 text-rose-600' : item.errorRate >= 40 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')}>
                            {Math.round(item.errorRate)}% خطأ
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-rose-500 transition-all" style={{width:`${item.errorRate}%`}} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">{item.correct}/{item.total} أجابوا صحيحاً</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pb-4">
              <Button onClick={handleShare} variant="outline" className="h-12 rounded-2xl font-black gap-2 border-2">
                <Share2 className="w-4 h-4" /> مشاركة
              </Button>
              <Button onClick={() => navigate('/battle/create')}
                className="h-12 rounded-2xl font-black gap-2 bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/50">
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
      {showWelcome && <WelcomeOverlay name={myName} onDone={() => setShowWelcome(false)} />}
      <section className="min-h-[calc(100vh-80px)] py-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir="rtl">
        <div className="container mx-auto px-4 max-w-lg space-y-4">

          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-primary transition-colors bg-white dark:bg-card border border-slate-200 rounded-xl px-4 py-2">
            <ChevronLeft className="w-4 h-4" /> رجوع
          </button>

          {/* Room header */}
          <div className="bg-white dark:bg-card rounded-[2rem] border border-slate-100 dark:border-border shadow-2xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-7 text-center overflow-hidden">
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle at 20% 80%, rgba(245,158,11,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 50%)'}} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-12 bg-amber-500/25 blur-2xl" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-2xl shadow-amber-500/30">
                  <Swords className="w-7 h-7 text-white" />
                </div>
                <div className="text-5xl font-black text-white font-mono tracking-[0.2em] mb-1">{room.code}</div>
                <p className="text-blue-300 text-xs font-bold">{subjectName}</p>
                <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs font-bold text-white/60"><Target className="w-3.5 h-3.5" />{room.questions_count} سؤال</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-white/60"><Clock className="w-3.5 h-3.5" />{room.time_minutes} دقيقة</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-white/60"><Users className="w-3.5 h-3.5" />{activePlayers.length}/{room.max_players}</span>
                  {room.is_private && <span className="flex items-center gap-1 text-xs font-bold text-amber-300"><Lock className="w-3.5 h-3.5" />خاصة</span>}
                  {room.allow_teams && <span className="flex items-center gap-1 text-xs font-bold text-indigo-300"><Users2 className="w-3.5 h-3.5" />فرق</span>}
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">

              {/* Join form */}
              {!isJoined && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-2xl border border-slate-100 dark:border-border">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">انضم للغرفة</p>
                  <Input placeholder="أدخل اسمك" value={joinName} onChange={e => setJoinName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    className="h-12 rounded-xl font-bold bg-white dark:bg-card text-right" />

                  {room.is_private && (
                    <Input placeholder="🔑 كلمة مرور الغرفة" value={joinPassword} onChange={e => setJoinPassword(e.target.value)}
                      className="h-11 rounded-xl font-bold bg-white dark:bg-card text-right" />
                  )}

                  {/* Team selection */}
                  {room.allow_teams && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اختر فريقك</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setSelectedTeam('team1')}
                          className={cn('p-3 rounded-xl border-2 font-black text-sm transition-all',
                            selectedTeam === 'team1' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600' : 'border-slate-200 dark:border-border text-slate-500')}>
                          🔵 {room.team1_name}
                        </button>
                        <button onClick={() => setSelectedTeam('team2')}
                          className={cn('p-3 rounded-xl border-2 font-black text-sm transition-all',
                            selectedTeam === 'team2' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600' : 'border-slate-200 dark:border-border text-slate-500')}>
                          🔴 {room.team2_name}
                        </button>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleJoin} disabled={joining || !joinName.trim() || room.status === 'active'}
                    className="w-full h-11 rounded-xl font-black bg-gradient-to-l from-amber-500 to-orange-600 text-white">
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      room.status === 'active' ? '⛔ الاختبار جارٍ' : 'انضم الآن 🚀'}
                  </Button>
                </div>
              )}

              {/* Players list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">المشاركون ({activePlayers.length}/{room.max_players})</p>
                  </div>
                  {room.allow_teams && (
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="text-blue-500">🔵 {team1Players.length}</span>
                      <span className="text-rose-500">🔴 {team2Players.length}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {activePlayers.map(p => (
                    <div key={p.id} className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border font-bold text-sm',
                      p.id === myPlayerId.current ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-50 dark:bg-muted border-border',
                      p.team === 'team1' && 'border-l-4 border-l-blue-500',
                      p.team === 'team2' && 'border-l-4 border-l-rose-500',
                    )}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm"
                        style={{ backgroundColor: p.avatar_color || '#6366f1' }}>
                        {p.player_name.charAt(0)}
                      </div>
                      <span className="flex-1">{p.player_name}</span>
                      <div className="flex items-center gap-1.5">
                        {p.is_creator && <span className="text-[9px] font-black bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full">👑 منشئ</span>}
                        {p.id === myPlayerId.current && <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full">أنت</span>}
                        {room.allow_teams && p.team && (
                          <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-full"
                            style={{backgroundColor: p.team === 'team1' ? '#3b82f6' : '#ef4444'}}>
                            {p.team === 'team1' ? room.team1_name : room.team2_name}
                          </span>
                        )}
                        {isCreator && !p.is_creator && (
                          <button onClick={() => handleKickPlayer(p.id)}
                            className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 flex items-center justify-center hover:bg-rose-100 transition-colors">
                            <UserX className="w-3 h-3 text-rose-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Empty slots */}
                  {Array.from({ length: Math.max(0, Math.min(room.max_players - activePlayers.length, 3)) }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-200 dark:border-border">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                      <span className="text-xs text-slate-300 font-bold">ينتظر...</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy link */}
              <Button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/battle/${room.code}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                variant="outline" className="w-full h-11 rounded-xl font-black gap-2 border-2">
                {copied ? <><Check className="w-4 h-4 text-emerald-500" /> تم النسخ!</> : <><Copy className="w-4 h-4" /> مشاركة رابط الغرفة</>}
              </Button>

              {/* Start button (creator) */}
              {isCreator && isJoined && (
                <Button onClick={handleStartRoom} disabled={starting || activePlayers.length < 2}
                  className="w-full h-14 rounded-xl font-black gap-2 bg-gradient-to-l from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50 text-base">
                  {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Play className="w-5 h-5" />
                      ابدأ المنافسة
                      {activePlayers.length < 2 && <span className="text-xs opacity-70">(تحتاج لاعبَين على الأقل)</span>}
                    </>
                  )}
                </Button>
              )}

              {/* Waiting message (non-creator) */}
              {!isCreator && isJoined && (
                <div className="flex items-center gap-2 justify-center py-4 bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{animationDelay:`${i*0.2}s`}} />)}
                  </div>
                  <p className="text-xs font-black text-amber-600">في انتظار المنشئ للبدء...</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-bold pb-2">
            تنتهي الغرفة في {new Date(room.expires_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </section>
    </MainLayout>
  );
};

export default BattleRoom;
