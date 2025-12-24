/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Component: Exam Start & Setup
 * Developed by: Mueen Al-Nasser
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Clock, Target, User, Lock, Play, 
  Calendar, Info, ShieldCheck, Sparkles, ChevronLeft 
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

const ExamStart = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [examTime, setExamTime] = useState<number>(30);

  const { data: subject, isLoading } = useCachedQuery<(Subject & { levels: { name: string } | null }) | null>(
    ['subject', subjectId],
    async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*, levels(name)')
        .eq('id', subjectId)
        .maybeSingle();
      if (error) throw error;
      return data as (Subject & { levels: { name: string } | null }) | null;
    },
    { enabled: !!subjectId }
  );

  const { data: questionCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ['question-count', subjectId, selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_question_count', {
        p_subject_id: subjectId,
        p_exam_year: selectedYear ? parseInt(selectedYear) : null,
      });
      if (error) throw error;
      return data as number;
    },
    enabled: !!subjectId,
  });

  useEffect(() => {
    if (subject) {
      setExamTime(subject.default_time_minutes);
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
      toast({ title: 'نعتذر', description: 'لا توجد أسئلة متوفرة لهذا العام حالياً', variant: 'destructive' });
      return;
    }

    navigate(`/exam/${subjectId}/start`, {
      state: {
        studentName,
        examYear: parseInt(selectedYear),
        examTime,
        questionsCount: Math.min(subject?.questions_per_exam || 20, questionCount),
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
      <section className="py-12 md:py-24 bg-slate-50/50 min-h-screen">
        <div className="container mx-auto px-6 relative">
          
          <button
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 text-slate-400 hover:text-primary mb-10 transition-all font-bold text-sm uppercase tracking-widest"
          >
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span>الرجوع للمواد</span>
          </button>

          <div className="max-w-3xl mx-auto">
            
            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="bg-slate-900 p-10 md:p-14 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,#3b82f6,transparent)]" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-primary/20 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                    <ShieldCheck className="w-10 h-10 text-primary shadow-sm" />
                  </div>
                  {subject.levels?.name && (
                    <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-primary/80 mb-4">
                      {subject.levels.name}
                    </span>
                  )}
                  <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight leading-tight">
                    تجهيز اختبار <br /> 
                    <span className="text-primary">{subject.name}</span>
                  </h1>
                </div>
              </div>

              <div className="p-8 md:p-14 space-y-10">
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-[2.5rem] p-6 text-center border border-slate-100 group hover:border-primary/20 transition-all">
                    <Target className="w-6 h-6 text-primary mx-auto mb-3" />
                    <p className="text-2xl font-black text-slate-800">{subject.passing_score}%</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">درجة النجاح</p>
                  </div>
                  <div className="bg-slate-50 rounded-[2.5rem] p-6 text-center border border-slate-100 group hover:border-primary/20 transition-all">
                    <Clock className="w-6 h-6 text-primary mx-auto mb-3" />
                    <p className="text-2xl font-black text-slate-800">{examTime}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">الدقائق المتاحة</p>
                  </div>
                </div>

                <div className="space-y-8">
                  
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

                  <div className="grid md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-3">
                      <Label className="text-sm font-black text-slate-700 mr-2 uppercase tracking-wide">نموذج سنة الاختبار</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="h-16 rounded-[1.5rem] bg-slate-50 border-slate-100 font-bold px-6">
                          <SelectValue placeholder="اختر السنة" />
                        </SelectTrigger>
                        {/* حل مشكلة التداخل: إضافة Z-index ومساحة كافية */}
                        <SelectContent className="z-[9999] bg-white border-slate-200 rounded-2xl shadow-2xl max-h-[300px] overflow-y-auto">
                          {EXAM_YEARS.map((year) => (
                            <SelectItem key={year} value={year.toString()} className="h-12 rounded-xl cursor-pointer hover:bg-slate-50">
                              دورة عام {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-slate-900 rounded-[1.5rem] p-5 h-16 flex items-center justify-between px-6 shadow-xl shadow-slate-200">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">الأسئلة</span>
                      <span className="text-white font-black text-lg">
                        {countLoading ? '...' : questionCount}
                      </span>
                    </div>
                  </div>

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
                    className="w-full h-20 text-xl font-black rounded-[2rem] bg-primary hover:bg-blue-600 text-white shadow-2xl shadow-primary/30 transition-all gap-4 group"
                  >
                    <span>ابدأ الاختبار الآن</span>
                    <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 text-center flex items-center justify-center gap-2">
                 <Info className="w-4 h-4 text-slate-400" />
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                   بالضغط على ابدأ، سيتم تفعيل المؤقت الزمني تلقائياً. بالتوفيق.
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
