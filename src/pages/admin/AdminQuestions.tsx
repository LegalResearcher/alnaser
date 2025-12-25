/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 * Feature: Smart Text Parser for Sana'a University PDF Formats
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Search, Edit2, Trash2, Calendar, BookOpen, Filter, FileSpreadsheet, FileCode, CheckCircle2, FileText, Loader2 } from 'lucide-react';
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

// --- السكربت الذكي لتحليل النص ---
const parseSanaaUniversityText = (text: string) => {
  const lines = text.split('\n');
  const questions: any[] = [];
  let currentQuestion: any = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // اكتشاف السؤال: يبحث عن علامة الاستفهام أو نص ينتهي بنقطتين
    if (trimmed.includes('؟')) {
      if (currentQuestion) questions.push(currentQuestion);
      currentQuestion = {
        question_text: trimmed,
        option_a: '', option_b: '', option_c: '', option_d: '',
        correct_option: 'A',
        options_count: 0
      };
    } 
    // اكتشاف الخيارات: يبحث عن الأنماط (1) أو (2) أو (3) أو (4)
    else if (trimmed.match(/^\(\d+\)/) || trimmed.includes('(1') || trimmed.includes('(2')) {
      if (!currentQuestion) return;
      
      let optText = trimmed.replace(/^\(\d+\)/, '').trim();
      optText = optText.replace(/^\d+\s+/, '').trim(); // إزالة أرقام إضافية
      
      const isCorrect = optText.includes('+');
      const cleanText = optText.replace('+', '').trim();
      
      currentQuestion.options_count++;
      const optionLetter = ['A', 'B', 'C', 'D'][currentQuestion.options_count - 1];
      
      if (optionLetter === 'A') currentQuestion.option_a = cleanText;
      else if (optionLetter === 'B') currentQuestion.option_b = cleanText;
      else if (optionLetter === 'C') currentQuestion.option_c = cleanText;
      else if (optionLetter === 'D') currentQuestion.option_d = cleanText;
      
      if (isCorrect) currentQuestion.correct_option = optionLetter;
    }
  });

  if (currentQuestion) questions.push(currentQuestion);
  return questions;
};

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
  const [isTextImportOpen, setIsTextImportOpen] = useState(false); // الحالة الجديدة
  const [rawText, setRawText] = useState(''); // النص الخام
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);

  const [formData, setFormData] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D', hint: '', exam_year: '',
  });

  // --- الاستعلامات ---
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

  // --- العمليات (Mutations) ---
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { subject_id?: string; id?: string }) => {
      if (editingQuestion) {
        const { error } = await supabase.from('questions').update({
          question_text: data.question_text, option_a: data.option_a, option_b: data.option_b,
          option_c: data.option_c, option_d: data.option_d, correct_option: data.correct_option,
          hint: data.hint || null, exam_year: data.exam_year ? parseInt(data.exam_year) : null,
        }).eq('id', editingQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').insert({
          subject_id: selectedSubject, question_text: data.question_text, option_a: data.option_a,
          option_b: data.option_b, option_c: data.option_c, option_d: data.option_d,
          correct_option: data.correct_option, hint: data.hint || null,
          exam_year: data.exam_year ? parseInt(data.exam_year) : null, created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: editingQuestion ? 'تم تحديث السؤال' : 'تم إضافة السؤال بنجاح' });
      handleCloseDialog();
    },
  });

  const bulkInsertMutation = useMutation({
    mutationFn: async (questionsList: any[]) => {
      const formatted = questionsList.map(q => ({
        subject_id: selectedSubject,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        exam_year: selectedYear ? parseInt(selectedYear) : null,
        created_by: user?.id
      }));
      const { error } = await supabase.from('questions').insert(formatted);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: 'تم استيراد كافة الأسئلة بنجاح' });
      setIsTextImportOpen(false);
      setRawText('');
    },
    onError: (err) => {
      toast({ title: 'فشل الاستيراد الجماعي', description: err.message, variant: 'destructive' });
    }
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
      question_text: question.question_text, option_a: question.option_a,
      option_b: question.option_b, option_c: question.option_c, option_d: question.option_d,
      correct_option: question.correct_option, hint: question.hint || '',
      exam_year: question.exam_year?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleTextImport = () => {
    if (!rawText.trim()) {
      toast({ title: 'يرجى لصق النص أولاً', variant: 'destructive' });
      return;
    }
    const extracted = parseSanaaUniversityText(rawText);
    if (extracted.length === 0) {
      toast({ title: 'لم يتم العثور على أسئلة، تأكد من وجود علامة ؟', variant: 'destructive' });
      return;
    }
    bulkInsertMutation.mutate(extracted);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900">إدارة بنك الأسئلة</h1>
            <p className="text-sm text-slate-500">منصة الناصر تِك للحلول الرقمية</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsTextImportOpen(true)} disabled={!selectedSubject} className="gap-2 border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700">
              <FileText className="w-4 h-4" /> استيراد نصي ذكي
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsHtmlImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200">
              <FileCode className="w-4 h-4 text-blue-500" /> HTML
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)} disabled={!selectedSubject} className="gradient-primary text-white gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> إضافة سؤال
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative z-20">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400 mr-1 uppercase">المستوى</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
              <SelectContent className="z-[9999] bg-white border-slate-200 shadow-xl">
                {levels.map((level) => <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400 mr-1 uppercase">المادة</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="اختر المادة" /></SelectTrigger>
              <SelectContent className="z-[9999] bg-white border-slate-200 shadow-xl">
                {subjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400 mr-1 uppercase">سنة النموذج</Label>
            <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent className="z-[9999] bg-white border-slate-200 shadow-xl max-h-[250px] overflow-y-auto">
                <SelectItem value="all">كافة السنوات</SelectItem>
                {EXAM_YEARS.map((year) => <SelectItem key={year} value={year.toString()}>نموذج {year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400 mr-1 uppercase">البحث</Label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input placeholder="ابحث هنا..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-white border-slate-200 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden z-10">
          {!selectedSubject ? (
            <div className="p-20 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto opacity-20 mb-4" />
              <p>اختر مادة تعليمية لعرض الأسئلة</p>
            </div>
          ) : isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {questions.map((question, index) => (
                <div key={question.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">{index + 1}</span>
                        {question.exam_year && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">نموذج {question.exam_year}</span>}
                      </div>
                      <p className="font-bold text-slate-800 mb-3">{question.question_text}</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                        <span className={cn(question.correct_option === 'A' && "text-emerald-600 font-black")}>أ. {question.option_a}</span>
                        <span className={cn(question.correct_option === 'B' && "text-emerald-600 font-black")}>ب. {question.option_b}</span>
                        {question.option_c && <span className={cn(question.correct_option === 'C' && "text-emerald-600 font-black")}>ج. {question.option_c}</span>}
                        {question.option_d && <span className={cn(question.correct_option === 'D' && "text-emerald-600 font-black")}>د. {question.option_d}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(question)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteQuestion(question)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Smart Text Import Dialog */}
      <Dialog open={isTextImportOpen} onOpenChange={setIsTextImportOpen}>
        <DialogContent className="max-w-3xl bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <FileText className="text-orange-500" /> استيراد نصي ذكي (جامعة صنعاء)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-xs text-amber-800 space-y-1">
              <p className="font-bold">⚠️ تعليمات هامة:</p>
              <p>1. انسخ نص الأسئلة من الـ PDF كما هو.</p>
              <p>2. تأكد أن الإجابة الصحيحة بجانبها علامة (+) في النص المنسوخ.</p>
              <p>3. سيتم ربط الأسئلة بالمادة والسنة المحددة حالياً في الفلاتر.</p>
            </div>
            <Textarea 
              placeholder="قم بلصق نص الـ PDF هنا..." 
              className="min-h-[350px] rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all text-right"
              dir="rtl"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsTextImportOpen(false)}>إلغاء</Button>
              <Button 
                onClick={handleTextImport}
                disabled={bulkInsertMutation.isPending}
                className="gradient-primary text-white px-10 rounded-xl shadow-lg shadow-primary/20"
              >
                {bulkInsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                تحليل وبدء الاستيراد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Standard Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-black">إضافة/تعديل سؤال</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="font-bold">نص السؤال *</Label>
              <Textarea value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} required className="rounded-xl border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs font-bold">الخيار (A)</Label><Input value={formData.option_a} onChange={(e) => setFormData({ ...formData, option_a: e.target.value })} className="rounded-xl" required /></div>
              <div className="space-y-2"><Label className="text-xs font-bold">الخيار (B)</Label><Input value={formData.option_b} onChange={(e) => setFormData({ ...formData, option_b: e.target.value })} className="rounded-xl" required /></div>
              <div className="space-y-2"><Label className="text-xs font-bold">الخيار (C)</Label><Input value={formData.option_c} onChange={(e) => setFormData({ ...formData, option_c: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold">الخيار (D)</Label><Input value={formData.option_d} onChange={(e) => setFormData({ ...formData, option_d: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">الإجابة الصحيحة *</Label>
                <Select value={formData.correct_option} onValueChange={(v) => setFormData({ ...formData, correct_option: v as 'A'|'B'|'C'|'D' })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white z-[9999]"><SelectItem value="A">أ</SelectItem><SelectItem value="B">ب</SelectItem><SelectItem value="C">ج</SelectItem><SelectItem value="D">د</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">السنة</Label>
                <Select value={formData.exam_year} onValueChange={(v) => setFormData({ ...formData, exam_year: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر السنة" /></SelectTrigger>
                  <SelectContent className="bg-white z-[9999]">{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>إلغاء</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="gradient-primary text-white px-8 rounded-xl">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader><AlertDialogTitle className="font-black">تأكيد الحذف</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteQuestion) {
                 supabase.from('questions').update({ status: 'deleted' }).eq('id', deleteQuestion.id)
                 .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['questions'] });
                    setDeleteQuestion(null);
                 });
              }
            }} className="bg-destructive text-white rounded-xl">حذف نهائي</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExcelImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} subjectId={selectedSubject} />
      <HtmlImportDialog open={isHtmlImportDialogOpen} onOpenChange={setIsHtmlImportDialogOpen} subjectId={selectedSubject} />
    </AdminLayout>
  );
};

export default AdminQuestions;
