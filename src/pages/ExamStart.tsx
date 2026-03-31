/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Component: Exam Start & Setup
 * Developed by: Mueen Al-Nasser
 * Version: 4.0 (Wrong Questions Bank + Resume Exam)
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock, Target, User, Lock, Play,
  Info, ShieldCheck, FileText, ChevronLeft,
  AlertCircle, RotateCcw, BookOpen, Sparkles, Zap, X, PenLine
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Subject, EXAM_YEARS } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ExamStartSEO } from '@/components/seo/SEOHead';

const EXAM_FORMS = [
  { id: 'General',  name: 'نموذج العام' },
  { id: 'Parallel', name: 'نموذج الموازي' },
  { id: 'Mixed',    name: 'نموذج مختلط' },
];

/* ── localStorage helpers ── */
function getWrongQuestions(subjectId: string): string[] {
  try { return JSON.parse(localStorage.getItem(`wrong_questions_${subjectId}`) || '[]'); }
  catch { return []; }
}
function clearWrongQuestions(subjectId: string) {
  try { localStorage.removeItem(`wrong_questions_${subjectId}`); } catch { /* ignore */ }
}

interface SavedProgress {
  questionIds: string[];
  answers: Record<string, string>;
  currentIndex: number;
  timeRemainingSeconds: number;
  savedAt: string;
  questionsCount: number;
}

function getSavedProgress(subjectId: string, studentName: string): SavedProgress | null {
  try {
    const key = `exam_progress_${subjectId}_All_0_${studentName}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedProgress;
    if (Date.now() - new Date(data.savedAt).getTime() > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch { return null; }
}
function clearSavedProgress(subjectId: string, studentName: string) {
  try { localStorage.removeItem(`exam_progress_${subjectId}_All_0_${studentName}`); } catch { /* ignore */ }
}

function InfoCard({ icon, value, label, accent }: { icon: React.ReactNode; value: string | number; label: string; accent?: string }) {
  return (
    <div className="relative flex flex-col items-center gap-2 p-5 overflow-hidden rounded-[1.5rem] cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)', border: '1px solid rgba(99,102,241,0.12)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
        style={{ background: accent || 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
        <span className="text-white [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      </div>
      <p className="text-2xl font-black text-slate-800 dark:text-foreground leading-none">{value}</p>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">{label}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[11px] font-black text-slate-700 dark:text-foreground/90 uppercase tracking-[0.12em]">
      {children}
    </Label>
  );
}

const ExamStart = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentName,      setStudentName]      = useState(() => localStorage.getItem('alnaseer_student_name') || '');
  const [password,         setPassword]         = useState('');
  const [selectedYear,     setSelectedYear]     = useState<string>('');
  const [selectedExamForm, setSelectedExamForm] = useState<string>('General');
  const [selectedTrialForm, setSelectedTrialForm] = useState<string>('all');
  const [examTime,         setExamTime]         = useState<number>(30);
  const [wrongQuestions,   setWrongQuestions]   = useState<string[]>([]);
  const [savedProgress,    setSavedProgress]    = useState<SavedProgress | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showNewQsNotif,   setShowNewQsNotif]   = useState(false);
  const newQsDismissKey = subjectId ? `new_qs_dismissed_${subjectId}` : null;

  useEffect(() => {
    if (!subjectId) return;
    setWrongQuestions(getWrongQuestions(subjectId));
  }, [subjectId]);

  useEffect(() => {
    if (!subjectId || !studentName || selectedYear !== 'all') { setSavedProgress(null); return; }
    setSavedProgress(getSavedProgress(subjectId, studentName));
  }, [subjectId, studentName, selectedYear]);

  const { data: subject, isLoading } = useCachedQuery<
    (Subject & { levels: { name: string; is_disabled: boolean; disabled_message: string | null } | null }) | null
  >(
    ['subject', subjectId],
    async () => {
      const { data, error } = await supabase.from('subjects').select('*, levels(name, is_disabled, disabled_message)').eq('id', subjectId).maybeSingle();
      if (error) throw error;
      return data as any;
    },
    { enabled: !!subjectId }
  );

  const isTrialSelected = selectedYear === 'trial';
  const defaultTrialForms = useMemo(() => Array.from({ length: 15 }, (_, i) => ({ id: `Model_${i + 1}`, name: `نموذج ${i + 1}` })), []);

  const { data: customForms = [] } = useQuery({
    queryKey: ['subject-exam-forms', subjectId],
    queryFn: async () => {
      const { data } = await (supabase.from('subject_exam_forms' as any) as any).select('*').eq('subject_id', subjectId).order('order_index');
      return (data || []) as { form_id: string; form_name: string }[];
    },
    enabled: isTrialSelected && !!subjectId,
  });

  const activeTrialForms = useMemo(() =>
    [...defaultTrialForms, ...customForms.map(f => ({ id: f.form_id, name: f.form_name }))],
  [defaultTrialForms, customForms]);

  const activeExamForms = useMemo(() => EXAM_FORMS, []);

  const { data: questionCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ['question-count', subjectId, selectedYear, selectedExamForm, selectedTrialForm],
    queryFn: async () => {
      let query = supabase.from('questions').select('*', { count: 'exact', head: true }).eq('subject_id', subjectId).eq('status', 'active');
      if (selectedYear === 'trial') {
        query = query.is('exam_year', null);
        if (selectedTrialForm !== 'all') query = query.eq('exam_form', selectedTrialForm);
      } else if (selectedYear !== 'all' && selectedYear) {
        query = query.eq('exam_year', parseInt(selectedYear));
        if (selectedExamForm && selectedExamForm !== 'Mixed') query = query.eq('exam_form', selectedExamForm);
      }
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!subjectId,
  });

  // ── جلب الأسئلة الجديدة (آخر 7 أيام) ──
  interface NewQGroup { label: string; count: number; }
  const { data: newQsGroups = [] } = useQuery<NewQGroup[]>({
    queryKey: ['new-questions', subjectId],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('questions')
        .select('exam_year, exam_form, created_at')
        .eq('subject_id', subjectId)
        .eq('status', 'active')
        .gte('created_at', since);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const groups: Record<string, number> = {};
      for (const q of data) {
        let label = '';
        if (!q.exam_year) {
          const form = q.exam_form || '';
          label = form ? `أسئلة تجريبية — ${form.replace('Model_', 'نموذج ')}` : 'أسئلة تجريبية';
        } else {
          const formMap: Record<string, string> = { General: 'نموذج العام', Parallel: 'نموذج الموازي', Mixed: 'نموذج مختلط' };
          const formName = formMap[q.exam_form] || q.exam_form || '';
          label = formName ? `دورة ${q.exam_year} — ${formName}` : `دورة ${q.exam_year}`;
        }
        groups[label] = (groups[label] || 0) + 1;
      }
      return Object.entries(groups).map(([label, count]) => ({ label, count }));
    },
    enabled: !!subjectId,
  });

  useEffect(() => {
    if (!newQsDismissKey || newQsGroups.length === 0) return;
    const dismissed = localStorage.getItem(newQsDismissKey);
    if (!dismissed) setShowNewQsNotif(true);
  }, [newQsGroups, newQsDismissKey]);

  const handleDismissNewQs = () => {
    if (newQsDismissKey) localStorage.setItem(newQsDismissKey, '1');
    setShowNewQsNotif(false);
  };

  useEffect(() => {
    if (subject?.levels?.is_disabled) {
      toast({ title: subject.levels.disabled_message || 'هذا القسم غير متاح حالياً', variant: 'destructive' });
      navigate('/levels', { replace: true });
    }
  }, [subject, navigate, toast]);

  useEffect(() => { if (subject) setExamTime(subject.default_time_minutes || 30); }, [subject]);

  // عند اختيار "الكل" أو "أسئلة تجريبية + كل النماذج" يكون الوقت الافتراضي 120 دقيقة
  useEffect(() => {
    const isAllQuestions = selectedYear === 'all';
    const isAllTrialForms = selectedYear === 'trial' && selectedTrialForm === 'all';
    if (isAllQuestions || isAllTrialForms) {
      setExamTime(120);
    } else if (subject) {
      setExamTime(subject.default_time_minutes || 30);
    }
  }, [selectedYear, selectedTrialForm, subject]);

  const navigateToExam = (resume: boolean) => {
    const baseState = {
      studentName,
      examYear:       (selectedYear === 'trial' || selectedYear === 'all') ? 0 : parseInt(selectedYear),
      examForm:       selectedYear === 'trial'
        ? (selectedTrialForm !== 'all' ? selectedTrialForm : 'Trial')
        : selectedYear === 'all' ? 'All' : selectedExamForm,
      examTime,
      questionsCount: questionCount,
      subjectName:    subject?.name,
      levelName:      subject?.levels?.name,
      isTrial:        selectedYear === 'trial',
      allQuestions:   selectedYear === 'all',
      trialFormFilter: selectedYear === 'trial' ? selectedTrialForm : null,
    };
    if (resume && savedProgress) {
      navigate(`/exam/${subjectId}/start`, { state: { ...baseState, resumeProgress: savedProgress } });
    } else {
      if (selectedYear === 'all') clearSavedProgress(subjectId!, studentName);
      navigate(`/exam/${subjectId}/start`, { state: baseState });
    }
  };

  const handleStartExam = () => {
    if (!studentName.trim()) { toast({ title: 'تنبيه', description: 'يرجى إدخال اسمك الكامل للمتابعة', variant: 'destructive' }); return; }
    if (!selectedYear) { toast({ title: 'تنبيه', description: 'يرجى اختيار نموذج سنة الاختبار', variant: 'destructive' }); return; }
    if (subject?.password && password !== subject.password) { toast({ title: 'خطأ في الدخول', description: 'كلمة مرور الاختبار غير صحيحة', variant: 'destructive' }); return; }
    if (questionCount === 0) { toast({ title: 'نعتذر', description: 'لا توجد أسئلة متوفرة لهذا الاختيار حالياً', variant: 'destructive' }); return; }
    if (selectedYear === 'all' && savedProgress) { setShowResumeDialog(true); return; }
    navigateToExam(false);
  };

  const handleStartWrongExam = () => {
    if (!studentName.trim()) { toast({ title: 'تنبيه', description: 'يرجى إدخال اسمك الكامل أولاً', variant: 'destructive' }); return; }
    navigate(`/exam/${subjectId}/start`, {
      state: {
        studentName, examYear: 0, examForm: 'WrongReview', examTime,
        questionsCount: wrongQuestions.length, subjectName: subject?.name,
        levelName: subject?.levels?.name, isTrial: false, allQuestions: false,
        forcedQuestionIds: wrongQuestions, isWrongReview: true,
      },
    });
  };

  if (isLoading && !subject) return (
    <MainLayout><div className="container mx-auto px-6 py-24"><div className="h-[560px] max-w-lg mx-auto rounded-[2.5rem] bg-slate-100 dark:bg-muted animate-pulse" /></div></MainLayout>
  );
  if (!subject) return (
    <MainLayout>
      <div className="container mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-muted rounded-full flex items-center justify-center mx-auto mb-6"><Info className="w-10 h-10 text-slate-400 dark:text-muted-foreground" /></div>
        <p className="text-slate-500 dark:text-muted-foreground text-xl font-bold">عذراً، المادة المطلوبة غير متوفرة</p>
        <Link to="/levels"><Button variant="outline" className="mt-6 rounded-2xl h-12 px-8">العودة للمستويات</Button></Link>
      </div>
    </MainLayout>
  );

  const savedDate = savedProgress ? new Date(savedProgress.savedAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <MainLayout>
      <ExamStartSEO subjectName={subject?.name ?? ''} questionsCount={questionCount} />

      {/* ── شريط الملخص الذهبي ── */}
      {subject?.summary_url && (
        <div
          dir="rtl"
          onClick={() => window.location.href = subject.summary_url!}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 px-4 py-3 cursor-pointer group overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d1b2a 0%, #1a3320 50%, #0d1b2a 100%)',
            borderBottom: '2px solid rgba(201,168,76,0.55)',
            boxShadow: '0 4px 28px rgba(201,168,76,0.28)',
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg, #152338, #1f4a30, #152338)' }} />
          <div className="absolute inset-0 -skew-x-12 translate-x-[-150%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-in-out"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.22), transparent)', width: '40%' }} />
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, #e8c97a, #c9a84c, transparent)' }} />
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6d1e)', boxShadow: '0 3px 12px rgba(201,168,76,0.55)' }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs font-black leading-tight" style={{ color: '#e8c97a' }}>📖 ملخص المادة</p>
              <p className="text-[9px] font-bold leading-tight" style={{ color: '#a89060' }}>اضغط للمراجعة قبل الاختبار</p>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#c9a84c' }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#c9a84c' }} />
            </span>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black group-hover:scale-105 transition-transform duration-300"
              style={{ background: 'rgba(201,168,76,0.18)', color: '#e8c97a', border: '1px solid rgba(201,168,76,0.4)', boxShadow: '0 2px 8px rgba(201,168,76,0.2)' }}>
              <span>اقرأ الآن</span>
              <ChevronLeft className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}
      {subject?.summary_url && <div className="h-[52px]" />}

      <section className="py-8 md:py-16 bg-slate-50 dark:bg-muted/50 min-h-[calc(100vh-80px)]" dir="rtl">
        <div className="container mx-auto px-4 md:px-6">

          <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 dark:text-muted-foreground uppercase tracking-wide bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl px-4 py-2 hover:border-primary hover:text-primary transition-all duration-200">
            <ChevronLeft className="w-4 h-4" />العودة
          </button>

          {/* ── بنك الأسئلة الخاطئة ── */}
          {wrongQuestions.length >= 3 && (
            <div className="max-w-lg mx-auto mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-[1.5rem] p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-rose-700 dark:text-rose-400">لديك {wrongQuestions.length} سؤال أخطأت فيه</p>
                    <p className="text-[10px] text-rose-500 font-bold">راجع أخطاءك قبل الاختبار</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={handleStartWrongExam} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition-colors">
                    <BookOpen className="w-3.5 h-3.5" />راجع أخطاءك
                  </button>
                  <button onClick={() => { clearWrongQuestions(subjectId!); setWrongQuestions([]); }} className="p-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors" title="مسح الأخطاء">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── إشعار الأسئلة الجديدة ── */}
          {showNewQsNotif && newQsGroups.length > 0 && (
            <div className="max-w-lg mx-auto mb-5 animate-in fade-in slide-in-from-top-4 duration-500 zoom-in-95">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-amber-300/60 shadow-2xl shadow-amber-500/20"
                style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1025 40%, #0d1a2e 100%)' }}>
                <div className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(251,191,36,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.3) 0%, transparent 60%)' }} />
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, #a78bfa, #fbbf24, transparent)' }} />
                <div className="relative z-10 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 0 20px rgba(251,191,36,0.5)' }}>
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                            style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)', color: '#000' }}>
                            <Zap className="w-2.5 h-2.5" /> جديد
                          </span>
                          <span className="text-amber-300/70 text-[9px] font-bold">خلال آخر 7 أيام</span>
                        </div>
                        <p className="text-white font-black text-sm leading-snug mb-3">
                          🎯 تم إضافة أسئلة جديدة لهذه المادة!
                        </p>
                        <div className="space-y-1.5">
                          {newQsGroups.map((g, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <span className="text-[11px] font-bold text-slate-300">{g.label}</span>
                              <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                                +{g.count} سؤال
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold mt-2.5">
                          🎯 راجعها قبل الامتحان وكن مستعداً
                        </p>
                      </div>
                    </div>
                    <button onClick={handleDismissNewQs}
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card */}
          <div className="max-w-lg mx-auto bg-white dark:bg-card rounded-[2.5rem] border border-slate-200 dark:border-border shadow-xl shadow-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">

            {/* Header */}
            <div className="relative px-10 py-12 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #0a1628 100%)' }}>
              {/* شبكة خلفية */}
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
              {/* توهجات */}
              <div className="absolute top-0 right-1/4 w-48 h-48 rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
              <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
              {/* شريط علوي */}
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, #818cf8, #3b82f6, transparent)' }} />
              <div className="relative z-10 flex flex-col items-center">
                {/* أيقونة كبيرة متوهجة */}
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', boxShadow: '0 0 40px rgba(99,102,241,0.5), 0 8px 32px rgba(0,0,0,0.3)' }}>
                    <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                  {/* نقطة نابضة */}
                  <span className="absolute -top-1 -right-1 flex w-4 h-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50" />
                    <span className="relative inline-flex rounded-full w-4 h-4 bg-blue-500 border-2 border-white/20" />
                  </span>
                </div>
                {subject.levels?.name && (
                  <span className="inline-flex items-center gap-1.5 mb-3 px-4 py-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
                    <Sparkles className="w-3 h-3" />{subject.levels.name}
                  </span>
                )}
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2">تجهيز اختبار</p>
                <h1 className="text-3xl font-black tracking-tight leading-snug" style={{ background: 'linear-gradient(90deg, #60a5fa, #a5b4fc, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {subject.name}
                </h1>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 md:px-10 py-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InfoCard icon={<Target className="w-5 h-5" />} value={`${subject.passing_score}%`} label="درجة النجاح" accent="linear-gradient(135deg, #10b981, #059669)" />
                <InfoCard icon={<Clock className="w-5 h-5" />} value={examTime} label="الدقائق المتاحة" accent="linear-gradient(135deg, #3b82f6, #6366f1)" />
              </div>

              <div className="space-y-2">
                <FieldLabel>بيانات المختبر</FieldLabel>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-muted-foreground pointer-events-none" />
                  <Input placeholder="أدخل اسمك الكامل" value={studentName} onChange={(e) => { const v = e.target.value; setStudentName(v); localStorage.setItem('alnaseer_student_name', v); }} className="h-14 rounded-[1rem] pr-11 bg-slate-50 dark:bg-muted border-slate-200 dark:border-border font-bold text-base focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel>نموذج سنة الاختبار</FieldLabel>
                <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); if (v !== 'trial') setSelectedTrialForm('all'); }}>
                  <SelectTrigger className="h-14 rounded-[1rem] bg-slate-50 dark:bg-muted border-slate-200 dark:border-border font-bold px-5 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-white dark:bg-card border-slate-200 dark:border-border rounded-2xl shadow-2xl max-h-[280px]">
                    <SelectItem value="trial" className="h-11 rounded-xl font-bold cursor-pointer text-violet-600">🧪 أسئلة تجريبية</SelectItem>
                    {EXAM_YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()} className="h-11 rounded-xl font-bold cursor-pointer">دورة عام {year}</SelectItem>
                    ))}
                    <SelectItem value="all" className="h-11 rounded-xl font-bold cursor-pointer text-emerald-600">📚 الكل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* السنوات والنماذج العادية - تظهر فقط عند عدم اختيار التجريبي */}
              {selectedYear !== 'trial' && selectedYear !== 'all' && selectedYear && (
                <div className="space-y-2">
                  <FieldLabel><span className="inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />نموذج الاختبار</span></FieldLabel>
                  <Select value={selectedExamForm} onValueChange={setSelectedExamForm}>
                    <SelectTrigger className="h-14 rounded-[1rem] bg-slate-50 dark:bg-muted border-slate-200 dark:border-border font-bold px-5 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                      <SelectValue placeholder="اختر النموذج" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-white dark:bg-card border-slate-200 dark:border-border rounded-2xl shadow-2xl max-h-[280px]">
                      {activeExamForms.map((form) => (
                        <SelectItem key={form.id} value={form.id} className="h-11 rounded-xl font-bold cursor-pointer">{form.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedYear === 'trial' && (
                <>
                  <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-[1rem] px-4 py-3">
                    <span className="text-2xl">🧪</span>
                    <div><p className="text-xs font-black text-violet-700">أسئلة تجريبية</p><p className="text-[10px] text-violet-500 font-bold">أسئلة تدريبية إضافية شاملة من المقرر تساعدك على الاستعداد للاختبار</p></div>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel><span className="inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />اختر النموذج</span></FieldLabel>
                    <Select value={selectedTrialForm} onValueChange={setSelectedTrialForm}>
                      <SelectTrigger className="h-14 rounded-[1rem] bg-slate-50 dark:bg-muted border-slate-200 dark:border-border font-bold px-5 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                        <SelectValue placeholder="اختر النموذج" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-white dark:bg-card border-slate-200 dark:border-border rounded-2xl shadow-2xl max-h-[280px]">
                        <SelectItem value="all" className="h-11 rounded-xl font-bold cursor-pointer text-emerald-600">كل النماذج</SelectItem>
                        {activeTrialForms.map((form) => (
                          <SelectItem key={form.id} value={form.id} className="h-11 rounded-xl font-bold cursor-pointer">{form.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {selectedYear === 'all' && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-[1rem] px-4 py-3">
                  <span className="text-2xl">📚</span>
                  <div><p className="text-xs font-black text-emerald-700">جميع الأسئلة</p><p className="text-[10px] text-emerald-500 font-bold">جميع أسئلة المادة من كل الدورات مخلوطة عشوائياً</p></div>
                </div>
              )}

              {/* إشعار التقدم المحفوظ */}
              {selectedYear === 'all' && savedProgress && studentName && (
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-[1rem] px-4 py-3">
                  <span className="text-2xl">💾</span>
                  <div>
                    <p className="text-xs font-black text-blue-700 dark:text-blue-400">لديك اختبار محفوظ من {savedDate}</p>
                    <p className="text-[10px] text-blue-500 font-bold">وصلت للسؤال {savedProgress.currentIndex + 1} من {savedProgress.questionsCount}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-slate-900 rounded-[1rem] px-6 py-4">
                <span className="text-[10px] font-black text-slate-500 dark:text-muted-foreground uppercase tracking-widest">الأسئلة المتوفرة</span>
                <span className="text-white font-black text-lg">{countLoading ? <span className="inline-block w-8 h-5 bg-slate-700 rounded animate-pulse" /> : questionCount}</span>
              </div>

              {subject.allow_time_modification && (
                <div className="space-y-4 p-5 bg-slate-50 dark:bg-muted border border-slate-100 dark:border-border rounded-[1.5rem] animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-700 dark:text-foreground/90 uppercase tracking-wide">تخصيص وقت الاختبار</p>
                      <p className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium mt-0.5">اسحب الشريط لتحديد مدة المحاولة</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-xl text-sm font-black shadow-md shadow-primary/25">
                      <Clock className="w-3.5 h-3.5" />{examTime} دقيقة
                    </div>
                  </div>
                  <Slider value={[examTime]} onValueChange={([value]) => setExamTime(value)} min={subject.min_time_minutes || 10} max={subject.max_time_minutes || 120} step={5} className="py-2" />
                </div>
              )}

              {subject.password && (
                <div className="space-y-3 p-5 bg-amber-50 border border-amber-100 rounded-[1.5rem]">
                  <label className="flex items-center gap-2 text-xs font-black text-amber-700"><Lock className="w-3.5 h-3.5" />هذا الاختبار محمي بكلمة مرور</label>
                  <Input type="password" placeholder="أدخل كلمة السر" value={password} onChange={(e) => setPassword(e.target.value)} className="h-13 rounded-[1rem] bg-white dark:bg-card border-amber-200 text-center font-black tracking-[0.4em] focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                </div>
              )}

              <button
                onClick={handleStartExam}
                disabled={!studentName.trim() || !selectedYear || questionCount === 0}
                className="relative w-full h-16 rounded-[1.25rem] font-black text-base text-white overflow-hidden transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5, #7c3aed)', boxShadow: '0 8px 32px rgba(99,102,241,0.45), 0 0 0 1px rgba(255,255,255,0.1) inset' }}
              >
                {/* توهج داخلي */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1, #8b5cf6)' }} />
                {/* بريق متحرك */}
                <div className="absolute inset-0 -skew-x-12 translate-x-[-150%] group-hover:translate-x-[250%] transition-transform duration-700 ease-in-out" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', width: '50%' }} />
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                  <span>{selectedYear === 'all' && savedProgress ? 'متابعة الاختبار' : 'ابدأ الاختبار الآن'}</span>
                  <Zap className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
              </button>

              <Link
                to={`/suggest?level=${subject?.level_id || ''}&subject=${subjectId || ''}`}
                className="group relative w-full flex items-center justify-center gap-3 rounded-[1.25rem] overflow-hidden transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1.5px solid rgba(245,158,11,0.35)', padding: '14px 20px', boxShadow: '0 4px 16px rgba(245,158,11,0.15)' }}
              >
                {/* بريق متحرك */}
                <div className="absolute inset-0 -skew-x-12 translate-x-[-150%] group-hover:translate-x-[250%] transition-transform duration-700" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)', width: '50%' }} />
                <div className="relative z-10 w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 10px rgba(245,158,11,0.4)' }}>
                  <PenLine className="w-4 h-4 text-white" />
                </div>
                <div className="relative z-10 text-right">
                  <p className="text-sm font-black text-amber-800">أضف سؤالاً لهذه المادة</p>
                  <p className="text-[10px] font-bold text-amber-600">ساهم في تطوير المحتوى وساعد زملاءك</p>
                </div>
                <div className="relative z-10 mr-auto">
                  <ChevronLeft className="w-4 h-4 text-amber-500 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-50 dark:bg-muted border-t border-slate-100 dark:border-border">
              <Info className="w-3.5 h-3.5 text-slate-400 dark:text-muted-foreground shrink-0" />
              <p className="text-[9px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest text-center">بالضغط على ابدأ، سيتم تفعيل المؤقت الزمني تلقائياً</p>
            </div>
          </div>
        </div>
      </section>

      {/* حوار استئناف الاختبار */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 text-right" dir="rtl">
          <AlertDialogHeader>
            <div className="w-20 h-20 bg-blue-100 rounded-[2rem] flex items-center justify-center mb-4 mx-auto"><span className="text-4xl">💾</span></div>
            <AlertDialogTitle className="text-2xl font-black text-center">لديك اختبار محفوظ</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base text-slate-500 dark:text-muted-foreground mt-3 leading-relaxed">
              تم حفظ تقدمك في {savedDate}<br />
              <span className="text-primary font-bold">وصلت للسؤال {savedProgress ? savedProgress.currentIndex + 1 : 0} من {savedProgress?.questionsCount}</span>
              <br />هل تريد المتابعة من حيث توقفت؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <AlertDialogCancel onClick={() => { setShowResumeDialog(false); navigateToExam(false); }} className="flex-1 h-13 rounded-2xl font-bold border-slate-200">بدء من جديد</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowResumeDialog(false); navigateToExam(true); }} className="flex-1 h-13 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20">متابعة من حيث توقفت</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default ExamStart;