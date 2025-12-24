/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Search, Edit2, Trash2, Calendar, BookOpen, Filter, FileSpreadsheet, FileCode, CheckCircle2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question, Subject, Level, EXAM_YEARS } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ExcelImportDialog } from '@/components/admin/ExcelImportDialog';
import { HtmlImportDialog } from '@/components/admin/HtmlImportDialog';

const AdminQuestions = () => {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isHtmlImportDialogOpen, setIsHtmlImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);

  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D',
    hint: '',
    exam_year: '',
  });

  // --- التعديل المطلوب: وظيفة المشاركة الاحترافية ---
  const handleShareResult = (score: number, total: number, subjectName: string, levelName: string, year: string) => {
    const percentage = Math.round((score / total) * 100);
    const shareText = `${levelName} - نموذج ${year}
🎓 نتيجتي في اختبار ${subjectName}

📊 النتيجة: ${score}/${total} (${percentage}%)
${percentage >= 60 ? '✅ لقد نجحت في الاختبار!' : '❌ سأحاول مجدداً لتحسين نتيجتي'}

🔗 اختبر نفسك الآن عبر منصة الناصر:
https://alnaser.vercel.app/

✨ تطوير: الناصر تِك للحلول الرقمية`;

    if (navigator.share) {
      navigator.share({
        title: `نتيجة اختبار ${subjectName}`,
        text: shareText,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "تم نسخ النتيجة والرابط",
        description: "يمكنك الآن مشاركة نجاحك مع زملائك عبر الواتساب",
      });
    }
  };
  // -----------------------------------------------

  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('levels').select('*').order('order_index');
      if (error) throw error;
      return data as Level[];
    },
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', selectedLevel],
    queryFn: async () => {
      let query = supabase.from('subjects').select('*').order('order_index');
      if (selectedLevel) query = query.eq('level_id', selectedLevel);
      const { data, error } = await query;
      if (error) throw error;
      return data as Subject[];
    },
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', selectedSubject, selectedYear, searchQuery],
    queryFn: async () => {
      let query = supabase.from('questions').select('*').eq('status', 'active').order('created_at', { ascending: false });
      if (selectedSubject) query = query.eq('subject_id', selectedSubject);
      if (selectedYear) query = query.eq('exam_year', parseInt(selectedYear));
      const { data, error } = await query;
      if (error) throw error;
      
      let filtered = data as Question[];
      if (searchQuery) {
        filtered = filtered.filter(q => q.question_text.includes(searchQuery));
      }
      return filtered;
    },
    enabled: !!selectedSubject,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { subject_id?: string; id?: string }) => {
      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update({
            question_text: data.question_text,
            option_a: data.option_a,
            option_b: data.option_b,
            option_c: data.option_c,
            option_d: data.option_d,
            correct_option: data.correct_option,
            hint: data.hint || null,
            exam_year: data.exam_year ? parseInt(data.exam_year) : null,
          })
          .eq('id', editingQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').insert({
          subject_id: selectedSubject,
          question_text: data.question_text,
          option_a: data.option_a,
          option_b: data.option_b,
          option_c: data.option_c,
          option_d: data.option_d,
          correct_option: data.correct_option,
          hint: data.hint || null,
          exam_year: data.exam_year ? parseInt(data.exam_year) : null,
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: editingQuestion ? 'تم تحديث السؤال' : 'تم إضافة السؤال بنجاح' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'حدث خطأ أثناء الحفظ', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (question: Question) => {
      if (role === 'admin') {
        const { error } = await supabase.from('questions').delete().eq('id', question.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('deletion_requests').insert({
          question_id: question.id,
          requested_by: user?.id,
        });
        if (error) throw error;
        await supabase.from('questions').update({ status: 'pending_deletion' }).eq('id', question.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({
        title: role === 'admin' ? 'تم حذف السؤال نهائياً' : 'تم إرسال طلب الحذف بنجاح',
      });
      setDeleteQuestion(null);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
    setFormData({
      question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
      correct_option: 'A', hint: '', exam_year: '',
    });
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
      hint: question.hint || '',
      exam_year: question.exam_year?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question_text || !formData.option_a || !formData.option_b || !formData.option_c || !formData.option_d) {
      toast({ title: 'يرجى ملء كافة البيانات المطلوبة', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900">إدارة بنك الأسئلة</h1>
            <p className="text-sm text-slate-500">منصة الناصر تِك للحلول الرقمية</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsHtmlImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200">
              <FileCode className="w-4 h-4 text-orange-500" /> استيراد HTML
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> استيراد Excel
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)} disabled={!selectedSubject} className="gradient-primary text-white gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> إضافة سؤال
            </Button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400 mr-1 uppercase">المستوى</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="اختر المستوى" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400 mr-1 uppercase">المادة</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="اختر المادة" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400 mr-1 uppercase">سنة النموذج</Label>
            <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كافة السنوات</SelectItem>
                {EXAM_YEARS.map((year) => <SelectItem key={year} value={year.toString()}>نموذج {year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400 mr-1 uppercase">البحث</Label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                placeholder="ابحث عن نص..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-white border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {!selectedSubject ? (
            <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-4">
              <BookOpen className="w-12 h-12 opacity-20" />
              <p className="font-medium">اختر مادة تعليمية لعرض الأسئلة</p>
            </div>
          ) : isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {questions.map((question, index) => (
                <div key={question.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">
                          {index + 1}
                        </span>
                        {question.exam_year && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                            نموذج {question.exam_year}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 mb-3">{question.question_text}</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                        <span className={cn(question.correct_option === 'A' && 'text-emerald-600 font-black')}>أ. {question.option_a}</span>
                        <span className={cn(question.correct_option === 'B' && 'text-emerald-600 font-black')}>ب. {question.option_b}</span>
                        <span className={cn(question.correct_option === 'C' && 'text-emerald-600 font-black')}>ج. {question.option_c}</span>
                        <span className={cn(question.correct_option === 'D' && 'text-emerald-600 font-black')}>د. {question.option_d}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-primary" onClick={() => handleEdit(question)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-destructive" onClick={() => setDeleteQuestion(question)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="font-bold">نص السؤال *</Label>
              <Textarea
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                rows={3}
                className="rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {['a', 'b', 'c', 'd'].map((opt) => (
                <div key={opt} className="space-y-2">
                  <Label className={cn("text-xs font-bold uppercase", formData.correct_option === opt.toUpperCase() && "text-emerald-600")}>
                    الخيار ({opt})
                  </Label>
                  <Input
                    value={formData[`option_${opt}` as keyof typeof formData] as string}
                    onChange={(e) => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">الإجابة الصحيحة *</Label>
                <Select value={formData.correct_option} onValueChange={(v) => setFormData({ ...formData, correct_option: v as 'A' | 'B' | 'C' | 'D' })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">الخيار (A)</SelectItem>
                    <SelectItem value="B">الخيار (B)</SelectItem>
                    <SelectItem value="C">الخيار (C)</SelectItem>
                    <SelectItem value="D">الخيار (D)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">سنة النموذج</Label>
                <Select value={formData.exam_year} onValueChange={(v) => setFormData({ ...formData, exam_year: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_YEARS.map((year) => <SelectItem key={year} value={year.toString()}>نموذج {year}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pb-4">
              <Label className="font-bold text-slate-400">تلميح أو شرح للإجابة</Label>
              <Textarea
                value={formData.hint}
                onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                rows={2}
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>إلغاء</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="gradient-primary text-white px-8 rounded-xl shadow-lg shadow-primary/20">
                {saveMutation.isPending ? 'جاري الحفظ...' : editingQuestion ? 'تحديث' : 'حفظ السؤال'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Logic & Dialogs */}
      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {role === 'admin' ? 'هل أنت متأكد من حذف هذا السؤال نهائياً؟' : 'سيتم إرسال طلب حذف للمسؤول.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteQuestion && deleteMutation.mutate(deleteQuestion)} className="bg-destructive text-white rounded-xl">
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExcelImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} subjectId={selectedSubject} />
      <HtmlImportDialog open={isHtmlImportDialogOpen} onOpenChange={setIsHtmlImportDialogOpen} subjectId={selectedSubject} />
    </AdminLayout>
  );
};

export default AdminQuestions;
