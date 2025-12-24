import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Clock, Target, User, Lock, Play, Calendar } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Subject, EXAM_YEARS } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const ExamStart = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [examTime, setExamTime] = useState<number>(30);

  const { data: subject, isLoading } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .maybeSingle();
      if (error) throw error;
      return data as Subject | null;
    },
    enabled: !!subjectId,
  });

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
      toast({ title: 'خطأ', description: 'يرجى إدخال اسمك', variant: 'destructive' });
      return;
    }
    if (!selectedYear) {
      toast({ title: 'خطأ', description: 'يرجى اختيار نموذج سنة الاختبار', variant: 'destructive' });
      return;
    }
    if (subject?.password && password !== subject.password) {
      toast({ title: 'خطأ', description: 'كلمة المرور غير صحيحة', variant: 'destructive' });
      return;
    }
    if (questionCount === 0) {
      toast({ title: 'خطأ', description: 'لا توجد أسئلة متاحة لهذا النموذج', variant: 'destructive' });
      return;
    }

    navigate(`/exam/${subjectId}/start`, {
      state: {
        studentName,
        examYear: parseInt(selectedYear),
        examTime,
        questionsCount: Math.min(subject?.questions_per_exam || 20, questionCount),
      },
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-96 max-w-2xl mx-auto rounded-2xl" />
        </div>
      </MainLayout>
    );
  }

  if (!subject) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground text-lg">المادة غير موجودة</p>
          <Link to="/levels">
            <Button className="mt-4">العودة للمستويات</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة</span>
          </button>

          <div className="max-w-2xl mx-auto">
            {/* Subject Info Card */}
            <div className="bg-card rounded-2xl border p-8 mb-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{subject.name}</h1>
                {subject.author_name && (
                  <p className="text-muted-foreground flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    إعداد: {subject.author_name}
                  </p>
                )}
              </div>

              {/* Exam Info */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Target className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{subject.passing_score}%</p>
                  <p className="text-sm text-muted-foreground">درجة النجاح</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{examTime}</p>
                  <p className="text-sm text-muted-foreground">دقيقة</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Student Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">اسم الطالب</Label>
                  <Input
                    id="name"
                    placeholder="أدخل اسمك الكامل"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="bg-background h-12"
                  />
                </div>

                {/* Exam Year */}
                <div className="space-y-2">
                  <Label className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    نموذج سنة الاختبار
                  </Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="bg-background h-12">
                      <SelectValue placeholder="اختر سنة النموذج" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {EXAM_YEARS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          نموذج {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Question Count */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">عدد الأسئلة المتاحة:</span>
                    <span className="font-bold text-lg">
                      {countLoading ? '...' : questionCount} سؤال
                    </span>
                  </div>
                  {selectedYear && questionCount > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      سيتم سحب {Math.min(subject.questions_per_exam, questionCount)} سؤال عشوائياً
                    </p>
                  )}
                </div>

                {/* Password if required */}
                {subject.password && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-500" />
                      كلمة مرور الاختبار
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="أدخل كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background h-12"
                    />
                  </div>
                )}

                {/* Time Slider */}
                {subject.allow_time_modification && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">مدة الاختبار</Label>
                      <span className="font-bold text-primary">{examTime} دقيقة</span>
                    </div>
                    <Slider
                      value={[examTime]}
                      onValueChange={([value]) => setExamTime(value)}
                      min={subject.min_time_minutes || 10}
                      max={subject.max_time_minutes || 120}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{subject.min_time_minutes || 10} دقيقة</span>
                      <span>{subject.max_time_minutes || 120} دقيقة</span>
                    </div>
                  </div>
                )}

                {/* Start Button */}
                <Button
                  onClick={handleStartExam}
                  disabled={!studentName.trim() || !selectedYear || questionCount === 0}
                  className="w-full h-14 text-lg gradient-primary text-primary-foreground border-0 gap-2"
                >
                  <Play className="w-5 h-5" />
                  ابدأ الاختبار
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ExamStart;
