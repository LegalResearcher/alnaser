import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, Trophy, Clock, User, Play, Check, Loader2, AlertCircle, Target, ChevronLeft, Flame, Crown, Medal, Copy } from 'lucide-react';
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
  challenger_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_seconds: number | null;
  created_at: string;
}

function Leaderboard({ results, creatorName, creatorPct, creatorTime, totalQ }: {
  results: ChallengeResult[];
  creatorName: string;
  creatorPct: number | null;
  creatorTime: number | null;
  totalQ: number;
}) {
  const formatTime = (s: number | null) => !s ? '—' : `${Math.floor(s / 60)}د ${s % 60}ث`;
  const all = [
    ...(creatorPct !== null ? [{ challenger_name: creatorName, score: 0, total_questions: totalQ, percentage: creatorPct, time_seconds: creatorTime, created_at: '', isCreator: true }] : []),
    ...results.map(r => ({ ...r, isCreator: false })),
  ].sort((a, b) => b.percentage !== a.percentage ? b.percentage - a.percentage : (a.time_seconds && b.time_seconds ? a.time_seconds - b.time_seconds : 0));

  const rankColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];
  const RankIcons = [Crown, Medal, Medal];

  return (
    <div className="divide-y divide-border">
      {all.map((r, i) => {
        const RankIcon = RankIcons[i] || Target;
        return (
          <div key={i} className="flex items-center gap-3 py-3 px-1">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              {i < 3 ? <RankIcon className={cn("w-4 h-4", rankColors[i])} /> : <span className="text-xs font-black text-muted-foreground">{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-black text-sm text-foreground truncate">{r.challenger_name}</p>
                {(r as any).isCreator && <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">المنشئ</span>}
              </div>
              <p className="text-[10px] text-muted-foreground font-bold">{formatTime(r.time_seconds)}</p>
            </div>
            <span className={cn("font-black text-lg", r.percentage >= 80 ? 'text-emerald-600' : r.percentage >= 60 ? 'text-amber-500' : 'text-rose-500')}>{r.percentage}%</span>
          </div>
        );
      })}
      {all.length === 0 && (
        <div className="py-8 text-center">
          <Swords className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-bold">لا أحد قبل التحدي بعد</p>
        </div>
      )}
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

  useEffect(() => {
    if (!sessionId) return;
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('challenge_sessions').select('*, subjects(name, default_time_minutes)').eq('id', sessionId).single();
      if (error || !data) { setLoading(false); return; }
      setSession({ ...data, question_ids: data.question_ids as string[] } as ChallengeSession);
      setExpired(new Date(data.expires_at) < new Date());
      const { data: res } = await supabase.from('challenge_results').select('*').eq('session_id', sessionId).order('percentage', { ascending: false });
      if (res) setResults(res as ChallengeResult[]);
      setLoading(false);
    };
    fetchData();
  }, [sessionId]);

  const handleStart = () => {
    if (!name.trim() || !session) return;
    navigate(`/exam/${session.subject_id}/start`, {
      state: {
        studentName: name,
        examYear: session.exam_year || 0,
        examForm: session.exam_form || 'Mixed',
        examTime: (session.subjects as any)?.default_time_minutes || 30,
        questionsCount: session.question_ids.length,
        subjectName: (session.subjects as any)?.name,
        challengeMode: true,
        challengeSessionId: sessionId,
        forcedQuestionIds: session.question_ids,
      },
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

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

  const totalQ = session.question_ids.length;

  return (
    <MainLayout>
      <section className="py-8 md:py-16 min-h-[calc(100vh-80px)]" dir="rtl">
        <div className="container mx-auto px-4 md:px-6 max-w-xl">

          <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-xs font-black text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" /> رجوع
          </button>

          <div className="bg-card rounded-3xl border border-border overflow-hidden mb-6">
            <div className="p-6 md:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Swords className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-foreground mb-1">تحدي المبارزة</h1>
              <p className="text-sm text-muted-foreground font-bold mb-1">{(session.subjects as any)?.name}</p>
              <p className="text-xs text-muted-foreground">أرسل لك {session.creator_name} تحدياً</p>
              {session.creator_percentage !== null && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="text-center">
                    <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground font-bold">نتيجة المنشئ</p>
                    <p className="text-lg font-black text-foreground">{session.creator_percentage}%</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground font-bold">الأسئلة</p>
                    <p className="text-lg font-black text-foreground">{totalQ}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {expired ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-center mb-6">
              <AlertCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
              <p className="text-sm font-black text-destructive">انتهت صلاحية هذا التحدي (48 ساعة)</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <label className="text-xs font-black text-muted-foreground mb-2 block">اسمك</label>
              <Input placeholder="أدخل اسمك" value={name} onChange={e => setName(e.target.value)} className="h-13 rounded-xl font-bold bg-muted/50 border-border focus:border-primary mb-4" />
              <Button onClick={handleStart} disabled={!name.trim()} className="w-full h-13 rounded-2xl font-black bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-lg">
                <Play className="w-5 h-5 ml-2" /> ابدأ التحدي
              </Button>
            </div>
          )}

          <Button variant="outline" onClick={handleCopyLink} className="w-full rounded-2xl font-black mb-6 h-12">
            {copied ? <><Check className="w-4 h-4 ml-2" /> تم نسخ الرابط!</> : <><Copy className="w-4 h-4 ml-2" /> نسخ رابط التحدي</>}
          </Button>

          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="font-black text-foreground">لوحة المتسابقين</h2>
              <span className="mr-auto text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{results.length + (session.creator_percentage !== null ? 1 : 0)} مشارك</span>
            </div>
            <div className="p-4">
              <Leaderboard results={results} creatorName={session.creator_name} creatorPct={session.creator_percentage} creatorTime={session.creator_time_seconds} totalQ={totalQ} />
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ChallengePage;
