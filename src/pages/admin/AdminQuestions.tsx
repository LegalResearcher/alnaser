/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 * Version: 7.0 (Final Stable Build - Supports PDF, Text, HTML)
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

// استيراد مكتبة PDF.js لمعالجة الملفات
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- المحرك الذكي لاستخراج الأسئلة القانونية ---
const parseLegalExamContent = (textContent: string) => {
  const lines = textContent.split('\n');
  const extractedQuestions: any[] = [];
  let currentQ: any = null;

  lines.forEach((line) => {
    const text = line.trim();
    if (!text || text.length < 2) return;

    // 1. اكتشاف السؤال: ينتهي بنقطتين (:) أو (؟)
    if (text.endsWith(':') || text.includes('؟')) {
      if (currentQ && currentQ.option_a) extractedQuestions.push(currentQ);
      currentQ = {
        id: Math.random().toString(36).substr(2, 9),
        question_text: text,
        option_a: '', option_b: '', option_c: '', option_d: '',
        correct_option: 'A',
        count: 0
      };
    } 
    // 2. اكتشاف الخيارات: يدعم الأنماط (1) أو 1)
    else if (text.match(/^\d+[\)\-\s]/) || text.match(/^\(\d+/) || text.includes('(1')) {
      if (!currentQ) return;
      
      let optValue = text.replace(/^[\d\(\)\-\s]+/, '').trim();
      const isCorrect = optValue.includes('+');
      const cleanValue = optValue.replace('+', '').replace(/^-/, '').trim();
      
      currentQ.count++;
      const letter = ['A', 'B', 'C', 'D'][currentQ.count - 1];
      if (letter) {
        currentQ[`option_${letter.toLowerCase()}`] = cleanValue;
        if (isCorrect) currentQ.correct_option = letter;
      }
    }
  });

  if (currentQ && currentQ.option_a) extractedQuestions.push(currentQ);
  return extractedQuestions;
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
  
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isHtmlImportDialogOpen, setIsHtmlImportDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D', hint: '', exam_year: '',
  });

  // --- دوال معالجة ملفات PDF ---
  const extractPDFText = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join('\n') + '\n';
    }
    return fullText;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    try {
      const content = file.type === "application/pdf" ? await extractPDFText(file) : await file.text();
      const extracted = parseLegalExamContent(content);
      if (extracted.length > 0) {
        setPreviewQuestions(extracted);
        setIsFileUploadOpen(false);
        setIsPreviewOpen(true);
      } else {
        toast({ title: 'تنبيه', description: 'لم نجد أسئلة متوافقة، تأكد من وجود علامة النقطتين (:) وعلامة (+)', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'خطأ في قراءة الملف', variant: 'destructive' });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updatePreview = (id: string, field: string, val: string) => {
    setPreviewQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: val } : q));
  };

  const removePreviewQuestion = (id: string) => {
    setPreviewQuestions(prev => prev.filter(q => q.id !== id));
  };

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
      if (searchQuery) filtered = filtered.filter(q => q.question_text.includes(searchQuery));
      return filtered;
    },
    enabled: !!selectedSubject,
  });

  const bulkSaveMutation = useMutation({
    mutationFn: async (list: any[]) => {
      const formatted = list.map(q => ({
        subject_id: selectedSubject,
        question_text: q.question_text,
        option_a: q.option_a, option_b: q.option_b,
        option_c: q.option_c || null, option_d: q.option_d || null,
        correct_option: q.correct_option,
        exam_year: selectedYear ? parseInt(selectedYear) : null,
        created_by: user?.id,
        status: 'active'
      }));
      const { error } = await supabase.from('questions').insert(formatted);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: 'تم استيراد كافة الأسئلة بنجاح ✅' });
      setIsPreviewOpen(false);
      setPreviewQuestions([]);
    }
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false); setEditingQuestion(null);
    setFormData({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', hint: '', exam_year: '' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-cairo">إدارة بنك الأسئلة</h1>
            <p className="text-sm text-slate-500 font-medium">نظام الاستيراد الذكي للـ PDF والنصوص</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFileUploadOpen(true)} disabled={!selectedSubject} className="gap-2 border-primary/20 bg-primary/5 text-primary font-bold shadow-sm">
              <FileUp className="w-4 h-4" /> استيراد PDF / نص
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsHtmlImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200">
              <FileCode className="w-4 h-4 text-orange-500" /> HTML
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)} disabled={!selectedSubject} className="gradient-primary text-white gap-2 shadow-lg">
              <Plus className="w-4 h-4" /> إضافة سؤال
            </Button>
          </div>
        </div>

        {/* Filters Section - تم تصحيح الأخطاء البرمجية هنا */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative z-20 font-cairo font-bold">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="المستوى" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white border-slate-100 shadow-2xl">
              {levels.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="المادة" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white border-slate-100 shadow-2xl">
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}>
            <SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="السنة" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white shadow-2xl max-h-[250px] overflow-y-auto">
              <SelectItem value="all">كافة السنوات</SelectItem>
              {EXAM_YEARS.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-white border-slate-200 rounded-xl" /></div>
        </div>

        {/* Questions Display Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden z-10 min-h-[400px]">
          {!selectedSubject ? (
            <div className="p-24 text-center text-slate-400 flex flex-col items-center gap-4"><BookOpen className="w-16 h-16 opacity-10" /><p className="font-bold">يرجى اختيار مادة تعليمية لعرض المحتوى</p></div>
          ) : isLoading ? (
            <div className="p-6 space-y-4"><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {questions.map((q, i) => (
                <div key={q.id} className="p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-lg mb-4 font-cairo">{q.question_text}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className={cn("p-4 rounded-xl border transition-all", q.correct_option === 'A' ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" : "bg-white border-slate-100 text-slate-500")}>أ. {q.option_a}</div>
                        <div className={cn("p-4 rounded-xl border transition-all", q.correct_option === 'B' ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" : "bg-white border-slate-100 text-slate-500")}>ب. {q.option_b}</div>
                      </div>
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
        <DialogContent className="max-w-5xl bg-white rounded-3xl p-8 border-none shadow-2xl h-[94vh] flex flex-col overflow-hidden z-[9999]">
          <DialogHeader className="border-b pb-6 flex flex-row items-center justify-between">
            <div><DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900 font-cairo"><Eye className="text-primary w-8 h-8" /> مراجعة استخراج الـ PDF</DialogTitle><p className="text-xs text-slate-400 font-bold">لديك ({previewQuestions.length}) سؤالاً. يمكنك التعديل قبل الحفظ.</p></div>
            <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-bold px-8">إلغاء</Button>
               <Button onClick={() => bulkSaveMutation.mutate(previewQuestions)} disabled={bulkSaveMutation.isPending} className="gradient-primary text-white font-black px-12 rounded-xl shadow-xl">{bulkSaveMutation.isPending ? <Loader2 className="animate-spin" /> : <Save className="mr-2 w-4 h-4" />} تأكيد وحفظ الكل</Button>
            </div>
          </DialogHeader>
          <div className="mt-4"><Input placeholder="بحث داخل المعاينة..." value={previewSearch} onChange={(e) => setPreviewSearch(e.target.value)} className="h-12 bg-slate-50 rounded-2xl font-bold font-cairo" /></div>
          <ScrollArea className="flex-1 mt-6 pr-4">
            <div className="space-y-10 pb-12">
              {previewQuestions.filter(x => x.question_text.includes(previewSearch)).map((q, idx) => (
                <div key={q.id} className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100 relative group/item">
                  <button onClick={() => removePreviewQuestion(q.id)} className="absolute -left-3 -top-3 w-10 h-10 bg-white border border-red-100 text-destructive rounded-2xl flex items-center justify-center shadow-lg hover:bg-destructive hover:text-white transition-all opacity-0 group-hover/item:opacity-100 z-30"><Trash2 className="w-5 h-5" /></button>
                  <Textarea value={q.question_text} onChange={(e) => updatePreview(q.id, 'question_text', e.target.value)} className="mb-8 rounded-2xl border-slate-200 font-bold text-lg bg-white min-h-[90px] font-cairo" dir="rtl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['A', 'B', 'C', 'D'].map((letter) => {
                      const field = `option_${letter.toLowerCase()}`;
                      const isCorrect = q.correct_option === letter;
                      if (!q[field] && letter !== 'A' && letter !== 'B') return null;
                      return (
                        <div key={letter} className="space-y-2 font-cairo">
                          <div className="flex items-center justify-between px-1"><Label className="text-[10px] font-black text-slate-400">الخيار ({letter})</Label><button onClick={() => updatePreview(q.id, 'correct_option', letter)} className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg transition-all", isCorrect ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400 hover:bg-slate-300")}>{isCorrect ? 'الإجابة الصحيحة ✅' : 'تحديد كإجابة'}</button></div>
                          <Input value={q[field]} onChange={(e) => updatePreview(q.id, field, e.target.value)} className={cn("rounded-xl border-slate-200 font-bold text-sm bg-white", isCorrect && "border-emerald-500 ring-2 ring-emerald-500/10")} dir="rtl" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* --- حوار الرفع الرئيسي --- */}
      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-10 shadow-2xl border-none z-[9999]">
          <DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3 font-cairo"><FileUp className="text-primary" /> رفع ملف الاختبار الذكي</DialogTitle></DialogHeader>
          <div onClick={() => fileInputRef.current?.click()} className="mt-8 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.html" />
            {isProcessingFile ? (
              <div className="flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 text-primary animate-spin" /><p className="text-sm font-black text-slate-600">جاري قراءة محتوى الملف...</p></div>
            ) : (
              <div className="flex flex-col items-center gap-4"><div className="p-5 bg-slate-100 rounded-2xl group-hover:scale-110 group-hover:bg-white transition-all shadow-sm"><FileText className="w-10 h-10 text-slate-400 group-hover:text-primary" /></div><p className="font-black text-slate-700 text-lg font-cairo">اضغط لاختيار ملف PDF أو نص</p></div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ExcelImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} subjectId={selectedSubject} />
      <HtmlImportDialog open={isHtmlImportDialogOpen} onOpenChange={setIsHtmlImportDialogOpen} subjectId={selectedSubject} />

      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white p-8 border-none shadow-2xl">
          <AlertDialogHeader><AlertDialogTitle className="font-black text-2xl text-slate-900">تأكيد عملية الحذف</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-8"><AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel><AlertDialogAction onClick={() => deleteQuestion && supabase.from('questions').update({ status: 'deleted' }).eq('id', deleteQuestion.id).then(() => queryClient.invalidateQueries())} className="bg-destructive text-white rounded-xl font-black px-10">حذف نهائي</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 z-[9999]">
          <DialogHeader><DialogTitle className="text-2xl font-black font-cairo tracking-tight">{editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-6 mt-6 font-cairo font-bold">
            <div className="space-y-2.5"><Label className="font-black text-slate-700">نص السؤال *</Label><Textarea value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} required className="rounded-2xl border-slate-200 min-h-[120px]" /></div>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="أ" value={formData.option_a} onChange={(e) => setFormData({ ...formData, option_a: e.target.value })} required className="rounded-xl" />
              <Input placeholder="ب" value={formData.option_b} onChange={(e) => setFormData({ ...formData, option_b: e.target.value })} required className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t"><Button type="button" variant="ghost" onClick={handleCloseDialog} className="rounded-xl">إلغاء</Button><Button type="submit" disabled={saveMutation.isPending} className="gradient-primary text-white px-10 rounded-xl">حفظ</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminQuestions;
