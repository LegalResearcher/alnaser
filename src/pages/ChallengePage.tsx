import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Swords, Trophy, Clock, Target, Play, Check, Loader2,
  AlertCircle, ChevronLeft, Flame, Crown, Medal, Copy,
  CheckCircle2, XCircle, BarChart3, Users, RefreshCw
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChallengeSession {
  id: string;
  subject_id: string;
  creator_name: string;
  creator_score: number | null;
  creator_percentage: number | null;
  creator_time_seconds: number | null;
  question_ids: string[];
  exam_year: number | null;
  exam_form: string | null;
  expires_at: string;
  subjects?: { name: string; default_time_minutes: number };
}

interface ChallengeResult {
  id?: string;
  challenger_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_seconds: number | null;
  created_at: string;
}

interface ParticipantRow extends ChallengeResult {
  isCreator: boolean;
  rank: number;
}

const formatTime = (s: number | null) => {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}د ${sec}ث` : `${sec}ث`;
};

const rankColor = (pct: number) =>
  pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-500' : 'text-rose-500';

const rankBg = (pct: number) =>
  pct >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/30' : pct >= 60 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-rose-50 dark:bg-rose-950/30';

function ParticipantCard({ p, totalQ }: { p: ParticipantRow; totalQ: number }) {
  const wrong = p.total_questions - p.score;
  const RankIcon = p.rank === 1 ? Crown : p.rank === 2 ? Medal : p.rank === 3 ? Medal : null;
  const rankIconColor = p.rank === 1 ? 'text-yellow-500' : p.rank === 2 ? 'text-slate-400' : 'text-amber-600';

  return (
    <div className={cn('rounded-2xl border p-4 space-y-3 transition-all', rankBg(p.percentage),
      p.rank === 1 ? 'border-yellow-300 dark:border-yellow-700' : 'border-border')}>
      <div className="flex items-center gap-3">
        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-black text-sm',
          p.rank <= 3 ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-muted')}>
          {RankIcon
            ? <RankIcon className={cn('w-5 h-5', rankIconColor)} />
            : <span className="text-muted-foreground">{p.rank}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-black text-sm truncate">{p.challenger_name}</p>
            {p.isCreator && (
              <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">المنشئ</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatTime(p.time_seconds)}
          </p>
        </div>
        <span className={cn('font-black text-2xl', rankColor(p.percentage))}>{p.percentage}%</span>
      </div>

      <div className="w-full bg-white/60 dark:bg-black/20 rounded-full h-2 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700',
          p.percentage >= 80 ? 'bg-emerald-500' : p.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500')}
          style={{ width: `${p.percentage}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/60 dark:bg-black/20 rounded-xl py-2 px-1">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-black text-emerald-600">{p.score}</span>
          </div>
          <p className="text-[9px] text-muted-foreground font-semibold">صحيح</p>
        </div>
        <div className="bg-white/60 dark:bg-black/20 rounded-xl py-2 px-1">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-xs font-black text-rose-600">{wrong}</span>
          </div>
          <p className="text-[9px] text-muted-foreground font-semibold">خطأ</p>
        </div>
        <div className="bg-white/60 dark:bg-black/20 rounded-xl py-2 px-1">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-black text-blue-600">{p.total_questions}</span>
          </div>
          <p className="text-[9px] text-muted-foreground font-semibold">أجاب</p>
        </div>
      </div>
    </div>
  );
}

const ChallengePage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<ChallengeSession | null>(null);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchResults = useCallback(async () => {
    if (!sessionId) return;
    const { data: res } = await supabase
      .from('challenge_results')
      .select('*')
      .eq('session_id', sessionId)
      .order('percentage', { ascending: false });
    if (res) { setResults(res as ChallengeResult[]); setLastUpdated(new Date()); }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const init = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('challenge_sessions')
        .select('*, subjects(name, default_time_minutes)')
        .eq('id', sessionId).single();
      if (error || !data) { setLoading(false); return; }
      setSession({ ...data, question_ids: data.question_ids as string[] } as ChallengeSession);
      setExpired(new Date(data.expires_at) < new Date());
      await fetchResults();
      setLoading(false);
    };
    init();
  }, [sessionId, fetchResults]);

  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`challenge-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'challenge_results',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const newResult = payload.new as ChallengeResult;
        setResults(prev => [...prev, newResult].sort((a, b) =>
          b.percentage !== a.percentage ? b.percentage - a.percentage
            : (a.time_seconds && b.time_seconds ? a.time_seconds - b.time_seconds : 0)));
        setLastUpdated(new Date());
        toast({ title: `🎯 ${newResult.challenger_name} أنهى الاختبار!`, description: `حصل على ${newResult.percentage}%` });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, toast]);

  const handleStart = () => {
    if (!name.trim() || !session) return;
    navigate(`/exam/${session.subject_id}/start`, {
      state: {
        studentName: name, examYear: session.exam_year || 0,
        examForm: session.exam_form || 'Mixed',
        examTime: (session.subjects as any)?.default_time_minutes || 30,
        questionsCount: session.question_ids.length,
        subjectName: (session.subjects as any)?.name,
        challengeMode: true, challengeSessionId: sessionId,
        forcedQuestionIds: session.question_ids,
      },
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const buildLeaderboard = (): ParticipantRow[] => {
    if (!session) return [];
    const all = [
      ...(session.creator_percentage !== null ? [{
        challenger_name: session.creator_name, score: session.creator_score || 0,
        total_questions: session.question_ids.length, percentage: session.creator_percentage,
        time_seconds: session.creator_time_seconds, created_at: '', isCreator: true,
      } as any] : []),
      ...results.map(r => ({ ...r, isCreator: false })),
    ].sort((a, b) => b.percentage !== a.percentage ? b.percentage - a.percentage
      : (a.time_seconds && b.time_seconds ? a.time_seconds - b.time_seconds : 0));
    return all.map((r, i) => ({ ...r, rank: i + 1 }));
  };

  const leaderboard = buildLeaderboard();
  const totalQ = session?.question_ids.length || 0;
  const participantCount = leaderboard.length;
  const avgPct = participantCount > 0
    ? Math.round(leaderboard.reduce((s, r) => s + r.percentage, 0) / participantCount) : 0;

  if (loading) return <MainLayout><div className="container mx-auto px-4 py-24 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div></MainLayout>;

  if (!session) return (
    <MainLayout>
      <div className="container mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-xl font-black text-muted-foreground mb-6">التحدي غير موجود أو انتهت صلاحيته</p>
        <Button onClick={() => navigate('/levels')} className="rounded-2xl font-black">العودة للمستويات</Button>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <section className="py-8 md:py-16 min-h-[calc(100vh-80px)]" dir="rtl">
        <div className="container mx-auto px-4 md:px-6 max-w-xl">

          <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-xs font-black text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" /> رجوع
          </button>

          {/* رأس التحدي */}
          <div className="bg-card rounded-3xl border border-border overflow-hidden mb-4">
            <div className="p-6 md:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Swords className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-foreground mb-1">اختبار جماعي</h1>
              <p className="text-sm font-bold text-muted-foreground mb-0.5">{(session.subjects as any)?.name}</p>
              <p className="text-xs text-muted-foreground">أنشأه {session.creator_name}</p>
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="bg-muted/50 rounded-2xl py-3 px-2 text-center">
                  <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-black">{participantCount}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">مشارك</p>
                </div>
                <div className="bg-muted/50 rounded-2xl py-3 px-2 text-center">
                  <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-black">{totalQ}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">سؤال</p>
                </div>
                <div className="bg-muted/50 rounded-2xl py-3 px-2 text-center">
                  <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className={cn('text-lg font-black', rankColor(avgPct))}>{participantCount > 0 ? `${avgPct}%` : '—'}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">متوسط</p>
                </div>
              </div>
            </div>
          </div>

          {/* نموذج الدخول */}
          {!expired ? (
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <label className="text-xs font-black text-muted-foreground mb-2 block">اسمك للمشاركة</label>
              <Input placeholder="أدخل اسمك الكامل" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
                className="h-12 rounded-xl font-bold bg-muted/50 border-border focus:border-primary mb-3" />
              <Button onClick={handleStart} disabled={!name.trim()}
                className="w-full h-12 rounded-2xl font-black bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-lg">
                <Play className="w-5 h-5 ml-2" /> ابدأ الاختبار
              </Button>
            </div>
          ) : (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
              <p className="text-sm font-black text-destructive">انتهت صلاحية هذا التحدي</p>
            </div>
          )}

          <Button variant="outline" onClick={handleCopyLink} className="w-full rounded-2xl font-black mb-6 h-11">
            {copied ? <><Check className="w-4 h-4 ml-2 text-emerald-500" /> تم نسخ الرابط!</> : <><Copy className="w-4 h-4 ml-2" /> مشاركة رابط الاختبار</>}
          </Button>

          {/* لوحة النتائج المباشرة */}
          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="font-black text-foreground">النتائج المباشرة</h2>
              <div className="mr-auto flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{participantCount} مشارك</span>
                <button onClick={fetchResults} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="px-4 py-2 border-b border-border/50 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-muted-foreground font-semibold">
                مباشر · آخر تحديث {lastUpdated.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
            <div className="p-4 space-y-3">
              {leaderboard.length === 0 ? (
                <div className="py-10 text-center">
                  <Swords className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm font-black text-muted-foreground">لم يُكمل أحد الاختبار بعد</p>
                  <p className="text-xs text-muted-foreground mt-1">كن أول من يدخل التحدي!</p>
                </div>
              ) : (
                leaderboard.map((p, i) => <ParticipantCard key={i} p={p} totalQ={totalQ} />)
              )}
            </div>
          </div>

        </div>
      </section>
    </MainLayout>
  );
};

export default ChallengePage;
