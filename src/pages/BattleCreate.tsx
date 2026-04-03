/**
 * Alnasser Tech — BattleCreate V2
 * إنشاء غرفة منافسة متقدمة: فرق، خصوصية، جدولة، نوع الأسئلة
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Swords, Users, BookOpen, Hash, Clock, ChevronLeft, Loader2,
  Copy, Check, Play, Lock, Unlock, Users2,
  Zap, FlaskConical
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

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const AVATAR_COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'
];

type QuestionType = 'general' | 'exam' | 'trial' | 'all';

interface ExamForm {
  id: string;
  form_id: string;
  form_name: string;
}

const EXAM_FORMS = [
  { id: 'General',  name: 'نموذج العام' },
  { id: 'Parallel', name: 'نموذج الموازي' },
  { id: 'Mixed',    name: 'نموذج مختلط' },
];

const EXAM_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;

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
  const [showShareModal, setShowShareModal] = useState(false);

  // Advanced settings
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [allowTeams, setAllowTeams] = useState(false);
  const [team1Name, setTeam1Name] = useState('الفريق النمور 🐯');
  const [team2Name, setTeam2Name] = useState('الفريق الصقور 🦅');
  const [questionType, setQuestionType] = useState<QuestionType>('general');
  const [selectedExamYear, setSelectedExamYear] = useState('');
  const [selectedExamForm, setSelectedExamForm] = useState('General');
  const [selectedTrialForm, setSelectedTrialForm] = useState('all');

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

  // بيانات المادة المختارة (تشمل battle_disabled و battle_password)
  const selectedSubjectData = useMemo(
    () => (subjects as any[]).find((s: any) => s.id === selectedSubject) || null,
    [subjects, selectedSubject]
  );

  const { data: examForms = [] } = useQuery<ExamForm[]>({
    queryKey: ['exam-forms', selectedSubject],
    queryFn: async () => {
      const { data } = await (supabase.from('subject_exam_forms' as any) as any)
        .select('*').eq('subject_id', selectedSubject).order('order_index');
      return data || [];
    },
    enabled: !!selectedSubject,
  });

  // نماذج تجريبية: افتراضي 15 نموذج + أي نماذج مخصصة من قاعدة البيانات
  const defaultTrialForms = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({ id: `Model_${i + 1}`, name: `نموذج ${i + 1}`, order_index: i + 1 })),
  []);

  const activeTrialForms = useMemo(() => {
    const customs = examForms.map((f: any) => ({ id: f.form_id, name: f.form_name, order_index: (f as any).order_index ?? 999 }));
    return [...defaultTrialForms, ...customs].sort((a, b) => a.order_index - b.order_index).map(({ id, name }) => ({ id, name }));
  }, [defaultTrialForms, examForms]);

  const { data: availableCount = 0 } = useQuery({
    queryKey: ['battle-q-count', selectedSubject, selectedExamYear, selectedExamForm, selectedTrialForm],
    queryFn: async () => {
      let q = supabase.from('questions').select('*', { count: 'exact', head: true })
        .eq('subject_id', selectedSubject).eq('status', 'active');
      if (selectedExamYear === 'trial') {
        q = q.is('exam_year', null);
        if (selectedTrialForm !== 'all') q = q.eq('exam_form', selectedTrialForm);
      } else if (selectedExamYear !== 'all' && selectedExamYear) {
        q = q.not('exam_year', 'is', null);
        q = q.eq('exam_year', parseInt(selectedExamYear));
        if (selectedExamForm && selectedExamForm !== 'Mixed') q = q.eq('exam_form', selectedExamForm);
      }
      // 'all' → no extra filters
      const { count } = await q;
      return count || 0;
    },
    enabled: !!selectedSubject,
  });

  const maxQ = availableCount;

  // عند تغيير الفلاتر: اضبط عدد الأسئلة تلقائياً ليكون كل الأسئلة المتاحة
  useEffect(() => {
    if (availableCount > 0) {
      setQuestionsCount(availableCount);
    }
  }, [availableCount]);

  // سنوات الاختبارات - ثابتة
  const examYears = [...EXAM_YEARS].reverse();

  const handleCreate = async () => {
    if (!creatorName.trim()) { toast({ title: 'أدخل اسمك', variant: 'destructive' }); return; }
    if (!selectedSubject) { toast({ title: 'اختر المادة', variant: 'destructive' }); return; }
    if (!selectedExamYear) { toast({ title: 'اختر نموذج سنة الاختبار', variant: 'destructive' }); return; }
    if (availableCount < 5) { toast({ title: 'لا توجد أسئلة كافية', variant: 'destructive' }); return; }
    if (isPrivate && !password.trim()) { toast({ title: 'أدخل كلمة مرور للغرفة الخاصة', variant: 'destructive' }); return; }

    // ── التحقق من إيقاف الغرف في هذه المادة ──
    if ((selectedSubjectData as any)?.battle_disabled) {
      toast({
        title: 'غرف التحدي موقوفة',
        description: 'تم إيقاف إنشاء غرف التحدي لهذه المادة من قِبل الإدارة.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      let query = supabase.from('questions').select('id')
        .eq('subject_id', selectedSubject).eq('status', 'active');
      if (selectedExamYear === 'trial') {
        query = query.is('exam_year', null);
        if (selectedTrialForm !== 'all') query = query.eq('exam_form', selectedTrialForm);
      } else if (selectedExamYear !== 'all' && selectedExamYear) {
        query = query.not('exam_year', 'is', null);
        query = query.eq('exam_year', parseInt(selectedExamYear));
        if (selectedExamForm && selectedExamForm !== 'Mixed') query = query.eq('exam_form', selectedExamForm);
      }
      // 'all' → no extra filters

      const { data: questions } = await query;
      const shuffled = (questions || []).sort(() => Math.random() - 0.5).slice(0, questionsCount);
      const questionIds = shuffled.map((q: any) => q.id);

      const code = generateCode();
      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      // كلمة مرور الغرفة: إما من الأدمن (battle_password) أو من المستخدم إذا اختار خاصة
      const adminPassword: string | null = (selectedSubjectData as any)?.battle_password || null;
      const finalPassword = adminPassword || (isPrivate ? password.trim() : null);
      const finalIsPrivate = !!finalPassword;

      const examFormName = selectedExamYear === 'trial'
        ? (activeTrialForms.find(f => f.id === selectedTrialForm)?.name || 'كل النماذج')
        : selectedExamYear === 'all'
        ? 'جميع الأسئلة'
        : (EXAM_FORMS.find(f => f.id === selectedExamForm)?.name || 'نموذج العام');

      const qType = selectedExamYear === 'trial' ? 'trial' : selectedExamYear === 'all' ? 'general' : 'exam';

      const { data: room, error } = await (supabase.from('battle_rooms' as any) as any).insert({
        code,
        subject_id: selectedSubject,
        creator_name: creatorName.trim(),
        status: 'waiting',
        max_players: maxPlayers,
        questions_count: questionsCount,
        time_minutes: timeMinutes,
        question_ids: questionIds,
        is_private: finalIsPrivate,
        password: finalPassword,
        allow_teams: allowTeams,
        team1_name: allowTeams ? team1Name : null,
        team2_name: allowTeams ? team2Name : null,
        question_type: qType,
        exam_year: (selectedExamYear && selectedExamYear !== 'all' && selectedExamYear !== 'trial') ? parseInt(selectedExamYear) : null,
        exam_form_id: selectedExamYear === 'trial' ? (selectedTrialForm !== 'all' ? selectedTrialForm : null) : (selectedExamForm && selectedExamForm !== 'Mixed' ? selectedExamForm : null),
        exam_form_name: examFormName || null,
        time_per_question: timeMinutes,
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

  const getRoomShareMessage = () => {
    const url = `${window.location.origin}/battle/${createdRoom?.code}`;
    const subjectObj = subjects.find((s: any) => s.id === selectedSubject);
    const levelObj = levels.find((l: any) => l.id === selectedLevel);
    const subjectNameStr = subjectObj?.name || '';
    const levelNameStr = levelObj?.name || '';
    const examFormName = selectedExamYear === 'trial'
      ? (activeTrialForms.find(f => f.id === selectedTrialForm)?.name || 'كل النماذج')
      : selectedExamYear === 'all'
      ? 'جميع الأسئلة'
      : (EXAM_FORMS.find(f => f.id === selectedExamForm)?.name || '');
    const yearStr = selectedExamYear === 'all' ? ' | كل السنوات' : selectedExamYear === 'trial' ? ' | تجريبي' : selectedExamYear ? ` | ${selectedExamYear}` : '';
    const formStr = examFormName ? ` | ${examFormName}` : '';

    return `⚔️ تحدٍّ قانوني مباشر!

📚 المادة: ${subjectNameStr}
🎓 المستوى: ${levelNameStr}${yearStr}${formStr}
❓ الأسئلة: ${questionsCount} سؤال
👨‍🏫 المنشئ: ${creatorName}

🔥 هل أنت مستعد للمنافسة؟ انضم الآن!
🔗 ${url}`;
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/battle/${createdRoom?.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = getRoomShareMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
  const handleShareTelegram = () => {
    const url = `${window.location.origin}/battle/${createdRoom?.code}`;
    const text = getRoomShareMessage();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };
  const handleShareFacebook = () => {
    const url = `${window.location.origin}/battle/${createdRoom?.code}`;
    const text = getRoomShareMessage();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
  };
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getRoomShareMessage());
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
                <Button onClick={() => setShowShareModal(true)} variant="outline" className="w-full h-12 rounded-2xl font-black gap-2 border-2">
                  <Copy className="w-4 h-4" /> مشاركة رابط الغرفة
                </Button>
                <Button onClick={handleEnterRoom} className="w-full h-13 rounded-2xl font-black gap-2 bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/50 text-base">
                  <Play className="w-5 h-5" /> دخول الغرفة
                </Button>
                <p className="text-center text-[10px] text-slate-400 font-bold">
                  الغرفة صالحة 3 ساعات · حد أقصى {maxPlayers} لاعبين
                </p>
              </div>

              {/* Share Modal */}
              {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
                  <div className="w-full max-w-sm bg-white dark:bg-card rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()} dir="rtl">
                    <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2" />
                    <h3 className="font-black text-slate-900 dark:text-white text-center text-base">مشاركة الغرفة</h3>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed whitespace-pre-line border border-slate-100 dark:border-slate-700">
                      {getRoomShareMessage()}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleShareWhatsApp}
                        className="h-11 rounded-xl bg-green-500/15 border border-green-400/30 text-green-700 dark:text-green-300 text-sm font-black flex items-center justify-center gap-2 hover:bg-green-500/25 transition-all">
                        واتساب
                      </button>
                      <button onClick={handleShareTelegram}
                        className="h-11 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-700 dark:text-blue-300 text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-500/25 transition-all">
                        تيليجرام
                      </button>
                      <button onClick={handleShareFacebook}
                        className="h-11 rounded-xl bg-blue-700/15 border border-blue-600/30 text-blue-800 dark:text-blue-200 text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-700/25 transition-all">
                        فيسبوك
                      </button>
                      <button onClick={handleCopyMessage}
                        className={`h-11 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all border ${copied ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                        {copied ? <><Check className="w-4 h-4" /> تم النسخ!</> : <><Copy className="w-4 h-4" /> نسخ الرسالة</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

              {/* نموذج سنة الاختبار */}
              {selectedSubject && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-[1.25rem] border border-slate-100 dark:border-border">
                  <Label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">نموذج سنة الاختبار</Label>
                  <Select value={selectedExamYear} onValueChange={v => { setSelectedExamYear(v); setSelectedExamForm('General'); setSelectedTrialForm('all'); }}>
                    <SelectTrigger className="h-12 rounded-[1rem] bg-white dark:bg-card border-slate-200 font-bold">
                      <SelectValue placeholder="اختر السنة" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-white dark:bg-card rounded-2xl shadow-2xl max-h-[280px]">
                      <SelectItem value="trial" className="h-11 rounded-xl font-bold cursor-pointer text-violet-600">🧪 أسئلة تجريبية</SelectItem>
                      {examYears.map(y => (
                        <SelectItem key={y} value={String(y)} className="h-11 rounded-xl font-bold cursor-pointer">دورة عام {y}</SelectItem>
                      ))}
                      <SelectItem value="all" className="h-11 rounded-xl font-bold cursor-pointer text-emerald-600">📚 الكل</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* نموذج الاختبار — يظهر عند اختيار سنة محددة */}
                  {selectedExamYear && selectedExamYear !== 'trial' && selectedExamYear !== 'all' && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">نموذج الاختبار</Label>
                      <Select value={selectedExamForm} onValueChange={setSelectedExamForm}>
                        <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-card border-slate-200 font-bold text-sm">
                          <SelectValue placeholder="اختر النموذج" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] bg-white dark:bg-card rounded-2xl shadow-2xl">
                          {EXAM_FORMS.map(f => (
                            <SelectItem key={f.id} value={f.id} className="font-bold rounded-xl">{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* أسئلة تجريبية */}
                  {selectedExamYear === 'trial' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-800/30 rounded-xl px-3 py-2.5">
                        <span className="text-xl">🧪</span>
                        <div>
                          <p className="text-xs font-black text-violet-700 dark:text-violet-400">أسئلة تجريبية</p>
                          <p className="text-[10px] text-violet-500 font-bold">أسئلة تدريبية إضافية شاملة من المقرر</p>
                        </div>
                      </div>
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">اختر النموذج</Label>
                      <Select value={selectedTrialForm} onValueChange={setSelectedTrialForm}>
                        <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-card border-slate-200 font-bold text-sm">
                          <SelectValue placeholder="كل النماذج" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] bg-white dark:bg-card rounded-2xl shadow-2xl max-h-[260px]">
                          <SelectItem value="all" className="font-bold rounded-xl text-emerald-600">كل النماذج</SelectItem>
                          {activeTrialForms.map(f => (
                            <SelectItem key={f.id} value={f.id} className="font-bold rounded-xl">{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* الكل */}
                  {selectedExamYear === 'all' && (
                    <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl px-3 py-2.5">
                      <span className="text-xl">📚</span>
                      <div>
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">جميع الأسئلة</p>
                        <p className="text-[10px] text-emerald-500 font-bold">جميع أسئلة المادة من كل الدورات مخلوطة عشوائياً</p>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Hash className="w-3 h-3" /> {availableCount} سؤال متاح بهذه الفلاتر
                  </p>
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

              {/* وقت السؤال */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-[1.25rem] border border-slate-100 dark:border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> وقت كل سؤال</Label>
                  <span className="text-primary font-black text-sm bg-primary/10 px-3 py-1 rounded-xl">
                    {timeMinutes >= 60 ? `${timeMinutes / 60} دقيقة` : `${timeMinutes} ثانية`}
                  </span>
                </div>
                <Slider value={[timeMinutes]} onValueChange={([v]) => setTimeMinutes(v)} min={15} max={300} step={15} className="py-1" />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>15 ثانية</span>
                  <span>5 دقائق</span>
                </div>
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
                disabled={creating || !creatorName.trim() || !selectedSubject || !selectedExamYear}
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