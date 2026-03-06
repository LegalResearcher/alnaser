/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Component: Exam Start & Setup
 * Developed by: Mueen Al-Nasser
 * Version: 2.0 (Exam Forms Support)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Clock, Target, User, Lock, Play, 
  Calendar, Info, ShieldCheck, Sparkles, ChevronLeft, FileText
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

// نماذج الاختبار
const EXAM_FORMS = [
  { id: 'General', name: 'نموذج العام' },
  { id: 'Parallel', name: 'نموذج الموازي' },
  { id: 'Mixed', name: 'نموذج مختلط' }
];

const ExamStart = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedExamForm, setSelectedExamForm] = useState<string>('General');
  const [examTime, setExamTime] = useState<number>(30);

  // جلب بيانات المادة والمستوى
  const { data: subject, isLoading } = useCachedQuery<(Subject & { levels: { name: string; is_disabled: boolean; disabled_message: string | null } | null }) | null>(
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

  // حماية: إعادة توجيه إذا كان المستوى معطلاً
  useEffect(() => {
    if (subject?.levels?.is_disabled) {
      toast({
        title: subject.levels.disabled_message || 'هذا القسم غير متاح حالياً',
        variant: 'destructive',
      });
      navigate('/levels', { replace: true });
    }
  }, [subject, navigate, toast]);

  // حساب عدد الأسئلة المتوفرة بناءً على السنة والنموذج
  const { data: questionCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ['question-count', subjectId, selectedYear, selectedExamForm],
    queryFn: async () => {
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', subjectId)
        .eq('status', 'active');
      
      if (selectedYear) {
        query = query.eq('exam_year', parseInt(selectedYear));
      }
      if (selectedExamForm) {
        query = query.eq('exam_form', selectedExamForm);
      }
      
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!subjectId,
  });

  // تحديث الوقت الافتراضي عند تحميل المادة
  useEffect(() => {
    if (subject) {
      setExamTime(subject.default_time_minutes || 30);
    }
  }, [subject]);

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

    // تمرير كافة البيانات لصفحة الاختبار (Engine) - بدون حد للأسئلة
    navigate(`/exam/${subjectId}/start`, {
      state: {
        studentName,
        examYear: parseInt(selectedYear),
        examForm: selectedExamForm,
        examTime: examTime,
        questionsCount: questionCount, // جميع الأسئلة المتوفرة
        subjectName: subject?.name,
        levelName: subject?.levels?.name,
      },
    });
  };

  if (isLoading && !subject) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 py-24">
          <div className="h-[500px] max-w-3xl mx-auto rounded-[3rem] bg-slate-100 animate-pulse" />
        </div>
      </MainLayout>
    );
  }

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

  return (
    <MainLayout>
      <section className="py-8 md:py-16 bg-slate-50/50 min-h-[calc(100vh-80px)]">
        <div className="container mx-auto px-4 md:px-6 relative">
          
          <button
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 text-slate-400 hover:text-primary mb-10 transition-all font-bold text-sm uppercase tracking-widest"
          >
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span>الرجوع للمواد</span>
          </button>

          <div className="max-w-3xl mx-auto">
            
            <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="bg-slate-900 p-8 md:p-14 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,#3b82f6,transparent)]" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-primary/20 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-4 md:mb-6 shadow-2xl">
                    <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                  </div>
                  {subject.levels?.name && (
                    <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-primary/80 mb-3 md:mb-4">
                      {subject.levels.name}
                    </span>
                  )}
                  <h1 className="text-2xl md:text-4xl font-black mb-2 md:mb-4 tracking-tight leading-tight">
                    تجهيز اختبار <br /> 
                    <span className="text-primary">{subject.name}</span>
                  </h1>
                </div>
              </div>

              <div className="p-6 md:p-14 space-y-8 md:space-y-10">
                
                {/* بطاقات معلومات الاختبار */}
                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  <div className="bg-slate-50 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 text-center border border-slate-100 group hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-2 md:mb-3" />
                    <p className="text-xl md:text-2xl font-black text-slate-800">{subject.passing_score}%</p>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">درجة النجاح</p>
                  </div>
                  <div className="bg-slate-50 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 text-center border border-slate-100 group hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-2 md:mb-3" />
                    <p className="text-xl md:text-2xl font-black text-slate-800">{examTime}</p>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">الدقائق المتاحة</p>
                  </div>
                </div>

                <div className="space-y-8">
                  
                  {/* إدخال اسم الطالب */}
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-black text-slate-700 mr-2 uppercase tracking-wide">بيانات المختبر</Label>
                    <div className="relative">
                       <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                       <Input
                        id="name"
                        placeholder="أدخل اسمك الكامل"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="h-16 rounded-[1.5rem] pr-12 bg-slate-50 border-slate-100 text-lg font-bold"
                      />
                    </div>
                  </div>

                  {/* اختيار السنة */}
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-700 mr-2 uppercase tracking-wide">نموذج سنة الاختبار</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="h-16 rounded-[1.5rem] bg-slate-50 border-slate-100 font-bold px-6">
                        <SelectValue placeholder="اختر السنة" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-white border-slate-200 rounded-2xl shadow-2xl max-h-[300px] overflow-y-auto">
                        {EXAM_YEARS.map((year) => (
                          <SelectItem key={year} value={year.toString()} className="h-12 rounded-xl cursor-pointer hover:bg-slate-50">
                            دورة عام {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* اختيار النموذج */}
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-700 mr-2 uppercase tracking-wide flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      نموذج الاختبار
                    </Label>
                    <Select value={selectedExamForm} onValueChange={setSelectedExamForm}>
                      <SelectTrigger className="h-16 rounded-[1.5rem] bg-slate-50 border-slate-100 font-bold px-6">
                        <SelectValue placeholder="اختر النموذج" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-white border-slate-200 rounded-2xl shadow-2xl">
                        {EXAM_FORMS.map((form) => (
                          <SelectItem key={form.id} value={form.id} className="h-12 rounded-xl cursor-pointer hover:bg-slate-50">
                            {form.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* عدد الأسئلة المتوفرة */}
                  <div className="bg-slate-900 rounded-[1.5rem] p-5 flex items-center justify-between px-6 shadow-xl shadow-slate-200">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest text-right">الأسئلة المتوفرة</span>
                    <span className="text-white font-black text-lg">
                      {countLoading ? '...' : questionCount}
                    </span>
                  </div>

                  {/* شريط التحكم بالوقت (بناءً على شرط الإدارة) */}
                  {subject.allow_time_modification && (
                    <div className="space-y-6 pt-4 p-6 bg-slate-50/80 rounded-[2.5rem] border border-slate-100 animate-in zoom-in-95 duration-300">
                      <div className="flex items-center justify-between px-2">
                        <div className="space-y-1">
                          <Label className="text-sm font-black text-slate-700 uppercase tracking-wide">تخصيص وقت الاختبار</Label>
                          <p className="text-[10px] text-slate-400 font-bold tracking-tight text-right">اسحب الشريط لتحديد مدة المحاولة</p>
                        </div>
                        <div className="bg-primary text-white px-5 py-2 rounded-2xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{examTime} دقيقة</span>
                        </div>
                      </div>
                      <Slider
                        value={[examTime]}
                        onValueChange={([value]) => setExamTime(value)}
                        min={subject.min_time_minutes || 10}
                        max={subject.max_time_minutes || 120}
                        step={5}
                        className="py-4"
                      />
                    </div>
                  )}

                  {/* قسم كلمة السر */}
                  {subject.password && (
                    <div className="space-y-3 p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                      <Label htmlFor="password" className="text-sm font-black text-amber-700 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        هذا الاختبار محمي بكلمة مرور
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="أدخل كلمة السر"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 rounded-2xl bg-white border-amber-200 text-center font-black tracking-[0.5em]"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleStartExam}
                    disabled={!studentName.trim() || !selectedYear || questionCount === 0}
                    className="w-full h-16 md:h-20 text-lg md:text-xl font-black rounded-[1.5rem] md:rounded-[2rem] bg-primary hover:bg-blue-600 text-white shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 gap-3 md:gap-4 group active:scale-[0.98]"
                  >
                    <span>ابدأ الاختبار الآن</span>
                    <Play className="w-5 h-5 md:w-6 md:h-6 fill-current group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 text-center flex items-center justify-center gap-2 rounded-b-[3.5rem]">
                 <Info className="w-4 h-4 text-slate-400 shrink-0" />
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                   بالضغط على ابدأ، سيتم تفعيل المؤقت الزمني تلقائياً.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ExamStart;