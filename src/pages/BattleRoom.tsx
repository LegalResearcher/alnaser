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
  Award, Wifi, WifiOff, Download, MessageCircle
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.jpg';

// ── Types ──────────────────────────────────────────
interface BattleRoom {
  id: string; code: string; subject_id: string; creator_name: string;
  status: 'waiting' | 'active' | 'finished';
  max_players: number; questions_count: number; time_minutes: number;
  question_ids: string[]; started_at: string | null; finished_at: string | null;
  expires_at: string; is_private: boolean; password?: string;
  allow_teams: boolean; team1_name: string; team2_name: string;
  locked: boolean; extra_time_minutes: number; question_type: string;
  time_per_question?: number;
  current_question_index?: number;
  current_phase?: 'question' | 'reveal';
  phase_started_at?: string | null;
  exam_year?: number | null;
  exam_form?: string | null;
  exam_form_name?: string | null;
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
  hint?: string | null;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isCreator: boolean;
  avatarColor: string;
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

// ── Chat Panel Component (self-contained scroll) ──────────
const ChatPanel = ({
  amCreator, chatMessages, chatDisabled, players, myName, myPlayer,
  chatInput, setChatInput, handleSendChat, handleToggleChat
}: {
  amCreator: boolean;
  chatMessages: ChatMessage[];
  chatDisabled: boolean;
  players: BattlePlayer[];
  myName: string;
  myPlayer: BattlePlayer | null;
  chatInput: string;
  setChatInput: (v: string) => void;
  handleSendChat: () => void;
  handleToggleChat: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl mb-4" style={{background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)',border:`1px solid ${chatDisabled ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.25)'}`}}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{background:'rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle className="w-4 h-4 text-indigo-400" />
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${chatDisabled ? 'bg-rose-500' : 'bg-emerald-400'}`} />
          </div>
          <span className="text-xs font-black text-white/80">دردشة المنافسة</span>
          {chatDisabled
            ? <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">موقوفة</span>
            : <span className="text-[10px] font-bold text-white/30">{players.filter(p=>!p.kicked).length} مشارك</span>
          }
        </div>
        <div className="flex items-center gap-2">
          {amCreator && (
            <button onClick={handleToggleChat}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black transition-all ${chatDisabled ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30' : 'bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30'}`}>
              {chatDisabled ? <><Zap className="w-3 h-3" /> تفعيل</> : <><Shield className="w-3 h-3" /> إيقاف</>}
            </button>
          )}
          {amCreator && (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
              <Crown className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] font-black text-amber-400">منشئ</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="overflow-y-auto px-3 py-2 space-y-2"
        style={{
          height: '180px',
          minHeight: '180px',
          maxHeight: '180px',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99,102,241,0.3) transparent'
        }}
      >
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-3 opacity-40">
            <MessageCircle className="w-4 h-4 text-white/30" />
            <span className="text-[11px] text-white/40 font-bold">كن أول من يبدأ المحادثة!</span>
          </div>
        ) : (
          chatMessages.map((msg, idx) => {
            const isMe = msg.sender === myName;
            const isLast4 = idx >= Math.max(0, chatMessages.length - 4);
            return (
              <div key={msg.id} className={cn('flex items-end gap-1.5 transition-all duration-300', isMe ? 'flex-row-reverse' : 'flex-row', !isLast4 && 'opacity-50')}>
                {!isMe && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-md ring-1 ring-white/10"
                    style={{backgroundColor: msg.avatarColor}}>
                    {msg.sender.charAt(0)}
                  </div>
                )}
                <div className={cn('flex flex-col gap-0.5 max-w-[78%]', isMe ? 'items-end' : 'items-start')}>
                  {!isMe && (
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[9px] font-black text-white/40">{msg.sender}</span>
                      {msg.isCreator && <span className="text-[8px] font-black bg-amber-500/20 text-amber-400 border border-amber-400/20 px-1 rounded-full">👑</span>}
                    </div>
                  )}
                  <div className={cn('px-3 py-1.5 rounded-2xl text-xs font-bold leading-snug shadow-lg',
                    isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm'
                    : msg.isCreator ? 'text-amber-100 rounded-bl-sm' : 'text-white/85 rounded-bl-sm'
                  )}
                  style={!isMe ? {
                    background: msg.isCreator ? 'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(234,88,12,0.12))' : 'rgba(255,255,255,0.07)',
                    border: msg.isCreator ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.08)'
                  } : {}}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-white/20 font-bold px-1">{msg.time}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        {chatDisabled ? (
          <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-black text-rose-400">الدردشة موقوفة من قِبل المنشئ</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-md"
              style={{backgroundColor: myPlayer?.avatar_color || '#6366f1'}}>
              {myName.charAt(0)}
            </div>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
              placeholder={amCreator ? '👑 أرسل رسالة للمتسابقين...' : 'اكتب رسالتك...'}
              maxLength={150}
              className="flex-1 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none transition-all"
              style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)'}}
              onFocus={e => { e.target.style.border='1px solid rgba(99,102,241,0.5)'; e.target.style.background='rgba(255,255,255,0.1)'; }}
              onBlur={e => { e.target.style.border='1px solid rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.07)'; }}
            />
            <button onClick={handleSendChat} disabled={!chatInput.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:scale-100 hover:scale-105 active:scale-95 shadow-lg"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
              <svg className="w-3.5 h-3.5 text-white rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────
const BattleRoom = () => {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const locationState = location.state as { playerName?: string; isCreator?: boolean } | null;

  // ── Session restore key (per room code) ──
  const SESSION_KEY = `alnaseer_battle_session_${code}`;
  const savedSession = (() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  })();

  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [players, setPlayers] = useState<BattlePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [myName, setMyName] = useState(locationState?.playerName || savedSession?.playerName || localStorage.getItem('alnaseer_student_name') || '');
  const [joinName, setJoinName] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [myPlayer, setMyPlayer] = useState<BattlePlayer | null>(null);
  const [isJoined, setIsJoined] = useState(!!(locationState?.playerName || savedSession?.playerId));
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2'>('team1');
  const [kickedOut, setKickedOut] = useState(false);

  // Exam state
  const [questions, setQuestions] = useState<Question[]>([]);
  const questionsRef = useRef<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  // ── Sync Quiz State (server-driven via battle_rooms.phase_started_at) ──
  const [syncCurrentQ, setSyncCurrentQ] = useState(0);
  const [syncPhase, setSyncPhase] = useState<'question' | 'reveal'>('question');
  const [syncTimeLeft, setSyncTimeLeft] = useState(0);
  const [myAnswerGiven, setMyAnswerGiven] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roomRef = useRef<BattleRoom | null>(null);
  const isCreatorRef = useRef(false);
  // Guard against multiple devices racing to advance phase
  const phaseAdvanceLockRef = useRef<string | null>(null);
  const REVEAL_SECONDS = 3;

  // ── Multi-exam session state ──
  const [examNumber, setExamNumber] = useState(1);
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  const [nextExamPanel, setNextExamPanel] = useState(false);
  const [nextExamLoading, setNextExamLoading] = useState(false);
  const [nextExamYear, setNextExamYear] = useState<string>('');
  const [nextExamForm, setNextExamForm] = useState<string>('');
  const [nextTimePerQuestion, setNextTimePerQuestion] = useState<number>(60);
  const [nextQuestionsCount, setNextQuestionsCount] = useState<number>(0);
  const [showNextExamAlert, setShowNextExamAlert] = useState(false);
  const lastNextExamAlertRef = useRef<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatDisabled, setChatDisabled] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef2 = useRef<HTMLDivElement>(null);
  const chatChannelRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const myPlayerId = useRef<string | null>(null);
  // ── Debounce progress writes to avoid DB write storm with 10+ players ──
  const progressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { isCreatorRef.current = !!myPlayer?.is_creator; }, [myPlayer]);
  // تحديث الوقت الافتراضي للاختبار التالي من الغرفة الحالية
  useEffect(() => {
    if (room?.time_per_question) setNextTimePerQuestion(room.time_per_question);
  }, [room?.time_per_question]);

  // ── Fetch room ──
  const fetchRoom = useCallback(async () => {
    if (!code) return;
    const { data } = await (supabase.from('battle_rooms' as any) as any)
      .select('*, subjects(name, battle_password)').eq('code', code).maybeSingle();
    if (data) {
      setRoom({ ...data, question_ids: data.question_ids as string[] });
      // fetchRoom لا تُشغّل الاختبار — init() هي المسؤولة عن ذلك
      // هذه الدالة تُستخدم فقط لتحديث بيانات الغرفة
    }
  }, [code]);

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
    if (!ids || ids.length === 0) return [];
    // ── BATCH_SIZE = 50: يُجنّب تجاوز حد طول URL في PostgREST عند .in('id', batch) لمنع فشل الدفعات بصمت ──
    const BATCH_SIZE = 50;
    let allData: Question[] = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      let batchData: Question[] | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from('questions')
          .select('id, question_text, option_a, option_b, option_c, option_d, correct_option, hint')
          .in('id', batch);
        if (!error && data) { batchData = data as unknown as Question[]; break; }
        if (attempt < 2) await new Promise(r => setTimeout(r, 500));
      }
      if (batchData) allData = [...allData, ...batchData];
    }

    const indexMap = new Map(ids.map((id, i) => [id, i]));
    let sorted = allData.sort((a, b) => (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0));

    // إعادة محاولة لأي IDs ناقصة
    if (sorted.length < ids.length) {
      const fetchedIds = new Set(sorted.map(q => q.id));
      const missingIds = ids.filter(id => !fetchedIds.has(id));
      for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
        const batch = missingIds.slice(i, i + BATCH_SIZE);
        const { data } = await supabase
          .from('questions')
          .select('id, question_text, option_a, option_b, option_c, option_d, correct_option, hint')
          .in('id', batch);
        if (data) allData = [...allData, ...(data as unknown as Question[])];
      }
      sorted = allData.sort((a, b) => (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0));
    }

    if (sorted.length) setQuestions(sorted);
    return sorted;
  };

  // ── Initial load ──
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (!code) return;
      const { data } = await (supabase.from('battle_rooms' as any) as any)
        .select('*, subjects(name, battle_password)').eq('code', code).maybeSingle();
      if (data) {
        const r = { ...data, question_ids: data.question_ids as string[] } as BattleRoom;
        setRoom(r);
        roomRef.current = r;
        // تهيئة ref الإشعار حتى لا يُعرض الإشعار القديم تلقائياً عند الدخول
        lastNextExamAlertRef.current = (data as any).next_exam_alert_at ?? null;
        const { data: pData } = await (supabase.from('battle_players' as any) as any)
          .select('*').eq('room_id', data.id).order('percentage', { ascending: false });
        if (pData) setPlayers(pData);

        // ── Restore from locationState: creator ──
        if (locationState?.isCreator && locationState.playerName) {
          const me = pData?.find((p: BattlePlayer) => p.player_name === locationState.playerName && p.is_creator);
          if (me) {
            myPlayerId.current = me.id;
            setMyPlayer(me);
            setMyName(me.player_name);
            setIsJoined(true);
            isCreatorRef.current = true;
            localStorage.setItem(SESSION_KEY, JSON.stringify({ playerId: me.id, playerName: me.player_name, isCreator: true }));
            // ── إذا كانت الغرفة نشطة استئنف مباشرة بدون الضغط على ابدأ ──
            if (data.status === 'active') {
              const loadedQs = await loadQuestions(data.question_ids as string[]);
              if (me.answers_json && Object.keys(me.answers_json).length > 0) {
                setAnswers(me.answers_json as Record<string, string>);
                answersRef.current = me.answers_json as Record<string, string>;
              }
              setTimeLeft((data.time_minutes + (data.extra_time_minutes || 0)) * 60);
              setExamStarted(true);
              if (loadedQs.length > 0) {
                setTimeout(() => {
                  syncFromRoom({ ...data, question_ids: data.question_ids as string[] } as BattleRoom, me.answers_json as Record<string, string>);
                }, 800);
              }
              toast({ title: 'مرحباً مجدداً ' + me.player_name + ' 👋', description: 'تم استئناف الجلسة تلقائياً' });
            } else if (data.status === 'finished') {
              await loadQuestions(data.question_ids as string[]);
              if (me.answers_json && Object.keys(me.answers_json).length > 0) {
                setAnswers(me.answers_json as Record<string, string>);
                answersRef.current = me.answers_json as Record<string, string>;
              }
              setExamStarted(true);
              setExamFinished(true);
            }
          }
        }
        // ── Restore from locationState: regular join ──
        else if (locationState?.playerName && !locationState.isCreator) {
          const me = pData?.find((p: BattlePlayer) => p.player_name === locationState.playerName && !p.kicked);
          if (me) {
            myPlayerId.current = me.id;
            setMyPlayer(me);
            setMyName(me.player_name);
            setIsJoined(true);
            isCreatorRef.current = !!me.is_creator;
            localStorage.setItem(SESSION_KEY, JSON.stringify({ playerId: me.id, playerName: me.player_name, isCreator: !!me.is_creator }));
            // ── استئناف إذا كانت الغرفة نشطة ──
            if (data.status === 'active') {
              const loadedQs = await loadQuestions(data.question_ids as string[]);
              if (me.answers_json && Object.keys(me.answers_json).length > 0) {
                setAnswers(me.answers_json as Record<string, string>);
                answersRef.current = me.answers_json as Record<string, string>;
              }
              setTimeLeft((data.time_minutes + (data.extra_time_minutes || 0)) * 60);
              setExamStarted(true);
              if (loadedQs.length > 0) {
                setTimeout(() => {
                  syncFromRoom({ ...data, question_ids: data.question_ids as string[] } as BattleRoom, me.answers_json as Record<string, string>);
                }, 800);
              }
            } else if (data.status === 'finished') {
              await loadQuestions(data.question_ids as string[]);
              if (me.answers_json && Object.keys(me.answers_json).length > 0) {
                setAnswers(me.answers_json as Record<string, string>);
                answersRef.current = me.answers_json as Record<string, string>;
              }
              setExamStarted(true);
              setExamFinished(true);
            }
          }
        }
        // ── Restore from localStorage: page refresh / reconnect ──
        else if (savedSession?.playerId) {
          const me = pData?.find((p: BattlePlayer) => p.id === savedSession.playerId && !p.kicked);
          if (me) {
            myPlayerId.current = me.id;
            setMyPlayer(me);
            setMyName(me.player_name);
            setIsJoined(true);
            isCreatorRef.current = !!me.is_creator;
            if (data.status === 'active') {
              const loadedQs = await loadQuestions(data.question_ids as string[]);
              if (me.answers_json && Object.keys(me.answers_json).length > 0) {
                setAnswers(me.answers_json as Record<string, string>);
                answersRef.current = me.answers_json as Record<string, string>;
              }
              setTimeLeft((data.time_minutes + (data.extra_time_minutes || 0)) * 60);
              setExamStarted(true);
              const currentQIndex = data.current_question_index ?? 0;
              setSyncCurrentQ(currentQIndex);
              // Engine is server-driven now: just sync from the freshly loaded room.
              // The realtime UPDATE handler + room ref will keep it ticking.
              setTimeout(() => {
                syncFromRoom({ ...data, question_ids: data.question_ids as string[] } as BattleRoom, me.answers_json as Record<string, string>);
              }, 800);
            } else if (data.status === 'finished') {
              await loadQuestions(data.question_ids as string[]);
              if (me.answers_json && Object.keys(me.answers_json).length > 0) {
                setAnswers(me.answers_json as Record<string, string>);
                answersRef.current = me.answers_json as Record<string, string>;
              }
              setExamStarted(true);
              setExamFinished(true);
            }
            toast({ title: 'مرحباً مجدداً ' + me.player_name + ' 👋', description: 'تم استئناف جلستك تلقائياً' });
          } else {
            // طُرد أو لا يوجد — امسح الجلسة
            localStorage.removeItem(SESSION_KEY);
            setIsJoined(false);
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [code]);

  // ── Ref to track examStarted without stale closures ──
  const examStartedRef = useRef(false);
  useEffect(() => { examStartedRef.current = examStarted; }, [examStarted]);
  const kickedOutRef = useRef(false);
  useEffect(() => { kickedOutRef.current = kickedOut; }, [kickedOut]);
  const examFinishedRef = useRef(false);
  useEffect(() => { examFinishedRef.current = examFinished; }, [examFinished]);

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
            // ── FIX: Throttle leaderboard re-renders — only update if meaningful change ──
            setPlayers(prev => {
              const existing = prev.find(p => p.id === updated.id);
              // Skip if only answers_json changed (internal data, not displayed in leaderboard)
              if (existing &&
                existing.correct_count === updated.correct_count &&
                existing.total_answered === updated.total_answered &&
                existing.status === updated.status &&
                existing.kicked === updated.kicked) {
                return prev; // No visible change — skip re-render
              }
              return prev.map(p => p.id === updated.id ? updated : p)
                .sort((a, b) => b.percentage - a.percentage);
            });
            if (updated.id === myPlayerId.current) {
              setMyPlayer(updated);
              if (updated.kicked && !kickedOutRef.current) {
                setKickedOut(true);
                localStorage.removeItem(SESSION_KEY);
                toast({ title: '⛔ تم طردك من الغرفة!', variant: 'destructive' });
              }
            }
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: `id=eq.${room.id}` },
        async (payload) => {
          const updated = payload.new as any;
          const prevRow = payload.old as any;
          const updatedRoom = { ...updated, question_ids: updated.question_ids as string[] } as BattleRoom;
          setRoom(prev => prev ? { ...prev, ...updatedRoom } : prev);
          roomRef.current = roomRef.current ? { ...roomRef.current, ...updatedRoom } : updatedRoom;

          // ── تنبيه "الاختبار التالي" — يُعرض مرة واحدة لكل قيمة جديدة ──
          // ملاحظة: payload.old في postgres_changes لا يحتوي إلا على المفتاح الأساسي،
          // لذا نعتمد على ref محلي لتتبع آخر قيمة معروفة بدل prevRow.
          if (updated.next_exam_alert_at && updated.next_exam_alert_at !== lastNextExamAlertRef.current) {
            lastNextExamAlertRef.current = updated.next_exam_alert_at;
            setShowNextExamAlert(true);
          }

          // ── Status: waiting -> active (start of an exam, including subsequent rounds) ──
          if (updated.status === 'active' && !examStartedRef.current) {
            // جلب question_ids من DB مباشرة لتفادي اقتطاع Realtime payload للمصفوفات الكبيرة
            const { data: freshRoom } = await (supabase.from('battle_rooms' as any) as any)
              .select('question_ids')
              .eq('id', updated.id)
              .single();
            const freshIds: string[] = freshRoom?.question_ids ?? updated.question_ids ?? [];
            const loadedQs = await loadQuestions(freshIds);
            setTimeLeft((updated.time_minutes + (updated.extra_time_minutes || 0)) * 60);
            setExamStarted(true);

            // Promote myself from waiting to playing if needed
            if (myPlayerId.current) {
              await (supabase.from('battle_players' as any) as any)
                .update({ status: 'playing' })
                .eq('id', myPlayerId.current)
                .eq('status', 'waiting');
            }
            toast({ title: '🚀 انطلقت المنافسة!' });

            // Kick off the local sync from the freshly loaded room state
            if (loadedQs.length > 0) {
              setTimeout(() => syncFromRoom(updatedRoom), 200);
            }
          } else if (updated.status === 'active' && examStartedRef.current) {
            // ── Server-driven engine: any change to phase / question index re-syncs the UI ──
            syncFromRoom(updatedRoom);
          }

          // ── Round reset: room flipped back to waiting (next exam in same session) ──
          // يعمل سواء كان الاختبار منتهياً أو لا — المنشئ طلب جولة جديدة
          if (updated.status === 'waiting' && (examStartedRef.current || examFinishedRef.current)) {
            if (syncTimerRef.current) clearInterval(syncTimerRef.current);
            // تحديث الـ refs مباشرة قبل setState لتجنب stale closure
            examStartedRef.current = false;
            examFinishedRef.current = false;
            setExamStarted(false);
            setExamFinished(false);
            setSelectedAnswer(null);
            setShowFeedback(false);
            setMyAnswerGiven(false);
            setSyncCurrentQ(0);
            setSyncPhase('question');
            setSyncTimeLeft(0);
            setAnswers({});
            answersRef.current = {};
            setQuestions([]);
            questionsRef.current = [];
            setShowFinalSummary(false);
            // أعِد حفظ SESSION_KEY حتى يتمكن اللاعب من الاستئناف إذا خرج أثناء الانتظار
            const s = localStorage.getItem(SESSION_KEY);
            if (!s && myPlayerId.current && myName) {
              localStorage.setItem(SESSION_KEY, JSON.stringify({ playerId: myPlayerId.current, playerName: myName, isCreator: isCreatorRef.current }));
            }
          }

          if (updated.status === 'finished' && !examFinishedRef.current) {
            if (syncTimerRef.current) clearInterval(syncTimerRef.current);
            await handleFinishExam();
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id, myName]);

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

    // ✅ فحص إيقاف غرف التحدي من الأدمن
    const { data: subjectData } = await (supabase.from('subjects' as any) as any)
      .select('battle_disabled')
      .eq('id', room.subject_id)
      .maybeSingle();
    if (subjectData?.battle_disabled) {
      toast({
        title: '⛔ غرف التحدي موقوفة',
        description: 'غرف التحدي لهذه المادة موقوفة حالياً من قِبَل الإدارة',
        variant: 'destructive',
      });
      return;
    }

    

    // ✅ التحقق من كلمة المرور — سواء من is_private أو من battle_password الأدمن
    const adminPassword: string | null = (room.subjects as any)?.battle_password || null;
    const requiresPassword = room.is_private || !!adminPassword;
    if (requiresPassword) {
      // أولاً: مقارنة مع كلمة مرور الأدمن مباشرة (إذا وُجدت)
      if (adminPassword && joinPassword.trim() === adminPassword) {
        // ✅ مطابق لكلمة مرور الأدمن — المرور
      } else {
        // ثانياً: مقارنة عبر RPC مع password الغرفة نفسها
        const { data: pwCheck, error: pwError } = await (supabase.rpc as any)('check_battle_room_password', {
          p_room_id: room.id,
          p_password: joinPassword.trim(),
        });
        if (pwError || !pwCheck) {
          toast({ title: '🔑 كلمة المرور غير صحيحة', variant: 'destructive' }); return;
        }
      }
    }
    if (players.filter(p => !p.kicked).length >= room.max_players) {
      toast({ title: '⚠️ الغرفة ممتلئة!', variant: 'destructive' }); return;
    }

    setJoining(true);
    const isLateJoin = room.status === 'active';

    // ── تحقق من DB مباشرة: هل اللاعب موجود مسبقاً بنفس الاسم؟ (عاد بعد خروج) ──
    const { data: existingPlayers } = await (supabase.from('battle_players' as any) as any)
      .select('*')
      .eq('room_id', room.id)
      .eq('player_name', name)
      .eq('kicked', false)
      .eq('is_creator', false)
      .maybeSingle();
    const existingPlayer = existingPlayers as BattlePlayer | null;

    if (existingPlayer) {
      // إعادة ربط بدون إنشاء سجل جديد — تُحافظ على الدرجات الحقيقية من DB
      myPlayerId.current = existingPlayer.id;
      setMyPlayer(existingPlayer);
      setMyName(name);
      setIsJoined(true);
      setShowWelcome(true);
      localStorage.setItem('alnaseer_student_name', name);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ playerId: existingPlayer.id, playerName: name }));
      if (isLateJoin || existingPlayer.status === 'playing') {
        const loadedQs = await loadQuestions(room.question_ids);
        if (existingPlayer.answers_json && Object.keys(existingPlayer.answers_json).length > 0) {
          setAnswers(existingPlayer.answers_json as Record<string, string>);
          answersRef.current = existingPlayer.answers_json as Record<string, string>;
        }
        setTimeLeft((room.time_minutes + (room.extra_time_minutes || 0)) * 60);
        setExamStarted(true);
        if (loadedQs.length) {
          setTimeout(() => syncFromRoom(room, existingPlayer.answers_json as Record<string, string>), 800);
          toast({ title: 'مرحباً مجدداً ' + name + ' 👋', description: 'تم استئناف جلستك' });
        }
      }
      setJoining(false);
      return;
    }

    // ── لاعب جديد كلياً ──
    if (players.some(p => p.player_name === name && !p.kicked)) {
      toast({ title: '⚠️ هذا الاسم مستخدم بالفعل', variant: 'destructive' });
      setJoining(false); return;
    }
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const { data } = await (supabase.from('battle_players' as any) as any).insert({
      room_id: room.id, player_name: name, is_creator: false,
      status: isLateJoin ? 'playing' : 'waiting',
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
      localStorage.setItem(SESSION_KEY, JSON.stringify({ playerId: data.id, playerName: name }));
      if (isLateJoin) {
        const loadedQs = await loadQuestions(room.question_ids);
        setTimeLeft((room.time_minutes + (room.extra_time_minutes || 0)) * 60);
        setExamStarted(true);
        if (loadedQs.length) {
          toast({ title: '⚡ انضممت للمنافسة الجارية!', description: 'ستبدأ من السؤال الحالي' });
        }
      }
    }
    setJoining(false);
  };

  // ── Creator controls ──
  const handleStartRoom = async () => {
    if (!room) return;
    setStarting(true);

    // ── جلب question_ids الحديثة من DB مباشرة (يضمن الأسئلة الجديدة بعد handleNextExam) ──
    const { data: freshRoomData } = await (supabase.from('battle_rooms' as any) as any)
      .select('question_ids, time_minutes, extra_time_minutes')
      .eq('id', room.id)
      .single();
    const freshQuestionIds: string[] = freshRoomData?.question_ids ?? room.question_ids;

    // Load questions using fresh IDs
    const loadedQs = await loadQuestions(freshQuestionIds);
    if (!loadedQs.length) {
      toast({ title: '⚠️ لم يتم تحميل الأسئلة', variant: 'destructive' });
      setStarting(false);
      return;
    }
    
    // Update all waiting players to 'playing' status
    await (supabase.from('battle_players' as any) as any)
      .update({ status: 'playing' })
      .eq('room_id', room.id)
      .eq('status', 'waiting');

    // ── Server-driven engine: write the starting phase and let realtime fan it out ──
    const nowIso = new Date().toISOString();
    await (supabase.from('battle_rooms' as any) as any).update({
      status: 'active',
      started_at: nowIso,
      locked: false,
      current_question_index: 0,
      current_phase: 'question',
      phase_started_at: nowIso,
    }).eq('id', room.id);

    setTimeLeft((room.time_minutes + (room.extra_time_minutes || 0)) * 60);
    setExamStarted(true);
    setStarting(false);
    // Local sync is also driven by the realtime UPDATE handler, but kick it off immediately
    // so the creator's UI doesn't wait a round-trip to render Q1.
    syncFromRoom({
      ...room,
      status: 'active',
      current_question_index: 0,
      current_phase: 'question',
      phase_started_at: nowIso,
    });
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
    // حفظ نتائج المنشئ أولاً قبل إنهاء الغرفة
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    await handleFinishExam();
    await (supabase.from('battle_rooms' as any) as any).update({
      status: 'finished', finished_at: new Date().toISOString()
    }).eq('id', room.id);
  };

  // ── دالة حفظ نتائج الاختبار في battle_session_results ──
  const saveSessionResults = async (examLabel: string) => {
    if (!room) return;
    const records = players.filter(p => !p.kicked).map(p => ({
      room_id: room.id,
      player_id: p.id,
      player_name: p.player_name,
      exam_number: examNumber,
      exam_label: examLabel,
      total_questions: questions.length,
      correct_count: p.correct_count,
      wrong_count: questions.length - p.correct_count,
      percentage: p.percentage,
    }));
    await (supabase.from('battle_session_results' as any) as any).insert(records);
    setSessionResults(prev => [...prev, ...records]);
    setExamNumber(prev => prev + 1);
  };

  // ── الاختبار التالي: صفّر اللاعبين والغرفة ──
  const handleNextExam = async (examLabel: string, newTimePerQuestion: number, examYear: string, examForm: string) => {
    if (!room) return;
    setNextExamLoading(true);

    // 1. جلب أسئلة جديدة من DB حسب المادة والسنة والنموذج
    let questionIds: string[] = [];
    try {
      let allIds: string[] = [];
      const PAGE_SIZE = 1000;
      let from = 0;
      while (true) {
        let query = (supabase.from('questions') as any)
          .select('id')
          .eq('subject_id', room.subject_id)
          .range(from, from + PAGE_SIZE - 1);
        if (examYear && examYear !== 'تجريبية') query = query.eq('exam_year', parseInt(examYear));
        else if (examYear === 'تجريبية') query = query.is('exam_year', null);
        if (examForm) query = query.eq('exam_form', examForm);
        const { data: pageData } = await query;
        if (!pageData || pageData.length === 0) break;
        allIds = [...allIds, ...pageData.map((q: any) => q.id)];
        if (pageData.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      const qData = allIds.map(id => ({ id }));
      if (qData && qData.length > 0) {
        // خلط Fisher-Yates الحقيقي
        const arr = [...qData];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        const limit = nextQuestionsCount > 0 ? nextQuestionsCount : arr.length;
        questionIds = arr.slice(0, limit).map((q: any) => q.id);
      }
    } catch (_) {}
    // إذا فشل الجلب — خلط الأسئلة الحالية على الأقل
    if (questionIds.length === 0) {
      const arr = [...room.question_ids];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      const limit = nextQuestionsCount > 0 ? nextQuestionsCount : arr.length;
      questionIds = arr.slice(0, limit);
    }

    // 2. احفظ نتائج الاختبار المنتهي
    await saveSessionResults(examLabel);

    // 3. صفّر نتائج كل اللاعبين
    await (supabase.from('battle_players' as any) as any)
      .update({
        score: 0, correct_count: 0, total_answered: 0,
        percentage: 0, progress: 0, status: 'waiting',
        finished_at: null, answers_json: {},
      })
      .eq('room_id', room.id)
      .neq('kicked', true);

    // 4. أعد ضبط الغرفة مع الأسئلة الجديدة
    await (supabase.from('battle_rooms' as any) as any)
      .update({
        status: 'waiting',
        current_question_index: 0,
        current_phase: 'question',
        phase_started_at: null,
        question_ids: questionIds,
        questions_count: questionIds.length,
        time_per_question: newTimePerQuestion,
        started_at: null,
        finished_at: null,
        exam_year: examYear && examYear !== 'تجريبية' ? parseInt(examYear) : null,
        exam_form: examForm || null,
        exam_form_name: [
          examYear,
          examForm ? ({General:'عام',Parallel:'موازي',Mixed:'مختلط',Model_1:'نموذج 1',Model_2:'نموذج 2',Model_3:'نموذج 3'} as Record<string,string>)[examForm] || examForm : ''
        ].filter(Boolean).join(' — ') || null,
      })
      .eq('id', room.id);

    setNextExamPanel(false);
    setNextExamLoading(false);
  };

  // ── الإنهاء النهائي للجلسة ──
  const handleFinalEnd = async () => {
    if (!room) return;
    // احفظ الاختبار الأخير إن لم يُحفظ بعد
    const examLabel = `اختبار ${examNumber}`;
    await saveSessionResults(examLabel);
    // أنهِ الغرفة
    await (supabase.from('battle_rooms' as any) as any).update({
      status: 'finished', finished_at: new Date().toISOString()
    }).eq('id', room.id);
    setShowFinalSummary(true);
  };

  // ── Chat Channel ──
  useEffect(() => {
    if (!room?.id) return;
    const chatChannel = supabase.channel(`battle-chat-${room.id}`, {
      config: { broadcast: { self: true } }
    }).on('broadcast', { event: 'chat_message' }, ({ payload }) => {
      const msg = payload as ChatMessage;
      setChatMessages(prev => [...prev, msg]);
      setShowChat(prev => {
        if (!prev) setUnreadCount(c => c + 1);
        return prev;
      });
      setTimeout(() => { const ref = chatContainerRef.current || chatContainerRef2.current; if (ref) { ref.scrollTop = ref.scrollHeight; } }, 50);
    }).on('broadcast', { event: 'chat_control' }, ({ payload }) => {
      setChatDisabled(payload.disabled);
    }).on('broadcast', { event: 'next_exam_alert' }, () => {
      setShowNextExamAlert(true);
    }).subscribe();
    chatChannelRef.current = chatChannel;
    return () => { supabase.removeChannel(chatChannel); };
  }, [room?.id]);

  // ── Server-Driven Sync Engine ──
  // Drives the quiz from `battle_rooms` columns: current_question_index, current_phase, phase_started_at, time_per_question.
  // Every device computes timeLeft locally; the first device to reach 0 atomically advances the phase.
  const syncFromRoom = useCallback((r: BattleRoom | null, restoredAnswers?: Record<string, string>) => {
    if (!r || r.status !== 'active' || !r.phase_started_at) return;
    const tpq = r.time_per_question || 60;
    const phase = (r.current_phase || 'question') as 'question' | 'reveal';
    const idx = r.current_question_index ?? 0;
    const phaseDuration = phase === 'question' ? tpq : REVEAL_SECONDS;
    const elapsed = (Date.now() - new Date(r.phase_started_at).getTime()) / 1000;
    const tl = Math.max(0, Math.floor(phaseDuration - elapsed));

    setSyncCurrentQ(idx);
    setSyncPhase(phase);
    setSyncTimeLeft(tl);

    // When a new question starts, reset per-question UI state
    if (phase === 'question') {
      // ── عند الاستئناف: تحقق من إجابة السؤال الحالي من الـ answers المستعادة ──
      const currentAnswers = restoredAnswers || answersRef.current;
      const currentQId = questionsRef.current[idx]?.id;
      const alreadyAnswered = currentQId ? !!currentAnswers[currentQId] : false;
      if (alreadyAnswered) {
        // أجاب على هذا السؤال قبل الخروج — أعِد إظهار إجابته
        setMyAnswerGiven(true);
        setSelectedAnswer(currentAnswers[currentQId!]);
        setShowFeedback(false);
      } else {
        setMyAnswerGiven(false);
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    } else {
      setShowFeedback(true);
    }

    // Persist for refresh-resume
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, currentQ: idx, phase }));
    } catch {}

    // Local countdown (purely visual; the truth is phase_started_at)
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    if (tl > 0) {
      let t = tl;
      syncTimerRef.current = setInterval(() => {
        t -= 1;
        setSyncTimeLeft(t);
        if (t <= 0) {
          clearInterval(syncTimerRef.current!);
          // Race-safe phase advance
          tryAdvancePhase();
        }
      }, 1000);
    } else {
      // Already at 0 — try to advance immediately
      setTimeout(() => tryAdvancePhase(), 50 + Math.random() * 200); // small jitter to spread races
    }
  }, [SESSION_KEY]);

  // Atomically advance the phase if the room is still in the expected state.
  // Multiple devices may call this simultaneously; the conditional update + local lock
  // ensures only one update wins per (roomId, expectedPhase, expectedIndex).
  const tryAdvancePhase = useCallback(async () => {
    const r = roomRef.current;
    if (!r || r.status !== 'active') return;
    const expectedPhase = r.current_phase || 'question';
    const expectedIndex = r.current_question_index ?? 0;
    const lockKey = `${r.id}:${expectedPhase}:${expectedIndex}`;
    if (phaseAdvanceLockRef.current === lockKey) return;
    phaseAdvanceLockRef.current = lockKey;

    try {
      // Re-check from DB right before writing (defends against very late wakeups)
      const { data: check } = await (supabase.from('battle_rooms' as any) as any)
        .select('current_phase, current_question_index, status, phase_started_at, time_per_question, questions_count')
        .eq('id', r.id)
        .single();
      if (!check || check.status !== 'active') return;
      if (check.current_phase !== expectedPhase || check.current_question_index !== expectedIndex) return;

      // Confirm time has actually elapsed (avoids early advance if our local clock drifted)
      const tpq = check.time_per_question || 60;
      const phaseDuration = expectedPhase === 'question' ? tpq : REVEAL_SECONDS;
      const elapsed = check.phase_started_at
        ? (Date.now() - new Date(check.phase_started_at).getTime()) / 1000
        : phaseDuration;
      if (elapsed < phaseDuration - 0.5) return;

      // ── questions_count من DB مباشرة — المصدر الوحيد الموثوق دائماً ──
      const totalQs = check.questions_count ?? r.questions_count ?? questionsRef.current.length;
      if (expectedPhase === 'question') {
        // question -> reveal
        await (supabase.from('battle_rooms' as any) as any)
          .update({
            current_phase: 'reveal',
            phase_started_at: new Date().toISOString(),
          })
          .eq('id', r.id)
          .eq('current_phase', 'question')
          .eq('current_question_index', expectedIndex);
      } else {
        // reveal -> next question (or finish)
        if (expectedIndex + 1 >= totalQs) {
          // End of exam — finish locally; the room status flips when all are done
          await handleFinishExam();
        } else {
          await (supabase.from('battle_rooms' as any) as any)
            .update({
              current_phase: 'question',
              current_question_index: expectedIndex + 1,
              phase_started_at: new Date().toISOString(),
            })
            .eq('id', r.id)
            .eq('current_phase', 'reveal')
            .eq('current_question_index', expectedIndex);
        }
      }
    } catch (_) {
      // silent — another device likely won the race
    }
  }, []);

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text || !chatChannelRef.current || !myName) return;
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      sender: myName,
      text,
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      isCreator: !!myPlayer?.is_creator,
      avatarColor: myPlayer?.avatar_color || '#6366f1',
    };
    chatChannelRef.current.send({ type: 'broadcast', event: 'chat_message', payload: msg });
    setChatInput('');
  };

  const handleToggleChat = () => {
    if (!chatChannelRef.current) return;
    const newDisabled = !chatDisabled;
    chatChannelRef.current.send({ type: 'broadcast', event: 'chat_control', payload: { disabled: newDisabled } });
  };

  const sendNextExamAlert = async () => {
    if (!room?.id) return;
    // ── يُكتب في الـ DB ليصل لجميع اللاعبين عبر postgres_changes الموجود أصلاً ──
    await (supabase.from('battle_rooms' as any) as any)
      .update({ next_exam_alert_at: new Date().toISOString() })
      .eq('id', room.id);
    setShowNextExamAlert(true); // المنشئ يراه فوراً
  };


  const handleSyncAnswer = async (option: string) => {
    if (myAnswerGiven || syncPhase !== 'question' || !questions[syncCurrentQ]) return;
    setMyAnswerGiven(true);
    setSelectedAnswer(option);
    const q = questions[syncCurrentQ];
    const newAnswers = { ...answers, [q.id]: option };
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
    const correctCount = Object.keys(newAnswers).filter(id => {
      const qObj = questions.find(q => q.id === id);
      return qObj && newAnswers[id] === qObj.correct_option;
    }).length;
    // ── FIX: non-blocking call (debounced internally) — don't await ──
    updateProgress(correctCount, questions.length, syncCurrentQ + 1, newAnswers);
  };

  // ── Exam ──
  const updateProgress = (correct: number, total: number, answered: number, answersJson: Record<string, string>) => {
    if (!myPlayerId.current || !room) return;
    // ── Debounce DB writes to prevent write storm with 10+ players ──
    if (progressDebounceRef.current) clearTimeout(progressDebounceRef.current);
    progressDebounceRef.current = setTimeout(async () => {
      if (!myPlayerId.current || !roomRef.current) return;
      const currentRoom = roomRef.current;
      const qCount = currentRoom.questions_count > 0 ? currentRoom.questions_count : (questionsRef.current.length || 1);
      const pct = (correct / qCount) * 100;
      const progress = (answered / qCount) * 100;
      // ── دائماً احفظ answers_json لضمان استئناف صحيح عند العودة في أي وقت ──
      // ── لا تضع status='finished' هنا — tryAdvancePhase هي المسؤولة الوحيدة ──
      await (supabase.from('battle_players' as any) as any).update({
        correct_count: correct, total_answered: answered,
        score: correct, percentage: pct, progress,
        status: 'playing',
        answers_json: answersJson,
      }).eq('id', myPlayerId.current);
    }, 300);
  };

  const handleAnswer = async (option: string) => {
    if (selectedAnswer || !questions[currentQ]) return;
    setSelectedAnswer(option);
    setShowFeedback(true);

    const q = questions[currentQ];
    const newAnswers = { ...answers, [q.id]: option };
    setAnswers(newAnswers);
    answersRef.current = newAnswers;

    const correctCount = Object.keys(newAnswers).filter(id => {
      const qObj = questions.find(q => q.id === id);
      return qObj && newAnswers[id] === qObj.correct_option;
    }).length;

    // ── FIX: non-blocking (debounced internally) ──
    updateProgress(correctCount, questions.length, currentQ + 1, newAnswers);

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
    if (examFinishedRef.current || !myPlayerId.current) return;
    const currentRoom = roomRef.current;
    if (!currentRoom) return;
    clearInterval(timerRef.current!);
    // ── FIX: cancel any pending debounced progress write before final save ──
    if (progressDebounceRef.current) clearTimeout(progressDebounceRef.current);
    setExamFinished(true);
    // لا نمسح SESSION_KEY — يُحتاج إذا انتقل المنشئ لاختبار تالٍ في نفس الجلسة

    const elapsed = (currentRoom.time_minutes + (currentRoom.extra_time_minutes || 0)) * 60 - timeLeft;
    const usedAnswers = finalAnswers || answersRef.current;
    const qList = questionsRef.current;
    const correct = finalCorrect ?? Object.keys(usedAnswers).filter(id => {
      const q = qList.find(q => q.id === id); return q && usedAnswers[id] === q.correct_option;
    }).length;
    const total = finalTotal ?? Object.keys(usedAnswers).length;
    const pct = currentRoom.questions_count > 0 ? (correct / currentRoom.questions_count) * 100 : 0;

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
      .select('status, kicked, is_creator').eq('room_id', currentRoom.id);
    const activeP = allP?.filter((p: any) => !p.kicked);
    const allDone = activeP?.every((p: any) => p.status === 'finished');
    const creatorDone = activeP?.find((p: any) => p.is_creator)?.status === 'finished';
    if (allDone && creatorDone) {
      await (supabase.from('battle_rooms' as any) as any).update({
        status: 'finished', finished_at: new Date().toISOString(),
      }).eq('id', currentRoom.id);
    }
  };

  // ── Share state ──
  const [isShareLoading, setIsShareLoading] = useState<string | null>(null);

  // ── Canvas result image generator ──
  const generateBattleResultCanvas = async (
    me: BattlePlayer,
    rank: number,
    totalPlayers: number,
    subjectNameStr: string,
  ): Promise<HTMLCanvasElement> => {
    const W = 600, H = 820, SC = 2;
    const canvas = document.createElement('canvas');
    canvas.width = W * SC; canvas.height = H * SC;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SC, SC);
    ctx.direction = 'rtl'; ctx.textAlign = 'center';

    const isFirst = rank === 1;
    const pct = Math.round(me.percentage);

    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (isFirst) {
      grad.addColorStop(0, '#f59e0b'); grad.addColorStop(0.4, '#d97706'); grad.addColorStop(1, '#1e293b');
    } else if (rank <= 3) {
      grad.addColorStop(0, '#64748b'); grad.addColorStop(0.4, '#475569'); grad.addColorStop(1, '#1e293b');
    } else {
      grad.addColorStop(0, '#334155'); grad.addColorStop(0.4, '#1e293b'); grad.addColorStop(1, '#0f172a');
    }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // dot pattern overlay
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 0; x < W; x += 20) for (let y = 0; y < H; y += 20) {
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
    }

    // trophy/medal emoji
    const emoji = isFirst ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎯';
    ctx.font = 'bold 70px Arial'; ctx.fillText(emoji, W / 2, 110);

    // platform name
    ctx.font = 'bold 16px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('منصة الباحث القانوني — غرفة المنافسة', W / 2, 165);

    // subject
    ctx.font = '13px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(subjectNameStr, W / 2, 192);

    // rank badge
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.roundRect(W / 2 - 80, 208, 160, 44, 22); ctx.fill();
    ctx.font = 'bold 14px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(`المركز ${rank} من ${totalPlayers}`, W / 2, 235);

    // big percentage
    ctx.font = `bold 110px Arial`;
    ctx.fillStyle = isFirst ? '#fde68a' : 'white';
    ctx.fillText(`${pct}%`, W / 2, 375);

    // divider
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, 400); ctx.lineTo(W - 60, 400); ctx.stroke();

    // stats boxes
    const stats = [
      { label: 'إجابات صحيحة', val: `${me.correct_count}/${room?.questions_count || '—'}` },
      { label: 'إجابات خاطئة', val: String((me.total_answered || 0) - me.correct_count) },
      { label: 'الوقت المستغرق', val: me.time_seconds ? `${Math.floor(me.time_seconds / 60)}د ${me.time_seconds % 60}ث` : '—' },
    ];
    const bW = 150, bH = 78, gap = 20;
    const totalW = stats.length * bW + (stats.length - 1) * gap;
    const startX = (W - totalW) / 2;
    stats.forEach((s, i) => {
      const bx = startX + i * (bW + gap);
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath(); ctx.roundRect(bx, 420, bW, bH, 14); ctx.fill();
      ctx.font = 'bold 26px Arial'; ctx.fillStyle = 'white';
      ctx.fillText(s.val, bx + bW / 2, 452);
      ctx.font = '11px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(s.label, bx + bW / 2, 472);
    });

    // winner star row
    if (isFirst) {
      const stars = '★ ★ ★ ★ ★';
      ctx.font = 'bold 22px Arial'; ctx.fillStyle = '#fde68a';
      ctx.fillText(stars, W / 2, 530);
    }

    // player name
    ctx.font = 'bold 20px Arial'; ctx.fillStyle = 'white';
    ctx.fillText(`الطالب: ${me.player_name}`, W / 2, 570);

    // date
    ctx.font = '13px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(new Date().toLocaleDateString('ar-SA'), W / 2, 595);

    // join text
    ctx.font = 'bold 13px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`🎯 تحدَّ أصدقاءك: alnaseer.org`, W / 2, 630);

    // logo
    const logo = new Image(); logo.crossOrigin = 'anonymous'; logo.src = logoImage;
    await new Promise<void>(res => {
      logo.onload = () => {
        const ls = 56, pad = 20, x = W - ls - pad, y = H - ls - pad;
        ctx.save(); ctx.globalAlpha = 0.95;
        ctx.beginPath(); ctx.arc(x + ls / 2, y + ls / 2, ls / 2 + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'white'; ctx.fill(); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.arc(x + ls / 2, y + ls / 2, ls / 2, 0, Math.PI * 2);
        ctx.clip(); ctx.drawImage(logo, x, y, ls, ls); ctx.restore();
        res();
      };
      logo.onerror = () => res();
    });

    return canvas;
  };

  const getShareText = (me: BattlePlayer, rank: number) => {
    if (!room) return '';
    const subjectNameStr = (room as any).subjects?.name || '';
    const examYear = (room as any).exam_year ? ` | ${(room as any).exam_year}` : '';
    const examForm = (room as any).exam_form_name ? ` | ${(room as any).exam_form_name}` : '';
    const url = `${window.location.origin}/battle/${room.code}`;
    return `🏆 تحدَّ نفسك وأثبت تميّزك!\n\n📚 المادة: ${subjectNameStr}${examYear}${examForm}\n👨‍🏫 المنشئ: ${room.creator_name}\n\n🥇 مركزي: #${rank} من ${sortedPlayers.length}\n💪 نتيجتي: ${Math.round(me.percentage)}% ✅ (${me.correct_count}/${room.questions_count})\n\n🔥 هل تستطيع التفوق عليّ؟ انضم الآن!\n🔗 ${url}`;
  };

  const getRoomInviteMessage = () => {
    if (!room) return '';
    const url = `${window.location.origin}/battle/${room.code}`;
    const subjectNameStr = (room as any).subjects?.name || '';
    const examYear = (room as any).exam_year ? ` | ${(room as any).exam_year}` : '';
    const examForm = (room as any).exam_form_name ? ` | ${(room as any).exam_form_name}` : '';
    return `⚔️ تحدٍّ قانوني مباشر!\n\n📚 المادة: ${subjectNameStr}${examYear}${examForm}\n❓ الأسئلة: ${room.questions_count} سؤال\n👨‍🏫 المنشئ: ${room.creator_name}\n\n🔥 هل أنت مستعد للمنافسة؟ انضم الآن!\n🔗 ${url}`;
  };

  const handleRoomShareWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(getRoomInviteMessage())}`, '_blank'); };
  const handleRoomShareTelegram = () => { const url = `${window.location.origin}/battle/${room?.code}`; window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(getRoomInviteMessage())}`, '_blank'); };
  const handleRoomShareFacebook = () => { const url = `${window.location.origin}/battle/${room?.code}`; window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(getRoomInviteMessage())}`, '_blank'); };
  const handleRoomCopyMessage = () => { navigator.clipboard.writeText(getRoomInviteMessage()); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleShareWhatsApp = async () => {
    const me = sortedPlayers.find(p => p.id === myPlayerId.current);
    if (!me || !room) return;
    const rank = sortedPlayers.indexOf(me) + 1;
    setIsShareLoading('whatsapp');
    try {
      const canvas = await generateBattleResultCanvas(me, rank, sortedPlayers.length, subjectName);
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
      const file = new File([blob], 'نتيجة-المنافسة.png', { type: 'image/png' });
      const text = getShareText(me, rank);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch {
      const me2 = sortedPlayers.find(p => p.id === myPlayerId.current);
      if (me2) window.open(`https://wa.me/?text=${encodeURIComponent(getShareText(me2, rank))}`, '_blank');
    } finally { setIsShareLoading(null); }
  };

  const handleShareTwitter = () => {
    const me = sortedPlayers.find(p => p.id === myPlayerId.current);
    if (!me) return;
    const rank = sortedPlayers.indexOf(me) + 1;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText(me, rank))}`, '_blank', 'width=550,height=420');
  };

  const handleSaveImage = async () => {
    const me = sortedPlayers.find(p => p.id === myPlayerId.current);
    if (!me || !room) return;
    const rank = sortedPlayers.indexOf(me) + 1;
    setIsShareLoading('save');
    try {
      const canvas = await generateBattleResultCanvas(me, rank, sortedPlayers.length, subjectName);
      const link = document.createElement('a');
      link.download = `نتيجة-منافسة-${subjectName}-${Math.round(me.percentage)}%.png`;
      link.href = canvas.toDataURL('image/png'); link.click();
      toast({ title: '✅ تم حفظ الصورة!' });
    } catch { toast({ title: 'حدث خطأ', variant: 'destructive' }); }
    finally { setIsShareLoading(null); }
  };

  const handleShare = () => {
    const me = sortedPlayers.find(p => p.id === myPlayerId.current);
    if (!me || !room) return;
    const rank = sortedPlayers.indexOf(me) + 1;
    const text = getShareText(me, rank);
    if (navigator.share) navigator.share({ text });
    else { navigator.clipboard.writeText(text); toast({ title: '✅ تم نسخ النتيجة!' }); }
  };

  // ── Chat Panel (Inline) ──
  const renderChatPanel = (amCreator: boolean, msgContainerRef?: React.RefObject<HTMLDivElement>) => (
    <div className="rounded-2xl overflow-hidden shadow-2xl mb-4" style={{background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)',border:`1px solid ${chatDisabled ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.25)'}`}}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{background:'rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle className="w-4 h-4 text-indigo-400" />
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${chatDisabled ? 'bg-rose-500' : 'bg-emerald-400'}`} />
          </div>
          <span className="text-xs font-black text-white/80">دردشة المنافسة</span>
          {chatDisabled
            ? <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">موقوفة</span>
            : <span className="text-[10px] font-bold text-white/30">{players.filter(p=>!p.kicked).length} مشارك</span>
          }
        </div>
        <div className="flex items-center gap-2">
          {amCreator && (
            <button
              onClick={handleToggleChat}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black transition-all ${chatDisabled ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30' : 'bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30'}`}
            >
              {chatDisabled ? <><Zap className="w-3 h-3" /> تفعيل</> : <><Shield className="w-3 h-3" /> إيقاف</>}
            </button>
          )}
          {amCreator && (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
              <Crown className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] font-black text-amber-400">منشئ</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages - آخر 4 رسائل مع تمرير */}
      <div
        ref={msgContainerRef || chatContainerRef}
        className="overflow-y-auto px-3 py-2 space-y-2"
        style={{
          height: '180px',
          minHeight: '180px',
          maxHeight: '180px',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99,102,241,0.3) transparent'
        }}
      >
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-3 opacity-40">
            <MessageCircle className="w-4 h-4 text-white/30" />
            <span className="text-[11px] text-white/40 font-bold">كن أول من يبدأ المحادثة!</span>
          </div>
        ) : (
          chatMessages.map((msg, idx) => {
            const isMe = msg.sender === myName;
            const isLast4 = idx >= Math.max(0, chatMessages.length - 4);
            return (
              <div key={msg.id} className={cn('flex items-end gap-1.5 transition-all duration-300', isMe ? 'flex-row-reverse' : 'flex-row', !isLast4 && 'opacity-50')}>
                {/* Avatar */}
                {!isMe && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-md ring-1 ring-white/10"
                    style={{backgroundColor: msg.avatarColor}}>
                    {msg.sender.charAt(0)}
                  </div>
                )}
                <div className={cn('flex flex-col gap-0.5 max-w-[78%]', isMe ? 'items-end' : 'items-start')}>
                  {/* Name row */}
                  {!isMe && (
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[9px] font-black text-white/40">{msg.sender}</span>
                      {msg.isCreator && <span className="text-[8px] font-black bg-amber-500/20 text-amber-400 border border-amber-400/20 px-1 rounded-full">👑</span>}
                    </div>
                  )}
                  {/* Bubble */}
                  <div className={cn('px-3 py-1.5 rounded-2xl text-xs font-bold leading-snug shadow-lg',
                    isMe
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm'
                      : msg.isCreator
                        ? 'text-amber-100 rounded-bl-sm'
                        : 'text-white/85 rounded-bl-sm'
                  )}
                  style={!isMe ? {
                    background: msg.isCreator
                      ? 'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(234,88,12,0.12))'
                      : 'rgba(255,255,255,0.07)',
                    border: msg.isCreator ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.08)'
                  } : {}}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-white/20 font-bold px-1">{msg.time}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        {chatDisabled ? (
          <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-black text-rose-400">الدردشة موقوفة من قِبل المنشئ</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-md"
              style={{backgroundColor: myPlayer?.avatar_color || '#6366f1'}}>
              {myName.charAt(0)}
            </div>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
              placeholder={amCreator ? '👑 أرسل رسالة للمتسابقين...' : 'اكتب رسالتك...'}
              maxLength={150}
              className="flex-1 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none transition-all"
              style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)'}}
              onFocus={e => { e.target.style.border='1px solid rgba(99,102,241,0.5)'; e.target.style.background='rgba(255,255,255,0.1)'; }}
              onBlur={e => { e.target.style.border='1px solid rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.07)'; }}
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:scale-100 hover:scale-105 active:scale-95 shadow-lg"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
              <svg className="w-3.5 h-3.5 text-white rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );

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

  // ── EXAM VIEW (Sync QuizBot Mode) ──
  if (examStarted && !examFinished && questions.length > 0) {
    const q = questions[syncCurrentQ];
    if (!q) return <MainLayout><div className="min-h-[calc(100vh-80px)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></MainLayout>;
    const options = [
      { key: 'A', label: 'أ', text: q.option_a },
      { key: 'B', label: 'ب', text: q.option_b },
      { key: 'C', label: 'ج', text: q.option_c },
      { key: 'D', label: 'د', text: q.option_d },
    ].filter(o => o.text);

    const tpq = (room as any)?.time_per_question || 60;
    const timerPct = tpq > 0 ? (syncTimeLeft / tpq) * 100 : 0;
    const urgentTime = syncTimeLeft <= 10 && syncPhase === 'question';
    const progressPct = ((syncCurrentQ) / questions.length) * 100;
    const isRevealing = syncPhase === 'reveal';

    return (
      <MainLayout>
        <section className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-4" dir="rtl">
          <div className="container mx-auto px-4 max-w-lg">

            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between mb-3 rounded-2xl px-4 py-2.5 bg-white dark:bg-card border border-border shadow-sm">
              <div className="flex flex-col items-start">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">سؤال</span>
                <span className="text-sm font-black">{syncCurrentQ + 1} / {questions.length}</span>
              </div>
              {/* Circular Timer */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4"
                    className="text-slate-100 dark:text-slate-800" />
                  <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - timerPct / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    stroke={urgentTime ? '#ef4444' : isRevealing ? '#10b981' : '#6366f1'} />
                </svg>
                <span className={cn('font-black text-lg tabular-nums z-10 transition-all',
                  urgentTime ? 'text-rose-500 animate-pulse' : isRevealing ? 'text-emerald-600' : 'text-slate-700 dark:text-white')}>
                  {isRevealing ? '✓' : syncTimeLeft}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ترتيبك</span>
                <span className="text-sm font-black flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />#{myRank || '—'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-purple-600 transition-all duration-700"
                style={{ width: `${progressPct}%` }} />
            </div>

            {/* ── Live Leaderboard ── */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border p-3 mb-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المتسابقون الآن</p>
              </div>
              <div
                className="space-y-1.5 overflow-y-auto overscroll-contain"
                style={{ maxHeight: '220px', scrollbarWidth: 'thin' }}
              >
                {sortedPlayers.map((p, i) => (
                  <div key={p.id} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-bold transition-all',
                    p.id === myPlayerId.current ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600' : 'text-slate-600 dark:text-slate-300')}>
                    <span className="w-4 text-center font-black text-slate-400">{i + 1}</span>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black shrink-0"
                      style={{ backgroundColor: p.avatar_color || '#6366f1' }}>
                      {p.player_name.charAt(0)}
                    </div>
                    <span className="flex-1 truncate">{p.player_name}</span>
                    <span className="text-[10px] font-bold text-emerald-600">{p.correct_count} ✓</span>
                    <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${p.progress}%` }} />
                    </div>
                    {isCreator && p.id !== myPlayerId.current && !p.is_creator && (
                      <button
                        onClick={() => {
                          if (window.confirm(`هل تريد طرد ${p.player_name}؟`)) {
                            handleKickPlayer(p.id);
                          }
                        }}
                        className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center hover:bg-rose-200 transition-all shrink-0"
                        title="طرد اللاعب"
                      >
                        <UserX className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Question Card ── */}
            <div className={cn('rounded-2xl border-2 p-5 mb-3 shadow-lg transition-all duration-500 relative overflow-hidden',
              isRevealing ? 'border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20' : 'bg-white dark:bg-card border-border')}>
              {/* Question number badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-black text-indigo-600">
                  {syncCurrentQ + 1}
                </span>
                {myAnswerGiven && syncPhase === 'question' && (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> أجبت — انتظر بقية المتسابقين
                  </span>
                )}
              </div>
              <p className="font-black text-slate-900 dark:text-white text-base leading-relaxed text-right">{q.question_text}</p>
            </div>

            {/* ── Options ── */}
            <div className="space-y-2.5 mb-3 flex-shrink-0" style={{ position: 'relative', zIndex: 10 }}>
              {options.map(opt => {
                const isSelected = selectedAnswer === opt.key;
                const isCorrect = opt.key === q.correct_option;
                const isAnswered = myAnswerGiven || isRevealing;
                let style = 'bg-white dark:bg-card border-slate-200 dark:border-border';
                if (!isAnswered) style += ' hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-md cursor-pointer';
                if (isRevealing || (myAnswerGiven && isSelected)) {
                  if (isCorrect) style = 'bg-emerald-50 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-600 shadow-emerald-100 shadow-lg';
                  else if (isSelected) style = 'bg-rose-50 border-rose-400 dark:bg-rose-950/30 dark:border-rose-600';
                  else if (isRevealing) style = 'bg-slate-50 dark:bg-card border-slate-200 dark:border-border opacity-60';
                } else if (isSelected) style = 'bg-indigo-50 border-indigo-400 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-md';
                return (
                  <button key={opt.key}
                    onClick={() => handleSyncAnswer(opt.key)}
                    disabled={isAnswered}
                    className={cn('w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 text-right font-bold', style)}>
                    <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all',
                      isRevealing && isCorrect ? 'bg-emerald-500 text-white' :
                      isSelected && !isCorrect ? 'bg-rose-200 text-rose-700 dark:bg-rose-800 dark:text-rose-300' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
                      {opt.label}
                    </span>
                    <span className="flex-1 text-sm leading-snug">{opt.text}</span>
                    {(isRevealing || myAnswerGiven) && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 animate-in zoom-in-50 duration-300" />}
                    {(isRevealing || myAnswerGiven) && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* ── Reveal Banner ── */}
            {isRevealing && (
              <div className="rounded-2xl p-4 mb-3 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-400"
                style={{background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.1))',border:'1px solid rgba(16,185,129,0.3)'}}>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-black text-emerald-700 dark:text-emerald-400 text-sm">الإجابة الصحيحة</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 opacity-80">
                    {syncCurrentQ + 1 < questions.length ? 'السؤال التالي خلال ثانيتين...' : 'انتهى الاختبار!'}
                  </p>
                </div>
                {syncCurrentQ + 1 < questions.length && (
                  <div className="mr-auto w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-emerald-500" />
                  </div>
                )}
              </div>
            )}

            {/* ── Hint on wrong answer (during reveal) ── */}
            {isRevealing &&
             selectedAnswer &&
             selectedAnswer !== questions[syncCurrentQ]?.correct_option &&
             questions[syncCurrentQ]?.hint && (
              <div className="mb-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3 animate-in slide-in-from-bottom-2 duration-300">
                <span className="text-amber-500 text-lg shrink-0">💡</span>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-relaxed">
                  {questions[syncCurrentQ].hint}
                </p>
              </div>
            )}

            {/* ── Live Chat ── */}
            {renderChatPanel(!!isCreator, chatContainerRef)}

            {/* Creator controls */}
            {isCreator && (
              <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-50">
                {/* زر تنبيه الاختبار التالي */}
                <button
                  onClick={sendNextExamAlert}
                  className="flex items-center gap-2 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-xl transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    boxShadow: '0 0 20px rgba(124,58,237,0.6), 0 4px 15px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                  <Zap className="w-3.5 h-3.5 animate-pulse" />
                  لا تخرج! اختبار تالٍ
                </button>
                <button onClick={handleForceFinish}
                  className="flex items-center gap-1.5 bg-rose-600 text-white text-xs font-black px-3 py-2 rounded-xl shadow-lg hover:bg-rose-700 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> إنهاء
                </button>
              </div>
            )}
          </div>
          {renderNextExamAlert()}
        </section>
      </MainLayout>
    );
  }

  // ── إشعار الاختبار التالي (يظهر لجميع الاعبين) ──
  function renderNextExamAlert() {
    if (!showNextExamAlert) return null;
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full opacity-10 animate-ping"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        </div>
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300"
          style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)', border: '2px solid rgba(139,92,246,0.6)', boxShadow: '0 0 60px rgba(124,58,237,0.5),0 25px 50px rgba(0,0,0,0.5)' }}>
          <div className="h-1.5 w-full animate-pulse" style={{ background: 'linear-gradient(90deg,#7c3aed,#06b6d4,#a855f7)' }} />
          <div className="p-8 text-center space-y-5" dir="rtl">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center animate-bounce"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 0 40px rgba(124,58,237,0.8)' }}>
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight" style={{ textShadow: '0 0 20px rgba(139,92,246,0.9)' }}>
                ⚡ لا تغادر الغرفة!
              </h2>
              <p className="text-violet-200 font-bold text-base">سيبدأ اختبار جديد قريباً</p>
              <p className="text-violet-300/80 text-sm">ابقَ في الصفحة للمشاركة في الجولة القادمة 🚀</p>
            </div>
            <div className="flex items-center justify-center gap-2 py-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-3 h-3 rounded-full bg-violet-400"
                  style={{ animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
              ))}
            </div>
            <button onClick={() => setShowNextExamAlert(false)}
              className="w-full py-3 rounded-2xl font-black text-base text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 25px rgba(124,58,237,0.6)' }}>
              ✅ حسناً، سأبقى!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── لوحة الاختبار التالي ──
  function renderNextExamModal() {
    if (!nextExamPanel || !isCreator) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setNextExamPanel(false)}>
        <div className="w-full max-w-sm bg-white dark:bg-card rounded-t-3xl p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-300 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()} dir="rtl">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />
          <h3 className="font-black text-slate-900 dark:text-white text-center text-base">⚡ الاختبار التالي</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">سنة الاختبار</p>
              <div className="flex gap-2 flex-wrap">
                {['تجريبية','2020','2021','2022','2023','2024','2025','2026'].map(y => (
                  <button key={y} onClick={() => setNextExamYear(prev => prev === y ? '' : y)}
                    className={cn('px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all',
                      nextExamYear === y ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600' : 'border-slate-200 dark:border-border text-slate-500 hover:border-slate-300')}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">نموذج الاختبار</p>
              <div className="flex gap-2 flex-wrap">
                {([
                  { id: 'General', label: 'عام' },
                  { id: 'Parallel', label: 'موازي' },
                  { id: 'Mixed', label: 'مختلط' },
                  { id: 'Model_1', label: 'نموذج 1' },
                  { id: 'Model_2', label: 'نموذج 2' },
                  { id: 'Model_3', label: 'نموذج 3' },
                ] as {id:string,label:string}[]).map(f => (
                  <button key={f.id} onClick={() => setNextExamForm(prev => prev === f.id ? '' : f.id)}
                    className={cn('px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all',
                      nextExamForm === f.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600' : 'border-slate-200 dark:border-border text-slate-500 hover:border-slate-300')}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">وقت كل سؤال</p>
              <div className="flex gap-2 flex-wrap">
                {[{label:'15ث',val:15},{label:'30ث',val:30},{label:'1د',val:60},{label:'2د',val:120},{label:'3د',val:180},{label:'5د',val:300}].map(t => (
                  <button key={t.val} onClick={() => setNextTimePerQuestion(t.val)}
                    className={cn('px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all',
                      nextTimePerQuestion === t.val ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'border-slate-200 dark:border-border text-slate-500 hover:border-slate-300')}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">عدد الأسئلة</p>
              <div className="flex gap-2 flex-wrap">
                {[{label:'الكل',val:0},{label:'10',val:10},{label:'20',val:20},{label:'30',val:30},{label:'40',val:40},{label:'50',val:50}].map(n => (
                  <button key={n.val} onClick={() => setNextQuestionsCount(n.val)}
                    className={cn('px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all',
                      nextQuestionsCount === n.val ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-600' : 'border-slate-200 dark:border-border text-slate-500 hover:border-slate-300')}>
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <button
              onClick={() => { if (!room) return; const examLabel = [nextExamYear, nextExamForm].filter(Boolean).join(' — ') || `اختبار ${examNumber}`; handleNextExam(examLabel, nextTimePerQuestion, nextExamYear, nextExamForm); }}
              disabled={nextExamLoading}
              className="w-full h-12 rounded-2xl font-black text-sm text-white bg-gradient-to-l from-indigo-500 to-violet-600 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
              {nextExamLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {nextExamLoading ? 'جارٍ التحضير...' : 'ابدأ الاختبار التالي'}
            </button>
            <button onClick={() => setNextExamPanel(false)}
              className="w-full h-11 rounded-2xl border-2 border-slate-200 dark:border-border font-black text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-muted transition-all">
              إلغاء
            </button>
          </div>
        </div>
      </div>
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

            {/* تحدَّ أصدقاءك */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-5 shadow-2xl">
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center"><Swords className="w-5 h-5 text-blue-300" /></div>
                  <div><h3 className="font-black text-white text-sm">تحدَّ أصدقاءك!</h3><p className="text-white/50 text-xs font-bold">شارك نتيجتك وادعهم للمنافسة</p></div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/70 font-bold leading-relaxed whitespace-pre-line">
                  {getShareText(sortedPlayers.find(p => p.id === myPlayerId.current)!, myRank)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleShareWhatsApp}
                    className="h-11 rounded-xl bg-green-500/20 border border-green-400/30 text-green-300 text-sm font-black flex items-center justify-center gap-2 hover:bg-green-500/30 transition-all">
                    واتساب
                  </button>
                  <button onClick={() => { const me = sortedPlayers.find(p => p.id === myPlayerId.current); if (!me) return; const rank = sortedPlayers.indexOf(me) + 1; window.open(`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/battle/${room.code}`)}&text=${encodeURIComponent(getShareText(me, rank))}`, '_blank'); }}
                    className="h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-all">
                    تيليجرام
                  </button>
                  <button onClick={() => { const me = sortedPlayers.find(p => p.id === myPlayerId.current); if (!me) return; const rank = sortedPlayers.indexOf(me) + 1; window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/battle/${room.code}`)}&quote=${encodeURIComponent(getShareText(me, rank))}`, '_blank'); }}
                    className="h-11 rounded-xl bg-blue-700/20 border border-blue-600/30 text-blue-200 text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-700/30 transition-all">
                    فيسبوك
                  </button>
                  <button onClick={handleShare}
                    className="h-11 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-black flex items-center justify-center gap-2 hover:bg-white/20 transition-all">
                    <Copy className="w-4 h-4" /> نسخ الرسالة
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pb-4">
              {/* Share buttons row */}
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">مشاركة النتيجة</p>
              <div className="grid grid-cols-3 gap-2">
                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  disabled={!!isShareLoading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-emerald-100 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/30 hover:bg-emerald-100 transition-all disabled:opacity-50"
                >
                  {isShareLoading === 'whatsapp'
                    ? <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                    : <MessageCircle className="w-5 h-5 text-emerald-600" />}
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">واتساب</span>
                </button>
                {/* Twitter / X */}
                <button
                  onClick={handleShareTwitter}
                  disabled={!!isShareLoading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-slate-100 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  <svg className="w-5 h-5 text-slate-800 dark:text-slate-200" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">X / تويتر</span>
                </button>
                {/* Save image */}
                <button
                  onClick={handleSaveImage}
                  disabled={!!isShareLoading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-blue-100 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800/30 hover:bg-blue-100 transition-all disabled:opacity-50"
                >
                  {isShareLoading === 'save'
                    ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    : <Download className="w-5 h-5 text-blue-600" />}
                  <span className="text-[10px] font-black text-blue-700 dark:text-blue-400">حفظ صورة</span>
                </button>
              </div>

              {/* Action buttons row */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleShare} variant="outline" className="h-12 rounded-2xl font-black gap-2 border-2">
                  <Share2 className="w-4 h-4" /> مشاركة نصية
                </Button>
                <Button onClick={() => navigate('/battle/create')}
                  className="h-12 rounded-2xl font-black gap-2 bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/50">
                  <RotateCcw className="w-4 h-4" /> غرفة جديدة
                </Button>
              </div>

              {/* ── أزرار المنشئ: الاختبار التالي / الإنهاء النهائي ── */}
              {isCreator && (
                <div className="space-y-3 pt-2 border-t-2 border-dashed border-slate-200 dark:border-border">
                  <button
                    onClick={() => navigate(-1)}
                    className="w-full h-12 rounded-2xl border-2 border-slate-200 dark:border-border font-black text-sm flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-muted transition-all">
                    <ChevronLeft className="w-4 h-4" /> خروج من الغرفة
                  </button>
                  {/* زر تنبيه اللاعبين — في شاشة النتائج */}
                  <button
                    onClick={sendNextExamAlert}
                    className="w-full h-11 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)',
                      boxShadow: '0 0 20px rgba(124,58,237,0.5),0 4px 12px rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.15)'
                    }}>
                    <Zap className="w-4 h-4 animate-pulse" />
                    نبّه اللاعبين: لا تخرجوا!
                  </button>
                  <button
                    onClick={() => { setNextExamPanel(true); setNextExamYear(''); setNextExamForm(''); setNextQuestionsCount(0); }}
                    className="w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2 text-white shadow-lg shadow-indigo-200/50 bg-gradient-to-l from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 transition-all">
                    <Zap className="w-5 h-5" /> اختبار تالٍ بدون خروج 🚀
                  </button>
                  <button
                    onClick={handleFinalEnd}
                    className="w-full h-11 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 border-2 border-rose-200 dark:border-rose-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all">
                    <XCircle className="w-4 h-4" /> إنهاء الجلسة نهائياً
                  </button>
                </div>
              )}
            </div>
          </div>

          {renderNextExamModal()}
          {renderNextExamAlert()}
        </section>
      </MainLayout>
    );
  }


  // ── FINAL SESSION SUMMARY VIEW ──
  if (showFinalSummary && sessionResults.length > 0) {
    const examGroups = sessionResults.reduce((acc: any, r: any) => {
      if (!acc[r.exam_number]) acc[r.exam_number] = [];
      acc[r.exam_number].push(r);
      return acc;
    }, {});
    return (
      <MainLayout>
        <section className="min-h-[calc(100vh-80px)] py-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir="rtl">
          <div className="container mx-auto px-4 max-w-lg">
            <div className="space-y-6">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                <h2 className="text-2xl font-black">ملخص الجلسة</h2>
                <p className="text-slate-500 text-sm">{examNumber - 1} اختبار</p>
              </div>

              {Object.entries(examGroups).map(([num, group]: any) => (
                <div key={num} className="rounded-2xl border-2 border-slate-100 dark:border-border overflow-hidden">
                  <div className="bg-gradient-to-l from-primary/10 to-transparent px-4 py-3 border-b border-slate-100 dark:border-border">
                    <p className="font-black text-sm">{group[0].exam_label}</p>
                    <p className="text-xs text-slate-500">{group[0].total_questions} سؤال</p>
                  </div>
                  {group
                    .sort((a: any, b: any) => b.percentage - a.percentage)
                    .map((r: any, i: number) => (
                      <div key={r.player_id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-border/50 last:border-0">
                        <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                        <span className="font-black flex-1 text-sm">{r.player_name}</span>
                        <span className="text-xs text-emerald-600 font-bold">✅ {r.correct_count}</span>
                        <span className="text-xs text-rose-500 font-bold">❌ {r.wrong_count}</span>
                        <span className="text-xs font-black bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{Math.round(r.percentage)}%</span>
                      </div>
                    ))}
                </div>
              ))}

              <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800/50 overflow-hidden">
                <div className="bg-gradient-to-l from-amber-500/10 to-transparent px-4 py-3 border-b border-amber-100 dark:border-amber-800/30">
                  <p className="font-black text-sm text-amber-700 dark:text-amber-400">🏆 الترتيب النهائي</p>
                  <p className="text-xs text-slate-500">متوسط كل الاختبارات</p>
                </div>
                {(Object.values(
                  sessionResults.reduce((acc: any, r: any) => {
                    if (!acc[r.player_id]) acc[r.player_id] = { name: r.player_name, total: 0, count: 0 };
                    acc[r.player_id].total += r.percentage;
                    acc[r.player_id].count += 1;
                    return acc;
                  }, {})
                ) as any[])
                  .map((p: any) => ({ ...p, avg: p.total / p.count }))
                  .sort((a: any, b: any) => b.avg - a.avg)
                  .map((p: any, i: number) => (
                    <div key={p.name} className="flex items-center gap-3 px-4 py-3 border-b border-amber-50 dark:border-amber-800/20 last:border-0">
                      <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                      <span className="font-black flex-1 text-sm">{p.name}</span>
                      <span className="text-sm font-black bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-xl">{Math.round(p.avg)}%</span>
                    </div>
                  ))}
              </div>

              <button onClick={() => navigate(-1)}
                className="w-full h-12 rounded-2xl border-2 border-slate-200 dark:border-border font-black text-sm">
                خروج
              </button>
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
                  {(room.is_private || !!(room.subjects as any)?.battle_password) && <span className="flex items-center gap-1 text-xs font-bold text-amber-300"><Lock className="w-3.5 h-3.5" />خاصة</span>}
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

                  {(room.is_private || !!(room.subjects as any)?.battle_password) && (
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

                  <Button onClick={handleJoin} disabled={joining || !joinName.trim()}
                    className="w-full h-11 rounded-xl font-black bg-gradient-to-l from-amber-500 to-orange-600 text-white">
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      room.status === 'active' ? '⚡ انضم الآن (جارٍ) 🚀' : 'انضم الآن 🚀'}
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

              {/* Share link */}
              <Button onClick={() => setShowShareModal(true)}
                variant="outline" className="w-full h-11 rounded-xl font-black gap-2 border-2">
                <Copy className="w-4 h-4" /> مشاركة رابط الغرفة
              </Button>

              {/* Share Modal */}
              {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
                  <div className="w-full max-w-sm bg-white dark:bg-card rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()} dir="rtl">
                    <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2" />
                    <h3 className="font-black text-slate-900 dark:text-white text-center text-base">مشاركة الغرفة</h3>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed whitespace-pre-line border border-slate-100 dark:border-slate-700">
                      {getRoomInviteMessage()}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleRoomShareWhatsApp}
                        className="h-11 rounded-xl bg-green-500/15 border border-green-400/30 text-green-700 dark:text-green-300 text-sm font-black flex items-center justify-center gap-2 hover:bg-green-500/25 transition-all">
                        واتساب
                      </button>
                      <button onClick={handleRoomShareTelegram}
                        className="h-11 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-700 dark:text-blue-300 text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-500/25 transition-all">
                        تيليجرام
                      </button>
                      <button onClick={handleRoomShareFacebook}
                        className="h-11 rounded-xl bg-blue-700/15 border border-blue-600/30 text-blue-800 dark:text-blue-200 text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-700/25 transition-all">
                        فيسبوك
                      </button>
                      <button onClick={handleRoomCopyMessage}
                        className={`h-11 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all border ${copied ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200'}`}>
                        {copied ? <><Check className="w-4 h-4" /> تم النسخ!</> : <><Copy className="w-4 h-4" /> نسخ الرسالة</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Start button (creator) — يظهر فقط إذا كانت الغرفة في انتظار */}
              {isCreator && isJoined && room.status === 'waiting' && (
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
                  <p className="text-xs font-black text-amber-600">
                    {examNumber > 1 ? 'في انتظار المنشئ لبدء الجولة القادمة...' : 'في انتظار المنشئ للبدء...'}
                  </p>
                </div>
              )}

              {/* ── Live Chat in Waiting Room ── */}
              {isJoined && renderChatPanel(!!myPlayer?.is_creator, chatContainerRef2)}
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-bold pb-2">
            تنتهي الغرفة في {new Date(room.expires_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      {renderNextExamAlert()}
      </section>
    </MainLayout>
  );
};

export default BattleRoom;