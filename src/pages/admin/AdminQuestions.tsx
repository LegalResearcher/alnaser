/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 * Version: 21.3 (Advanced Scanned PDF & OCR Support)
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Plus, Search, Edit2, Trash2, BookOpen, CheckCircle2, FileUp, 
  Loader2, FileText, AlertCircle, Eye, Save, X, PencilLine, ScanLine
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// إعداد عامل PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

const EXAM_FORMS = [
  { id: 'General', name: 'نموذج العام' },
  { id: 'Parallel', name: 'نموذج الموازي' },
  { id: 'Mixed', name: 'نموذج مختلط' }
];

// --- محرك الاستخراج الذكي المتطور (يدعم الجداول والنصوص الممسوحة) ---
const parseSanaaLegalContent = (text: string) => {
  const cleanText = text.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/_/g, '');
  const lines = cleanText.split('\n');
  const results: any[] = [];
  let current: any = null;

  lines.forEach(line => {
    const t = line.trim();
    if (!t || t.length < 2) return;

    // نمط السؤال: رقم يليه شرطة أو نقطة (مثل: 1 - أو 1.)
    const questionMatch = t.match(/^(\d+)\s*[-\.\)]\s*(.+)/);
    
    // نمط الخيار: (1 أو أ) يليه علامة ترقيم
    const optionMatch = t.match(/^([1-4]|[أبجد])\s*[-\.\)]\s*(.+)/);

    if (questionMatch) {
      if (current && current.count > 0) results.push(current);
      current = {
        id: Math.random().toString(36).substr(2, 9),
        question_text: questionMatch[2].trim(),
        option_a: '', option_b: '', option_c: '', option_d: '',
        correct_option: 'A',
        count: 0
      };
    } 
    else if (optionMatch && current) {
      const isCorrect = t.includes('+') || t.includes('✅') || false;
      let cleanVal = optionMatch[2].trim();

      if (cleanVal) {
        current.count++;
        const letters = ['A', 'B', 'C', 'D'];
        const letter = letters[current.count - 1];
        if (letter) {
          current[`option_${letter.toLowerCase()}`] = cleanVal;
          if (isCorrect) current.correct_option = letter;
        }
      }
    } 
    else if (current && t.length > 10 && !t.match(/^\d/)) {
      // دمج الأسطر المكسورة في الأسئلة الممسوحة ضوئياً
      current.question_text += ' ' + t;
    }
  });

  if (current && current.count > 0) results.push(current);
  return results;
};

const AdminQuestions = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isEditor } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedExamForm, setSelectedExamForm] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');
  const [importExamForm, setImportExamForm] = useState<string>('General');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D', hint: '', exam_year: '', exam_form: 'General',
  });

  // --- معالجة الـ PDF الممسوح ضوئياً (تنسيق ملفك الحالي) ---
  const processScannedPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // محاولة استخراج النص المباشر أولاً
      const textContent = await page.getTextContent();
      const directText = textContent.items.map((it: any) => it.str).join(' ');

      if (directText.trim().length > 100) {
        fullText += directText + "\n";
      } else {
        // إذا كان الملف ممسوح ضوئياً (صور)، نستخدم OCR
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;
        const { data: { text } } = await Tesseract.recognize(canvas, 'ara+eng');
        fullText += text + "\n";
      }
    }
    return fullText;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    try {
      let extractedText = "";
      if (file.type === "application/pdf") {
        extractedText = await processScannedPDF(file);
      } else if (file.type.startsWith("image/")) {
        const { data: { text } } = await Tesseract.recognize(file, 'ara+eng');
        extractedText = text;
      } else {
        extractedText = await file.text();
      }

      const questions = parseSanaaLegalContent(extractedText);
      if (questions.length > 0) {
        setPreviewQuestions(questions);
        setIsFileUploadOpen(false);
        setIsPreviewOpen(true);
      } else {
        toast({ title: "فشل التعرف", description: "لم نتمكن من العثور على أسئلة مرقمة في الملف.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ في المعالجة", description: "تأكد من جودة الملف المرفوع.", variant: "destructive" });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Mutations & Queries (نفس الكود السابق لضمان استقرار الوظائف) ---
  const { data: levels = [] } = useQuery({ queryKey: ['levels'], queryFn: async () => (await supabase.from('levels').select('*').order('order_index')).data as Level[] });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects', selectedLevel], queryFn: async () => { let q = supabase.from('subjects').select('*').order('order_index'); if(selectedLevel) q = q.eq('level_id', selectedLevel); return (await q).data as Subject[]; } });
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', selectedSubject, selectedYear, selectedExamForm, searchQuery],
    queryFn: async () => {
      let query = supabase.from('questions').select('*').eq('status', 'active').order('created_at', { ascending: false });
      if (selectedSubject) query = query.eq('subject_id', selectedSubject);
      if (selectedYear) query = query.eq('exam_year', parseInt(selectedYear));
      if (selectedExamForm) query = query.eq('exam_form', selectedExamForm);
      const { data } = await query;
      return data as Question[];
    },
    enabled: !!selectedSubject,
  });

  const bulkSave = useMutation({
    mutationFn: async (list: any[]) => {
      const formatted = list.map(q => ({
        subject_id: selectedSubject,
        question_text: q.question_text,
        option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
        correct_option: q.correct_option,
        exam_year: selectedYear ? parseInt(selectedYear) : null,
        exam_form: importExamForm,
        created_by: user?.id,
        status: 'active'
      }));
      const { error } = await supabase.from('questions').insert(formatted);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: "تم الحفظ بنجاح ✅" });
      setIsPreviewOpen(false);
    }
  });

  const saveSingleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        subject_id: selectedSubject,
        question_text: data.question_text,
        option_a: data.option_a, option_b: data.option_b, option_c: data.option_c, option_d: data.option_d,
        correct_option: data.correct_option,
        exam_year: data.exam_year ? parseInt(data.exam_year) : null,
        exam_form: data.exam_form,
        created_by: user?.id,
        status: 'active'
      };
      if (editingQuestion) {
        await supabase.from('questions').update(payload).eq('id', editingQuestion.id);
      } else {
        await supabase.from('questions').insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setIsDialogOpen(false);
      toast({ title: "تمت العملية بنجاح" });
    }
  });

  const softDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await supabase.rpc('soft_delete_questions', { p_ids: ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setSelectedIds([]);
      setIsBulkDeleteDialogOpen(false);
      setDeleteQuestion(null);
    }
  });

  const toggleSelectAll = () => selectedIds.length === questions.length ? setSelectedIds([]) : setSelectedIds(questions.map(q => q.id));
  const toggleSelectOne = (id: string) => selectedIds.includes(id) ? setSelectedIds(prev => prev.filter(x => x !== id)) : setSelectedIds(prev => [...prev, id]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 font-cairo">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة بنك الأسئلة</h1>
            <p className="text-sm text-slate-500 font-medium">العدد الكلي: {questions.length} سؤال</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)} className="gap-2">
                <Trash2 className="w-4 h-4" /> حذف المحدد ({selectedIds.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsFileUploadOpen(true)} disabled={!selectedSubject} className="gap-2 border-primary/20 bg-primary/5 text-primary font-bold">
              <ScanLine className="w-4 h-4" /> استيراد PDF ممسوح
            </Button>
            <Button size="sm" onClick={() => { setEditingQuestion(null); setFormData({question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', hint: '', exam_year: '', exam_form: 'General'}); setIsDialogOpen(true); }} disabled={!selectedSubject} className="gradient-primary text-white gap-2 shadow-lg">
              <Plus className="w-4 h-4" /> إضافة سؤال
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold font-cairo">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}><SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="المستوى" /></SelectTrigger><SelectContent className="bg-white">{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="المادة" /></SelectTrigger><SelectContent className="bg-white">{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}><SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="السنة" /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="all">كل السنوات</SelectItem>{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedExamForm || "all"} onValueChange={(v) => setSelectedExamForm(v === "all" ? "" : v)}><SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="النموذج" /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="all">كل النماذج</SelectItem>{EXAM_FORMS.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select>
          <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-white rounded-xl" /></div>
        </div>

        {/* List Content */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
          {!selectedSubject ? (
            <div className="p-24 text-center text-slate-400 flex flex-col items-center gap-4 font-cairo"><BookOpen className="w-16 h-16 opacity-10" /><p className="font-bold">يرجى اختيار مادة تعليمية</p></div>
          ) : isLoading ? (
            <div className="p-6 space-y-4"><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>
          ) : (
            <div className="divide-y divide-slate-50 font-cairo">
              {questions.map((q) => (
                <div key={q.id} className={cn("p-6 hover:bg-slate-50 transition-colors group relative flex gap-4 items-start", selectedIds.includes(q.id) && "bg-blue-50/50")}>
                  <div className="pt-1"><Checkbox checked={selectedIds.includes(q.id)} onCheckedChange={() => toggleSelectOne(q.id)} className="w-5 h-5 border-slate-300" /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-800 text-lg mb-4 leading-relaxed cursor-pointer" onClick={() => toggleSelectOne(q.id)}>{q.question_text}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingQuestion(q); setFormData({ question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c || '', option_d: q.option_d || '', correct_option: q.correct_option as any, hint: q.hint || '', exam_year: q.exam_year?.toString() || '', exam_form: (q as any).exam_form || 'General' }); setIsDialogOpen(true); }} className="h-8 w-8 p-0 bg-white border border-slate-100"><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteQuestion(q)} className="h-8 w-8 p-0 bg-white border border-slate-100"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className={cn("p-4 rounded-xl border font-bold", q.correct_option === 'A' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-100 text-slate-500")}>أ. {q.option_a}</div>
                      <div className={cn("p-4 rounded-xl border font-bold", q.correct_option === 'B' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-100 text-slate-500")}>ب. {q.option_b}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Dialogs (نفس التصميم السابق لضمان استقرار الواجهة) --- */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl bg-white h-[94vh] flex flex-col font-cairo rounded-3xl overflow-hidden p-0 border-none shadow-2xl z-[9999]">
          <div className="p-6 border-b bg-white flex justify-between items-center">
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3"><Eye className="text-primary" /> مراجعة الاستيراد الضوئي</DialogTitle>
            <div className="flex gap-4">
              <Select value={importExamForm} onValueChange={setImportExamForm}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent className="bg-white">{EXAM_FORMS.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select>
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>إلغاء</Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-10 pb-10">
              {previewQuestions.map((q) => (
                <div key={q.id} className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100 relative group">
                  <button onClick={() => setPreviewQuestions(prev => prev.filter(p => p.id !== q.id))} className="absolute -left-3 -top-3 w-10 h-10 bg-white border border-red-100 text-destructive rounded-2xl flex items-center justify-center shadow-lg hover:bg-destructive hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                  <Textarea value={q.question_text} onChange={(e) => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i].question_text = e.target.value; setPreviewQuestions(up); }} className="mb-8 rounded-2xl border-slate-200 font-bold text-lg bg-white min-h-[100px]" dir="rtl" />
                  <div className="grid grid-cols-2 gap-6">
                    {['A', 'B', 'C', 'D'].map(l => (
                      <div key={l} className="space-y-2">
                        <div className="flex justify-between items-center px-1"><Label className="text-[10px] font-black uppercase">خيار ({l})</Label><button onClick={() => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i].correct_option = l; setPreviewQuestions(up); }} className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg", q.correct_option === l ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400")}>{q.correct_option === l ? 'إجابة صحيحة' : 'تحديد كصحيحة'}</button></div>
                        <Input value={q[`option_${l.toLowerCase()}`]} onChange={(e) => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i][`option_${l.toLowerCase()}`] = e.target.value; setPreviewQuestions(up); }} className="rounded-xl border-slate-200 bg-white font-bold h-12" dir="rtl" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-8 border-t bg-white"><Button onClick={() => bulkSave.mutate(previewQuestions)} disabled={bulkSave.isPending} className="gradient-primary text-white font-black w-full h-14 rounded-xl shadow-xl text-lg">{bulkSave.isPending ? <Loader2 className="animate-spin" /> : `حفظ جميع الأسئلة المستخرجة (${previewQuestions.length})`}</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-10 shadow-2xl border-none z-[9999] font-cairo">
          <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3"><ScanLine className="text-primary" /> استيراد ذكي (PDF ممسوح)</DialogTitle>
          <div onClick={() => fileInputRef.current?.click()} className="mt-8 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 cursor-pointer group transition-all relative overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
            {isProcessingFile ? <div className="flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 text-primary animate-spin" /><p className="text-sm font-black text-slate-600">جاري التحليل الضوئي (OCR)...</p></div> : <div className="flex flex-col items-center gap-4"><FileText className="w-12 h-12 text-slate-400 group-hover:text-primary transition-colors" /><p className="font-black text-slate-700 text-lg">ارفع ملف الـ PDF الممسوح هنا</p></div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Single Delete Alert */}
      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white p-8 border-none shadow-2xl font-cairo">
          <AlertDialogTitle className="font-black text-2xl text-slate-900">حذف السؤال</AlertDialogTitle>
          <AlertDialogFooter className="gap-3 mt-8 font-bold"><AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel><AlertDialogAction onClick={() => deleteQuestion && softDeleteMutation.mutate([deleteQuestion.id])} className="bg-destructive text-white rounded-xl font-black px-10">حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Alert */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white p-8 border-none shadow-2xl font-cairo">
          <AlertDialogTitle className="font-black text-2xl text-slate-900">حذف ({selectedIds.length}) سؤال</AlertDialogTitle>
          <AlertDialogDescription>هل أنت متأكد من حذف كافة الأسئلة المحددة؟</AlertDialogDescription>
          <AlertDialogFooter className="gap-3 mt-8 font-bold"><AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel><AlertDialogAction onClick={() => softDeleteMutation.mutate(selectedIds)} className="bg-destructive text-white rounded-xl font-black px-10">حذف الجميع</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 z-[9999] font-cairo font-bold shadow-2xl border-none">
          <DialogTitle className="text-2xl font-black">{editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</DialogTitle>
          <form onSubmit={(e) => { e.preventDefault(); saveSingleMutation.mutate(formData); }} className="space-y-6 mt-4">
            <div className="space-y-2.5"><Label className="font-black text-slate-700">نص السؤال *</Label><Textarea value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} required className="rounded-2xl border-slate-200 min-h-[120px]" /></div>
            <div className="grid grid-cols-2 gap-4">{['a', 'b', 'c', 'd'].map(l => <div key={l}><Label className="text-xs mb-1 block">خيار {l.toUpperCase()}</Label><Input value={formData[`option_${l}` as keyof typeof formData] as string} onChange={(e) => setFormData({ ...formData, [`option_${l}`]: e.target.value })} className="rounded-xl h-12" /></div>)}</div>
            <div className="grid grid-cols-3 gap-4">
               <div><Label>الإجابة الصحيحة</Label><Select value={formData.correct_option} onValueChange={(v) => setFormData({...formData, correct_option: v as any})}><SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="A">أ</SelectItem><SelectItem value="B">ب</SelectItem><SelectItem value="C">ج</SelectItem><SelectItem value="D">د</SelectItem></SelectContent></Select></div>
               <div><Label>السنة</Label><Select value={formData.exam_year} onValueChange={(v) => setFormData({...formData, exam_year: v})}><SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200"><SelectValue placeholder="السنة" /></SelectTrigger><SelectContent className="bg-white max-h-[200px] overflow-y-auto">{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select></div>
               <div><Label>النموذج</Label><Select value={formData.exam_form} onValueChange={(v) => setFormData({...formData, exam_form: v})}><SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger><SelectContent className="bg-white">{EXAM_FORMS.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <Button type="submit" disabled={saveSingleMutation.isPending} className="gradient-primary text-white w-full h-12 rounded-xl text-lg font-black shadow-lg">{saveSingleMutation.isPending ? 'جاري الحفظ...' : 'حفظ البيانات'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminQuestions;
