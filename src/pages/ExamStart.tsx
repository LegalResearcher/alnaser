/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Component: Exam Start & Setup
 * Developed by: Mueen Al-Nasser
 * Version: 3.0 (Visual Redesign)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock, Target, User, Lock, Play,
  Info, ShieldCheck, FileText, ChevronLeft
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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

/* ─────────────────────────────────────────────
   Small reusable sub-components
───────────────────────────────────────────── */

function InfoCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="
      flex flex-col items-center gap-2 p-5
      bg-slate-50 border border-slate-100 rounded-[1.5rem]
      hover:border-blue-200 hover:shadow-md hover:shadow-blue-50
      transition-all duration-300 cursor-default
    ">
      <span className="text-primary">{icon}</span>
      <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[11px] font-black text-slate-700 uppercase tracking-[0.12em]">
      {children}
    </Label>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */

const ExamStart = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentName,      setStudentName]      = useState('');
  const [password,         setPassword]         = useState('');
  const [selectedYear,     setSelectedYear]     = useState<string>('');
  const [selectedExamForm, setSelectedExamForm] = useState<string>('General');
  const [examTime,         setExamTime]         = useState<number>(30);

  /* ── Data fetching ── */
  const { data: subject, isLoading } = useCachedQuery<
    (Subject & { levels: { name: string; is_disabled: boolean; disabled_message: string | null } | null }) | null
  >(
    ['subject', subjectId],
    async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*, levels(name, is_disabled, disabled_message)')
        .eq('id', subjectId)
        .maybeSingle();
      if (error) throw error;
      return data as (Subject & { levels: { name: string; is_disabled: boolean; disabled_message: string | null } | null }) | null;
    },
    { enabled: !!subjectId }
  );

  const { data: questionCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ['question-count', subjectId, selectedYear, selectedExamForm],
    queryFn: async () => {
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', subjectId)
        .eq('status', 'active');
      if (selectedYear === 'trial') {
        query = query.is('exam_year', null);
      } else if (selectedYear === 'all') {
        // جميع الأسئلة — لا فلتر
      } else if (selectedYear) {
        query = query.eq('exam_year', parseInt(selectedYear));
        if (selectedExamForm && selectedExamForm !== 'Mixed') query = query.eq('exam_form', selectedExamForm);
      }
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!subjectId,
  });

  /* ── Side effects ── */
  useEffect(() => {
    if (subject?.levels?.is_disabled) {
      toast({ title: subject.levels.disabled_message || 'هذا القسم غير متاح حالياً', variant: 'destructive' });
      navigate('/levels', { replace: true });
    }
  }, [subject, navigate, toast]);

  useEffect(() => {
    if (subject) setExamTime(subject.default_time_minutes || 30);
  }, [subject]);

  /* ── Submit ── */
  const handleStartExam = () => {
    if (!studentName.trim()) {
      toast({ title: 'تنبيه', description: 'يرجى إدخال اسمك الكامل للمتابعة', variant: 'destructive' });
      return;
    }
    if (!selectedYear) {
      toast({ title: 'تنبيه', description: 'يرجى اختيار نموذج سنة الاختبار', variant: 'destructive' });
      return;
    }
    if (subject?.password && password !== subject.password) {
      toast({ title: 'خطأ في الدخول', description: 'كلمة مرور الاختبار غير صحيحة', variant: 'destructive' });
      return;
    }
    if (questionCount === 0) {
      toast({ title: 'نعتذر', description: 'لا توجد أسئلة متوفرة لهذا الاختيار حالياً', variant: 'destructive' });
      return;
    }
    navigate(`/exam/${subjectId}/start`, {
      state: {
        studentName,
        examYear:       (selectedYear === 'trial' || selectedYear === 'all') ? 0 : parseInt(selectedYear),
        examForm:       selectedYear === 'trial' ? 'Trial' : selectedYear === 'all' ? 'All' : selectedExamForm,
        examTime,
        questionsCount: questionCount,
        subjectName:    subject?.name,
        levelName:      subject?.levels?.name,
        isTrial:        selectedYear === 'trial',
        allQuestions:   selectedYear === 'all',
      },
    });
  };

  /* ─── Loading skeleton ─── */
  if (isLoading && !subject) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 py-24">
          <div className="h-[560px] max-w-lg mx-auto rounded-[2.5rem] bg-slate-100 animate-pulse" />
        </div>
      </MainLayout>
    );
  }

  /* ─── Not found ─── */
  if (!subject) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 py-24 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-500 text-xl font-bold">عذراً، المادة المطلوبة غير متوفرة</p>
          <Link to="/levels">
            <Button variant="outline" className="mt-6 rounded-2xl h-12 px-8">العودة للمستويات</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  /* ─── Main render ─── */
  return (
    <MainLayout>
      <ExamStartSEO subjectName={subject?.name ?? ''} questionsCount={questionCount} />
      <section className="py-8 md:py-16 bg-slate-50/50 min-h-[calc(100vh-80px)]">
        <div className="container mx-auto px-4 md:px-6">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="
              mb-5 inline-flex items-center gap-1.5
              text-xs font-black text-slate-500 uppercase tracking-wide
              bg-white border border-slate-200 rounded-xl px-4 py-2
              hover:border-primary hover:text-primary
              transition-all duration-200
            "
          >
            <ChevronLeft className="w-4 h-4" />
            العودة
          </button>

          {/* Card */}
          <div className="
            max-w-lg mx-auto bg-white
            rounded-[2.5rem] border border-slate-200
            shadow-xl shadow-slate-200/60
            overflow-hidden
            animate-in fade-in slide-in-from-bottom-6 duration-500
          ">

            {/* ── Header ── */}
            <div className="relative bg-slate-900 px-10 py-12 text-center overflow-hidden">
              {/* grid texture */}
              <div className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }} />
              {/* bottom glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-28
                bg-blue-500/30 blur-2xl rounded-full pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                {/* Shield icon */}
                <div className="
                  w-16 h-16 rounded-[1.25rem] mb-5
                  bg-blue-500/15 border border-white/10
                  flex items-center justify-center
                  shadow-2xl backdrop-blur-sm
                ">
                  <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>

                {/* Level badge */}
                {subject.levels?.name && (
                  <span className="
                    inline-block mb-3 px-4 py-1.5 rounded-full
                    bg-white/5 border border-white/10
                    text-[10px] font-black uppercase tracking-[0.18em] text-blue-300
                  ">
                    {subject.levels.name}
                  </span>
                )}

                <h1 className="text-3xl font-black text-white tracking-tight leading-snug">
                  تجهيز اختبار <br />
                  <span className="text-blue-400">{subject.name}</span>
                </h1>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="px-8 md:px-10 py-8 space-y-6">

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-4">
                <InfoCard
                  icon={<Target className="w-5 h-5" />}
                  value={`${subject.passing_score}%`}
                  label="درجة النجاح"
                />
                <InfoCard
                  icon={<Clock className="w-5 h-5" />}
                  value={examTime}
                  label="الدقائق المتاحة"
                />
              </div>

              {/* Student name */}
              <div className="space-y-2">
                <FieldLabel>بيانات المختبر</FieldLabel>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="أدخل اسمك الكامل"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="h-14 rounded-[1rem] pr-11 bg-slate-50 border-slate-200 font-bold text-base
                      focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              {/* Year selector */}
              <div className="space-y-2">
                <FieldLabel>نموذج سنة الاختبار</FieldLabel>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-14 rounded-[1rem] bg-slate-50 border-slate-200 font-bold px-5
                    focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-white border-slate-200 rounded-2xl shadow-2xl max-h-[280px]">
                    <SelectItem value="trial" className="h-11 rounded-xl font-bold cursor-pointer text-violet-600">
                      🧪 النموذج التجريبي
                    </SelectItem>
                    {EXAM_YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()} className="h-11 rounded-xl font-bold cursor-pointer">
                        دورة عام {year}
                      </SelectItem>
                    ))}
                    <SelectItem value="all" className="h-11 rounded-xl font-bold cursor-pointer text-emerald-600">
                      📚 الكل
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Form selector — يُخفى في التجريبي والكل */}
              {selectedYear !== 'trial' && selectedYear !== 'all' && (
              <div className="space-y-2">
                <FieldLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    نموذج الاختبار
                  </span>
                </FieldLabel>
                <Select value={selectedExamForm} onValueChange={setSelectedExamForm}>
                  <SelectTrigger className="h-14 rounded-[1rem] bg-slate-50 border-slate-200 font-bold px-5
                    focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                    <SelectValue placeholder="اختر النموذج" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-white border-slate-200 rounded-2xl shadow-2xl">
                    {EXAM_FORMS.map((form) => (
                      <SelectItem key={form.id} value={form.id} className="h-11 rounded-xl font-bold cursor-pointer">
                        {form.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}

              {selectedYear === 'trial' && (
                <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-[1rem] px-4 py-3">
                  <span className="text-2xl">🧪</span>
                  <div>
                    <p className="text-xs font-black text-violet-700">النموذج التجريبي</p>
                    <p className="text-[10px] text-violet-500 font-bold">أسئلة تدريبية إضافية خارج دورات السنوات</p>
                  </div>
                </div>
              )}
              {selectedYear === 'all' && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-[1rem] px-4 py-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="text-xs font-black text-emerald-700">جميع الأسئلة</p>
                    <p className="text-[10px] text-emerald-500 font-bold">جميع أسئلة المادة من كل الدورات مخلوطة عشوائياً</p>
                  </div>
                </div>
              )}

              {/* Available questions */}
              <div className="flex items-center justify-between bg-slate-900 rounded-[1rem] px-6 py-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الأسئلة المتوفرة</span>
                <span className="text-white font-black text-lg">
                  {countLoading ? (
                    <span className="inline-block w-8 h-5 bg-slate-700 rounded animate-pulse" />
                  ) : questionCount}
                </span>
              </div>

              {/* Time slider (conditional) */}
              {subject.allow_time_modification && (
                <div className="space-y-4 p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem]
                  animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-wide">تخصيص وقت الاختبار</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">اسحب الشريط لتحديد مدة المحاولة</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-xl text-sm font-black shadow-md shadow-primary/25">
                      <Clock className="w-3.5 h-3.5" />
                      {examTime} دقيقة
                    </div>
                  </div>
                  <Slider
                    value={[examTime]}
                    onValueChange={([value]) => setExamTime(value)}
                    min={subject.min_time_minutes || 10}
                    max={subject.max_time_minutes || 120}
                    step={5}
                    className="py-2"
                  />
                </div>
              )}

              {/* Password (conditional) */}
              {subject.password && (
                <div className="space-y-3 p-5 bg-amber-50 border border-amber-100 rounded-[1.5rem]">
                  <label className="flex items-center gap-2 text-xs font-black text-amber-700">
                    <Lock className="w-3.5 h-3.5" />
                    هذا الاختبار محمي بكلمة مرور
                  </label>
                  <Input
                    type="password"
                    placeholder="أدخل كلمة السر"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-13 rounded-[1rem] bg-white border-amber-200 text-center font-black tracking-[0.4em]
                      focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                </div>
              )}

              {/* CTA Button */}
              <Button
                onClick={handleStartExam}
                disabled={!studentName.trim() || !selectedYear || questionCount === 0}
                className="
                  w-full h-16 text-base font-black rounded-[1.25rem]
                  bg-primary hover:bg-blue-600 text-white
                  shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40
                  hover:-translate-y-0.5 active:scale-[0.98]
                  transition-all duration-200
                  gap-3 group
                "
              >
                <span>ابدأ الاختبار الآن</span>
                <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
              </Button>

            </div>{/* /body */}

            {/* ── Footer ── */}
            <div className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-50 border-t border-slate-100">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                بالضغط على ابدأ، سيتم تفعيل المؤقت الزمني تلقائياً
              </p>
            </div>

          </div>{/* /card */}
        </div>
      </section>
    </MainLayout>
  );
};

export default ExamStart;
