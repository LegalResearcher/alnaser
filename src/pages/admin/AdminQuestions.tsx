/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 * Final Version: Fixed Imports & Integrated Smart Parser with Preview
 */

import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Plus, Search, Edit2, Trash2, Calendar, BookOpen, Filter, 
  FileSpreadsheet, FileCode, CheckCircle2, FileUp, Loader2, 
  FileText, AlertCircle, Eye, Save, PencilLine, X 
} from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExcelImportDialog } from '@/components/admin/ExcelImportDialog';
import { HtmlImportDialog } from '@/components/admin/HtmlImportDialog';

// --- محرك الاستخراج الذكي (Sana'a University Pattern) ---
const parseSanaaContent = (text: string) => {
  const lines = text.split('\n');
  const results: any[] = [];
  let current: any = null;

  lines.forEach(line => {
    const t = line.trim();
    if (!t) return;

    // اكتشاف السؤال: ينتهي بـ (:) أو (؟)
    if (t.endsWith(':') || t.includes('؟')) {
      if (current && current.option_a) results.push(current);
      current = {
        id: Math.random().toString(36).substr(2, 9),
        question_text: t,
        option_a: '', option_b: '', option_c: '', option_d: '',
        correct_option: 'A',
        count: 0
      };
    } 
    // اكتشاف الخيارات: تبدأ بـ (1) أو 1) أو +
    else if (t.match(/^\d+[\)\-\s]/) || t.match(/^\(\d+/) || t.includes('(1')) {
      if (!current) return;
      const isCorrect = t.includes('+');
      // تنظيف الخيار من الأرقام والعلامات
      let clean = t.replace(/^\d+[\)\-\s]*/, '').replace(/^\(\d+[\)\-\s]*/, '').replace('+', '').replace(/^-/, '').trim();
      
      current.count++;
      const letter = ['A', 'B', 'C', 'D'][current.count - 1];
      if (letter) {
        current[`option_${letter.toLowerCase()}`] = clean;
        if (isCorrect) current.correct_option = letter;
      }
    }
  });
  if (current && current.option_a) results.push(current);
  return results;
};

const AdminQuestions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // States للنوافذ الجديدة
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isHtmlImportDialogOpen, setIsHtmlImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);

  const [formData, setFormData] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D', hint: '', exam_year: '',
  });

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
      const { data, error } = query;
      const { data: res, error: err } = await query;
      if (err) throw err;
      return res as Subject[];
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
      if (searchQuery) filtered = filtered.filter(q => q.question_text.includes(searchQuery));
      return filtered;
    },
    enabled: !!selectedSubject,
  });

  // دوال المعاينة
  const updatePreview = (id: string, field: string, val: string) => {
    setPreviewQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: val } : q));
  };

  const removePreview = (id: string) => {
    setPreviewQuestions(prev => prev.filter(q => q.id !== id));
  };

  const filteredPreview = previewQuestions.filter(q => q.question_text.includes(previewSearch));

  const bulkSave = useMutation({
    mutationFn: async (list: any[]) => {
      const formatted = list.map(q => ({
        subject_id: selectedSubject,
        question_text: q.question_text,
        option_a: q.option_a, option_b: q.option_b,
        option_c: q.option_c || null, option_d: q.option_d || null,
        correct_option: q.correct_option,
        exam_year: selectedYear ? parseInt(selectedYear) : null,
        created_by: user?.id
      }));
      const { error } = await supabase.from('questions').insert(formatted);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: 'تم حفظ كافة الأسئلة بنجاح ✅' });
      setIsPreviewOpen(false);
      setPreviewQuestions([]);
    }
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const extracted = parseSanaaContent(ev.target?.result as string);
      if (extracted.length > 0) {
        setPreviewQuestions(extracted);
        setIsFileUploadOpen(false);
        setIsPreviewOpen(true);
      } else {
        toast({ title: 'لم يتم العثور على أسئلة بالتنسيق المطلوب', variant: 'destructive' });
      }
      setIsProcessingFile(false);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingQuestion) {
        await supabase.from('questions').update({
          question_text: data.question_text, option_a: data.option_a, option_b: data.option_b,
          option_c: data.option_c, option_d: data.option_d, correct_option: data.correct_option,
          exam_year: data.exam_year ? parseInt(data.exam_year) : null,
        }).eq('id', editingQuestion.id);
      } else {
        await supabase.from('questions').insert({
          subject_id: selectedSubject, question_text: data.question_text,
          option_a: data.option_a, option_b: data.option_b, option_c: data.option_c,
          option_d: data.option_d, correct_option: data.correct_option,
          exam_year: data.exam_year ? parseInt(data.exam_year) : null, created_by: user?.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: editingQuestion ? 'تم التحديث' : 'تمت الإضافة' });
      handleCloseDialog();
    }
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false); setEditingQuestion(null);
    setFormData({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', hint: '', exam_year: '' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900">إدارة بنك الأسئلة</h1>
            <p className="text-sm text-slate-500">منصة الناصر تِك للحلول الرقمية</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFileUploadOpen(true)} disabled={!selectedSubject} className="gap-2 border-primary/20 bg-primary/5 text-primary font-bold">
              <FileUp className="w-4 h-4" /> استيراد ذكي
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsHtmlImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200">
              <FileCode className="w-4 h-4 text-orange-500" /> HTML
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
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold font-cairo"><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white">{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold font-cairo"><SelectValue placeholder="اختر المادة" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white">{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}>
            <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold font-cairo"><SelectValue placeholder="الكل" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white">{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>نموذج {y}</SelectItem>)}</SelectContent>
          </Select>
          <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-white border-slate-200 rounded-xl" /></div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden z-10 min-h-[300px]">
          {!selectedSubject ? (
            <div className="p-20 text-center text-slate-400"><BookOpen className="w-12 h-12 mx-auto opacity-20 mb-4" /><p>اختر مادة تعليمية لعرض الأسئلة</p></div>
          ) : isLoading ? (
            <div className="p-6 space-y-4"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {questions.map((q, i) => (
                <div key={q.id} className="p-5 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 mb-3">{q.question_text}</p>
                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                        <span className={cn(q.correct_option === 'A' && "text-emerald-600 font-black")}>أ. {q.option_a}</span>
                        <span className={cn(q.correct_option === 'B' && "text-emerald-600 font-black")}>ب. {q.option_b}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingQuestion(q); setFormData({ question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c || '', option_d: q.option_d || '', correct_option: q.correct_option, hint: q.hint || '', exam_year: q.exam_year?.toString() || '' }); setIsDialogOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteQuestion(q)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- حوار المعاينة المطور --- */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl bg-white rounded-3xl p-8 h-[92vh] flex flex-col z-[9999]">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <DialogTitle className="text-2xl font-black flex items-center gap-3"><Eye className="text-primary" /> معاينة وتعديل الأسئلة</DialogTitle>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>إلغاء</Button>
              <Button onClick={() => bulkSave.mutate(previewQuestions)} disabled={bulkSave.isPending} className="gradient-primary text-white font-black px-8 rounded-xl shadow-lg">حفظ الكل</Button>
            </div>
          </DialogHeader>
          <div className="py-4"><Input placeholder="بحث داخل المعاينة..." value={previewSearch} onChange={(e) => setPreviewSearch(e.target.value)} className="rounded-xl bg-slate-50" /></div>
          <ScrollArea className="flex-1 mt-4">
            <div className="space-y-6 pb-10">
              {filteredPreview.map((q) => (
                <div key={q.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative group/item">
                  <button onClick={() => removePreview(q.id)} className="absolute left-4 top-4 text-red-400 opacity-0 group-hover/item:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  <Textarea value={q.question_text} onChange={(e) => updatePreview(q.id, 'question_text', e.target.value)} className="mb-4 font-bold border-slate-200 bg-white" />
                  <div className="grid grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map(l => (
                      <div key={l} className="space-y-1">
                        <Label className="text-[10px] font-black flex justify-between">خيار {l} <button onClick={() => updatePreview(q.id, 'correct_option', l)} className={cn("text-[9px] px-2 rounded-full", q.correct_option === l ? "bg-emerald-500 text-white" : "bg-slate-200")}>{q.correct_option === l ? 'صحيح' : 'تحديد كإجابة'}</button></Label>
                        <Input value={q[`option_${l.toLowerCase()}`]} onChange={(e) => updatePreview(q.id, `option_${l.toLowerCase()}`, e.target.value)} className="rounded-lg bg-white" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* --- حوار الرفع --- */}
      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-10 z-[9999]">
          <DialogHeader><DialogTitle className="text-xl font-black flex items-center gap-3"><FileUp className="text-primary" /> استيراد ملف الجامعة</DialogTitle></DialogHeader>
          <div onClick={() => fileInputRef.current?.click()} className="mt-8 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:bg-primary/5 cursor-pointer">
            <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" accept=".txt,.html" />
            {isProcessingFile ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> : <FileText className="w-10 h-10 text-slate-400 mx-auto mb-4" />}
            <p className="font-black text-slate-700">اضغط لاختيار ملف الاختبار</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* بقية الحوارات الأصلية */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 z-[9999]">
          <DialogHeader><DialogTitle className="text-xl font-black">إضافة/تعديل سؤال</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4 mt-4">
            <Textarea value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} required className="rounded-xl border-slate-200" />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="أ" value={formData.option_a} onChange={(e) => setFormData({ ...formData, option_a: e.target.value })} required className="rounded-xl" />
              <Input placeholder="ب" value={formData.option_b} onChange={(e) => setFormData({ ...formData, option_b: e.target.value })} required className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>إلغاء</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="gradient-primary text-white px-8 rounded-xl">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white">
          <AlertDialogHeader><AlertDialogTitle className="font-black">تأكيد الحذف</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteQuestion && supabase.from('questions').update({ status: 'deleted' }).eq('id', deleteQuestion.id).then(() => queryClient.invalidateQueries())} className="bg-destructive text-white rounded-xl font-black px-8">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExcelImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} subjectId={selectedSubject} />
      <HtmlImportDialog open={isHtmlImportDialogOpen} onOpenChange={setIsHtmlImportDialogOpen} subjectId={selectedSubject} />
    </AdminLayout>
  );
};

export default AdminQuestions;
