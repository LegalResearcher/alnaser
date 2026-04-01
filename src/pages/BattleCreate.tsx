/**
 * Alnasser Tech — BattleCreate V2
 * إنشاء غرفة منافسة متقدمة: فرق، خصوصية، جدولة، نوع الأسئلة
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Swords, Users, BookOpen, Hash, Clock, ChevronLeft, Loader2,
  Copy, Check, Play, Lock, Unlock, Calendar, Users2, Shuffle,
  Shield, Zap, FlaskConical, ListOrdered, Trophy
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const AVATAR_COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'
];

type QuestionType = 'general' | 'exam' | 'trial';

interface ExamForm {
  id: string;
  form_id: string;
  form_name: string;
}

const BattleCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [creatorName, setCreatorName] = useState(() => localStorage.getItem('alnaseer_student_name') || '');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questionsCount, setQuestionsCount] = useState(20);
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [creating, setCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ code: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Advanced settings
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [allowTeams, setAllowTeams] = useState(false);
  const [team1Name, setTeam1Name] = useState('الفريق النمور 🐯');
  const [team2Name, setTeam2Name] = useState('الفريق الصقور 🦅');
  const [questionType, setQuestionType] = useState<QuestionType>('general');
  const [selectedExamYear, setSelectedExamYear] = useState('');
  const [selectedExamForm, setSelectedExamForm] = useState('');
  const [selectedTrialForm, setSelectedTrialForm] = useState('');

  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => (await supabase.from('levels').select('*').order('order_index')).data || [],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', selectedLevel],
    queryFn: async () => {
      let q = supabase.from('subjects').select('*').order('order_index');
      if (selectedLevel) q = q.eq('level_id', selectedLevel);
      return (await q).data || [];
    },
  });

  const { data: examForms = [] } = useQuery<ExamForm[]>({
    queryKey: ['exam-forms', selectedSubject],
    queryFn: async () => {
      const { data } = await (supabase.from('subject_exam_forms' as any) as any)
        .select('*').eq('subject_id', selectedSubject).order('order_index');
      return data || [];
    },
    enabled: !!selectedSubject,
  });

  const { data: availableCount = 0 } = useQuery({
    queryKey: ['battle-q-count', selectedSubject, questionType, selectedExamYear, selectedExamForm, selectedTrialForm],
    queryFn: async () => {
      let q = supabase.from('questions').select('*', { count: 'exact', head: true })
        .eq('subject_id', selectedSubject).eq('status', 'active');
      if (questionType === 'exam' && selectedExamYear) q = q.eq('exam_year', parseInt(selectedExamYear));
      if (questionType === 'exam' && selectedExamForm) q = q.eq('exam_form', selectedExamForm);
      if (questionType === 'trial' && selectedTrialForm) q = q.eq('exam_form', selectedTrialForm);
      const { count } = await q;
      return count || 0;
    },
    enabled: !!selectedSubject,
  });

  const maxQ = Math.min(availableCount, 60);

  // الحصول على سنوات الاختبارات المتاحة
  const { data: examYears = [] } = useQuery({
    queryKey: ['exam-years', selectedSubject],
    queryFn: async () => {
      const { data } = await supabase.from('questions').select('exam_year')
        .eq('subject_id', selectedSubject).eq('status', 'active').not('exam_year', 'is', null);
      const years = [...new Set((data || []).map((r: any) => r.exam_year))].sort((a, b) => b - a);
      return years as number[];
    },
    enabled: !!selectedSubject && questionType === 'exam',
  });

  const handleCreate = async () => {
    if (!creatorName.trim()) { toast({ title: 'أدخل اسمك', variant: 'destructive' }); return; }
    if (!selectedSubject) { toast({ title: 'اختر المادة', variant: 'destructive' }); return; }
    if (availableCount < 5) { toast({ title: 'لا توجد أسئلة كافية', variant: 'destructive' }); return; }
    if (isPrivate && !password.trim()) { toast({ title: 'أدخل كلمة مرور للغرفة الخاصة', variant: 'destructive' }); return; }

    setCreating(true);
    try {
      let query = supabase.from('questions').select('id')
        .eq('subject_id', selectedSubject).eq('status', 'active');
      if (questionType === 'exam' && selectedExamYear) query = query.eq('exam_year', parseInt(selectedExamYear));
      if (questionType === 'exam' && selectedExamForm) query = query.eq('exam_form', selectedExamForm);
      if (questionType === 'trial' && selectedTrialForm) query = query.eq('exam_form', selectedTrialForm);

      const { data: questions } = await query;
      const shuffled = (questions || []).sort(() => Math.random() - 0.5).slice(0, questionsCount);
      const questionIds = shuffled.map((q: any) => q.id);

      const code = generateCode();
      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      const { data: room, error } = await (supabase.from('battle_rooms' as any) as any).insert({
        code,
        subject_id: selectedSubject,
        creator_name: creatorName.trim(),
        status: 'waiting',
        max_players: maxPlayers,
        questions_count: questionsCount,
        time_minutes: timeMinutes,
        question_ids: questionIds,
        is_private: isPrivate,
        password: isPrivate ? password.trim() : null,
        allow_teams: allowTeams,
        team1_name: allowTeams ? team1Name : null,
        team2_name: allowTeams ? team2Name : null,
        question_type: questionType,
        exam_year: selectedExamYear ? parseInt(selectedExamYear) : null,
        exam_form_id: selectedExamForm || selectedTrialForm || null,
        locked: false,
        expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      }).select().single();

      if (error) throw error;

      await (supabase.from('battle_players' as any) as any).insert({
        room_id: room.id,
        player_name: creatorName.trim(),
        is_creator: true,
        status: 'waiting',
        avatar_color: avatarColor,
        team: allowTeams ? 'team1' : null,
      });

      localStorage.setItem('alnaseer_student_name', creatorName.trim());
      setCreatedRoom({ code: room.code, id: room.id });

    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/battle/${createdRoom?.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterRoom = () => {
    navigate(`/battle/${createdRoom?.code}`, {
      state: { playerName: creatorName, isCreator: true },
    });
  };

  if (createdRoom) {
    return (
      <MainLayout>
        <section className="py-8 min-h-[calc(100vh-80px)] flex items-center" dir="rtl">
          <div className="container mx-auto px-4 max-w-sm">
            <div className="relative bg-white dark:bg-card rounded-[2rem] border border-slate-100 dark:border-border shadow-2xl overflow-hidden">
              {/* Header glow */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-10 text-center relative overflow-hidden">
                <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle at 30% 70%, rgba(245,158,11,0.15) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(99,102,241,0.2) 0%, transparent 60%)'}} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-amber-500/25 blur-2xl" />
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/30">
                    <Swords className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-xs font-black text-amber-400 uppercase tracking-[0.3em] mb-2">كود الغرفة</p>
                  <div className="text-6xl font-black text-white tracking-[0.25em] font-mono">
                    {createdRoom.code}
                  </div>
                  {isPrivate && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-bold px-3 py-1 rounded-full">
                      <Lock className="w-3 h-3" /> غرفة خاصة · كلمة المرور: {password}
                    </div>
                  )}
                  {allowTeams && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-bold px-3 py-1 rounded-full">
                      <Users2 className="w-3 h-3" /> وضع الفرق مفعّل
                    </div>
                  )}
                </div>
              </div>

              <div className="p-7 space-y-3">
                <p className="text-center text-sm text-slate-500 font-bold">شارك الكود مع أصدقائك للانضمام</p>
                <Button onClick={handleCopy} variant="outline" className="w-full h-12 rounded-2xl font-black gap-2 border-2">
                  {copied ? <><Check className="w-4 h-4 text-emerald-500" /> تم النسخ!</> : <><Copy className="w-4 h-4" /> نسخ رابط الغرفة</>}
                </Button>
                <Button onClick={handleEnterRoom} className="w-full h-13 rounded-2xl font-black gap-2 bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/50 text-base">
                  <Play className="w-5 h-5" /> دخول الغرفة
                </Button>
                <p className="text-center text-[10px] text-slate-400 font-bold">
                  الغرفة صالحة 3 ساعات · حد أقصى {maxPlayers} لاعبين
                </p>
              </div>
            </div>
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="py-8 min-h-[calc(100vh-80px)]" dir="rtl">
        <div className="container mx-auto px-4 max-w-lg">

          <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-primary transition-colors bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl px-4 py-2">
            <ChevronLeft className="w-4 h-4" /> رجوع
          </button>

          <div className="bg-white dark:bg-card rounded-[2rem] border border-slate-100 dark:border-border shadow-xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-8 py-10 text-center overflow-hidden">
              <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize:'28px 28px'}} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-16 bg-amber-500/20 blur-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/30">
                  <Swords className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-white">إنشاء غرفة منافسة</h1>
                <p className="text-blue-300 text-sm font-bold mt-1">تحدَّ أصدقاءك في الوقت الفعلي</p>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-6 space-y-5">

              {/* اسمك */}
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">اسمك (منشئ الغرفة)</Label>
                <Input
                  placeholder="أدخل اسمك الكامل"
                  value={creatorName}
                  onChange={e => { setCreatorName(e.target.value); localStorage.setItem('alnaseer_student_name', e.target.value); }}
                  className="h-12 rounded-[1rem] bg-slate-50 dark:bg-muted border-slate-200 dark:border-border font-bold text-right"
                />
              </div>

              {/* المستوى */}
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> المستوى</Label>
                <Select value={selectedLevel} onValueChange={v => { setSelectedLevel(v); setSelectedSubject(''); }}>
                  <SelectTrigger className="h-12 rounded-[1rem] bg-slate-50 dark:bg-muted border-slate-200 font-bold"><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
                  <SelectContent className="z-[9999] bg-white dark:bg-card rounded-2xl shadow-2xl">
                    {levels.map((l: any) => <SelectItem key={l.id} value={l.id} className="font-bold rounded-xl">{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* المادة */}
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">المادة</Label>
                <Select value={selectedSubject} onValueChange={v => { setSelectedSubject(v); setSelectedExamYear(''); setSelectedExamForm(''); setSelectedTrialForm(''); }} disabled={!selectedLevel}>
                  <SelectTrigger className="h-12 rounded-[1rem] bg-slate-50 dark:bg-muted border-slate-200 font-bold"><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent className="z-[9999] bg-white dark:bg-card rounded-2xl shadow-2xl max-h-[260px]">
                    {subjects.map((s: any) => <SelectItem key={s.id} value={s.id} className="font-bold rounded-xl">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* نوع الأسئلة */}
              {selectedSubject && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-[1.25rem] border border-slate-100 dark:border-border">
                  <Label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5" /> نوع الأسئلة
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'general', label: 'عام', sub: 'كل الأسئلة', icon: <Shuffle className="w-4 h-4" /> },
                      { key: 'exam', label: 'اختبار سنوي', sub: 'حسب السنة', icon: <ListOrdered className="w-4 h-4" /> },
                      { key: 'trial', label: 'تجريبي', sub: 'نموذج محدد', icon: <FlaskConical className="w-4 h-4" /> },
                    ].map(opt => (
                      <button key={opt.key} onClick={() => { setQuestionType(opt.key as QuestionType); setSelectedExamYear(''); setSelectedExamForm(''); setSelectedTrialForm(''); }}
                        className={cn('flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-black',
                          questionType === opt.key ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-border text-slate-500 hover:border-slate-300')}>
                        {opt.icon}
                        <span>{opt.label}</span>
                        <span className="text-[9px] font-semibold opacity-70">{opt.sub}</span>
                      </button>
                    ))}
                  </div>

                  {/* سنة الاختبار */}
                  {questionType === 'exam' && examYears.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">سنة الاختبار</Label>
                      <Select value={selectedExamYear} onValueChange={setSelectedExamYear}>
                        <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-card border-slate-200 font-bold text-sm"><SelectValue placeholder="اختر السنة (اختياري)" /></SelectTrigger>
                        <SelectContent className="z-[9999] bg-white dark:bg-card rounded-2xl shadow-2xl">
                          {examYears.map(y => <SelectItem key={y} value={String(y)} className="font-bold">{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {selectedExamYear && examForms.length > 0 && (
                        <Select value={selectedExamForm} onValueChange={setSelectedExamForm}>
                          <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-card border-slate-200 font-bold text-sm"><SelectValue placeholder="النموذج (عام / موازي / مختلط)" /></SelectTrigger>
                          <SelectContent className="z-[9999] bg-white dark:bg-card rounded-2xl shadow-2xl">
                            {examForms.map((f: ExamForm) => <SelectItem key={f.id} value={f.form_id} className="font-bold">{f.form_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* نموذج تجريبي */}
                  {questionType === 'trial' && examForms.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">النموذج التجريبي</Label>
                      <Select value={selectedTrialForm} onValueChange={setSelectedTrialForm}>
                        <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-card border-slate-200 font-bold text-sm"><SelectValue placeholder="اختر النموذج" /></SelectTrigger>
                        <SelectContent className="z-[9999] bg-white dark:bg-card rounded-2xl shadow-2xl">
                          {examForms.map((f: ExamForm) => <SelectItem key={f.id} value={f.form_id} className="font-bold">{f.form_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedSubject && (
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {availableCount} سؤال متاح بهذه الفلاتر
                    </p>
                  )}
                </div>
              )}

              {/* عدد الأسئلة */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-[1.25rem] border border-slate-100 dark:border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">عدد الأسئلة</Label>
                  <span className="text-primary font-black text-sm bg-primary/10 px-3 py-1 rounded-xl">{questionsCount} سؤال</span>
                </div>
                <Slider value={[questionsCount]} onValueChange={([v]) => setQuestionsCount(v)} min={5} max={Math.max(maxQ, 5)} step={5} disabled={!selectedSubject} className="py-1" />
              </div>

              {/* الوقت */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-[1.25rem] border border-slate-100 dark:border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> وقت الاختبار</Label>
                  <span className="text-primary font-black text-sm bg-primary/10 px-3 py-1 rounded-xl">{timeMinutes} دقيقة</span>
                </div>
                <Slider value={[timeMinutes]} onValueChange={([v]) => setTimeMinutes(v)} min={10} max={120} step={5} className="py-1" />
              </div>

              {/* الحد الأقصى */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-[1.25rem] border border-slate-100 dark:border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> الحد الأقصى</Label>
                  <span className="text-primary font-black text-sm bg-primary/10 px-3 py-1 rounded-xl">{maxPlayers} لاعبين</span>
                </div>
                <Slider value={[maxPlayers]} onValueChange={([v]) => setMaxPlayers(v)} min={2} max={20} step={1} className="py-1" />
              </div>

              {/* ── إعدادات متقدمة ── */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/20 dark:to-muted rounded-[1.25rem] border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> إعدادات متقدمة
                </p>

                {/* غرفة خاصة */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPrivate ? <Lock className="w-4 h-4 text-indigo-500" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">غرفة خاصة بكلمة مرور</span>
                  </div>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>
                {isPrivate && (
                  <Input placeholder="كلمة مرور الغرفة" value={password} onChange={e => setPassword(e.target.value)}
                    className="h-10 rounded-xl bg-white dark:bg-card border-slate-200 font-bold text-right" />
                )}

                {/* وضع الفرق */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">وضع الفرق (2 فريق)</span>
                  </div>
                  <Switch checked={allowTeams} onCheckedChange={setAllowTeams} />
                </div>
                {allowTeams && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="اسم الفريق الأول" value={team1Name} onChange={e => setTeam1Name(e.target.value)}
                      className="h-10 rounded-xl bg-white dark:bg-card border-indigo-200 font-bold text-right text-sm" />
                    <Input placeholder="اسم الفريق الثاني" value={team2Name} onChange={e => setTeam2Name(e.target.value)}
                      className="h-10 rounded-xl bg-white dark:bg-card border-rose-200 font-bold text-right text-sm" />
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreate}
                disabled={creating || !creatorName.trim() || !selectedSubject}
                className="w-full h-14 rounded-[1.25rem] font-black text-white text-base gap-2 bg-gradient-to-l from-amber-500 to-orange-600 shadow-lg shadow-amber-200/50 hover:-translate-y-0.5 transition-all"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Swords className="w-5 h-5" /> إنشاء الغرفة</>}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default BattleCreate;
