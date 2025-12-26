/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 * Version: 23.0 (Universal Parser: Multi-Pattern Support + Full CRUD)
 */

import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Plus, Search, Edit2, Trash2, BookOpen, CheckCircle2, FileUp, 
  Loader2, FileText, AlertCircle, Eye, Save, X, PencilLine, ScanLine,
  FileCode, FileSpreadsheet, Calendar, Filter
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
import { ExcelImportDialog } from '@/components/admin/ExcelImportDialog';
import { HtmlImportDialog } from '@/components/admin/HtmlImportDialog';

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// رابط الـ Worker (ثابت لمنع الانهيار)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

// --- المحرك الذكي المطور (يدعم الأنماط المختلطة والجديدة) ---
const parseSanaaLegalContent = (text: string) => {
  const cleanText = text.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/_/g, '');
  const lines = cleanText.split('\n');
  const results: any[] = [];
  let current: any = null;

  // دالة مساعدة لتحديد هل السطر خيار أم لا
  const isOptionLine = (t: string) => {
    // الأنماط المدعومة للخيارات:
    // 1. تحتوي على + أو - مع رقم أو قوس: (1) - ، 1) + ، + ، -
    // 2. تحتوي على كلمة "العبارة" (للصح والخطأ)
    // 3. تبدأ بترقيم خيارات تقليدي: 1) ، أ. ، (1)
    return (
      t.match(/^[\(\s\d\)\.\-\+]+/) || // يبدأ بـ 1) - أو + أو (1
      t.startsWith('+') || 
      t.startsWith('-') ||
      t.includes('العبارة صحيحة') || 
      t.includes('العبارة خاطئة')
    ) && (t.length < 100); // الخيارات عادة أقصر من الأسئلة السردية الطويلة
  };

  lines.forEach(line => {
    const t = line.trim();
    if (!t || t.length < 2) return;

    if (isOptionLine(t)) {
      // --- معالجة الخيار ---
      if (!current) return; // تجاهل خيار بدون سؤال سابق

      // تحديد الإجابة الصحيحة (وجود علامة +)
      const isCorrect = t.includes('+');
      
      // تنظيف نص الخيار: حذف الأرقام والرموز (+ - 1 ) . ) من البداية
      let cleanVal = t
        .replace(/^[\(\s\d\)\.\-\+]+/, '') // حذف البادئة مثل "1) - "
        .replace(/[\+\-]$/, '') // حذف + أو - في النهاية إذا وجدت
        .replace(/^\s*العبارة\s+/, 'العبارة ') // توحيد المسافات
        .trim();
      
      // حالات خاصة للصح والخطأ لضمان نظافة النص
      if (t.includes('العبارة صحيحة')) cleanVal = 'العبارة صحيحة';
      if (t.includes('العبارة خاطئة')) cleanVal = 'العبارة خاطئة';

      if (cleanVal) {
        current.count++;
        // تعيين الحروف A, B, C, D بناءً على الترتيب
        const letters = ['A', 'B', 'C', 'D'];
        const letter = letters[current.count - 1];
        
        if (letter) {
          current[`option_${letter.toLowerCase()}`] = cleanVal;
          if (isCorrect) current.correct_option = letter;
        }
      }
    } 
    else {
      // --- معالجة السؤال ---
      
      // إذا كان لدينا سؤال سابق واكتملت خياراته (وجدنا نصاً جديداً ليس خياراً)
      if (current && current.count > 0) {
        results.push(current);
        current = null;
      }

      if (!current) {
        // بداية سؤال جديد
        current = {
          id: Math.random().toString(36).substr(2, 9),
          // تنظيف السؤال من الأرقام في البداية والنهاية (مثل: "1- عرف..." أو "...(1")
          question_text: t.replace(/^[\(\d\)\.\-\s]+/, '').replace(/[\(\d\)\s]+$/, '').trim(),
          option_a: '', option_b: '', option_c: '', option_d: '',
          correct_option: 'A', // افتراضي
          count: 0
        };
      } else {
        // تكملة لنص السؤال الحالي (للاسئلة متعددة الأسطر)
        const moreText = t.replace(/[\(\d\)\s]+$/, '').trim();
        if (moreText) {
            current.question_text += ' ' + moreText;
        }
      }
    }
  });

  // إضافة آخر سؤال
  if (current && current.count > 0) results.push(current);
  return results;
};

const AdminQuestions = () => {
  // === جلب الصلاحية role لاستخدامها في الحذف (من الكود القديم) ===
  const { user, role } = useAuth();
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isHtmlImportDialogOpen, setIsHtmlImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A' as any, hint: '', exam_year: '',
  });

  // --- معالجة PDF ---
  const processPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      if (textContent.items.length > 0) {
        const items: any[] = textContent.items;
        // ترتيب مكاني دقيق للغة العربية (من اليمين لليسار ومن الأعلى للأسفل)
        items.sort((a, b) => (b.transform[5] - a.transform[5]) || (a.transform[4] - b.transform[4]));
        let lastY = -1;
        items.forEach(it => {
          if (lastY !== -1 && Math.abs(it.transform[5] - lastY) > 5) fullText += '\n';
          fullText += it.str + ' ';
          lastY = it.transform[5];
        });
        fullText += '\n';
      } else {
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport }).promise;
        const { data: { text } } = await Tesseract.recognize(canvas, 'ara');
        fullText += text + '\n';
      }
    }
    return fullText;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    try {
      const content = file.type === "application/pdf" ? await processPDF(file) : await file.text();
      const extracted = parseSanaaLegalContent(content);
      if (extracted.length > 0) {
        setPreviewQuestions(extracted);
        setIsFileUploadOpen(false);
        setIsPreviewOpen(true);
      } else {
        toast({ title: 'تنبيه', description: 'لم يتم العثور على أسئلة.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'خطأ', description: 'حدثت مشكلة أثناء المعالجة.', variant: 'destructive' });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Queries
  const { data: levels = [] } = useQuery({ queryKey: ['levels'], queryFn: async () => (await supabase.from('levels').select('*').order('order_index')).data as Level[] });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects', selectedLevel], queryFn: async () => { let q = supabase.from('subjects').select('*').order('order_index'); if(selectedLevel) q = q.eq('level_id', selectedLevel); return (await q).data as Subject[]; } });
  
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', selectedSubject, selectedYear, searchQuery],
    queryFn: async () => {
      let query = supabase.from('questions').select('*').eq('status', 'active').order('created_at', { ascending: false });
      if (selectedSubject) query = query.eq('subject_id', selectedSubject);
      if (selectedYear) query = query.eq('exam_year', parseInt(selectedYear));
      const { data } = await query;
      return data as Question[];
    },
    enabled: !!selectedSubject,
  });

  // --- حفظ جماعي (مع إصلاح الـ NULL) ---
  const bulkSave = useMutation({
    mutationFn: async (list: any[]) => {
      if (!selectedSubject) throw new Error("يرجى اختيار المادة أولاً");
      if (!user?.id) throw new Error("يرجى تسجيل الدخول");

      const formatted = list.map(q => ({
        subject_id: selectedSubject,
        question_text: q.question_text || "سؤال",
        option_a: q.option_a || "", option_b: q.option_b || "",
        option_c: q.option_c || "", option_d: q.option_d || "", 
        correct_option: q.correct_option || 'A',
        exam_year: selectedYear ? parseInt(selectedYear) : null,
        created_by: user.id, status: 'active', hint: null
      }));

      const { data, error } = await supabase.from('questions').insert(formatted).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: '✅ تم الحفظ بنجاح', description: `تمت إضافة ${previewQuestions.length} سؤال.` });
      setIsPreviewOpen(false); setPreviewQuestions([]);
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
  });

  // --- حفظ فردي (إضافة/تعديل) ---
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { subject_id?: string; id?: string }) => {
      if (!selectedSubject) throw new Error("اختر المادة");
      const payload = {
        subject_id: selectedSubject,
        question_text: data.question_text,
        option_a: data.option_a || "", option_b: data.option_b || "",
        option_c: data.option_c || "", option_d: data.option_d || "", 
        correct_option: data.correct_option,
        hint: data.hint || null,
        exam_year: data.exam_year ? parseInt(data.exam_year) : null,
        created_by: user?.id, status: 'active'
      };

      if (editingQuestion) {
        const { error } = await supabase.from('questions').update(payload).eq('id', editingQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: editingQuestion ? 'تم التحديث' : 'تمت الإضافة' });
      setIsDialogOpen(false); setEditingQuestion(null);
      setFormData({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', hint: '', exam_year: '' });
    },
    onError: (err: any) => toast({ title: 'حدث خطأ', description: err.message, variant: 'destructive' }),
  });

  // --- منطق الحذف (مأخوذ من الكود القديم) ---
  const deleteMutation = useMutation({
    mutationFn: async (question: Question) => {
      if (role === 'admin') {
        const { error } = await supabase.from('questions').delete().eq('id', question.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('deletion_requests').insert({ question_id: question.id, requested_by: user?.id });
        if (error) throw error;
        await supabase.from('questions').update({ status: 'pending_deletion' }).eq('id', question.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: role === 'admin' ? 'تم حذف السؤال نهائياً' : 'تم إرسال طلب الحذف للمسؤول' });
      setDeleteQuestion(null);
    },
    onError: (err: any) => toast({ title: 'فشل الحذف', description: err.message, variant: 'destructive' })
  });

  // --- منطق الحذف المتعدد ---
  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.length === 0) return;
      if (role === 'admin') {
        const { error } = await supabase.from('questions').delete().in('id', selectedIds);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').update({ status: 'pending_deletion' }).in('id', selectedIds);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: `تم حذف ${selectedIds.length} سؤال` });
      setSelectedIds([]); setIsBulkDeleteDialogOpen(false);
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
  });

  const toggleSelectAll = () => selectedIds.length === questions.length ? setSelectedIds([]) : setSelectedIds(questions.map(q => q.id));
  const toggleSelectOne = (id: string) => selectedIds.includes(id) ? setSelectedIds(prev => prev.filter(x => x !== id)) : setSelectedIds(prev => [...prev, id]);
  
  const handleEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormData({
      question_text: q.question_text, option_a: q.option_a, option_b: q.option_b,
      option_c: q.option_c || '', option_d: q.option_d || '',
      correct_option: q.correct_option as any, hint: q.hint || '',
      exam_year: q.exam_year?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 font-cairo">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الأسئلة</h1>
            <p className="text-sm text-slate-500 font-medium">العدد: {questions.length}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)} className="gap-2 animate-in fade-in zoom-in">
                <Trash2 className="w-4 h-4" /> حذف المحدد ({selectedIds.length})
              </Button>
            )}
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <Button variant="outline" size="sm" onClick={() => setIsHtmlImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200"><FileCode className="w-4 h-4 text-orange-500" /> HTML</Button>
            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel</Button>
            <Button variant="outline" size="sm" onClick={() => setIsFileUploadOpen(true)} disabled={!selectedSubject} className="gap-2 border-primary/20 bg-primary/5 text-primary font-bold shadow-sm"><ScanLine className="w-4 h-4" /> PDF ذكي</Button>
            <Button size="sm" onClick={() => { setEditingQuestion(null); setFormData({question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', hint: '', exam_year: ''}); setIsDialogOpen(true); }} disabled={!selectedSubject} className="gradient-primary text-white gap-2 shadow-lg"><Plus className="w-4 h-4" /> إضافة</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative z-20 font-bold font-cairo">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}><SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="المستوى" /></SelectTrigger><SelectContent className="z-[9999] bg-white">{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="المادة" /></SelectTrigger><SelectContent className="z-[9999] bg-white">{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}><SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="السنة" /></SelectTrigger><SelectContent className="z-[9999] bg-white shadow-2xl"><SelectItem value="all">الكل</SelectItem>{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
          <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-white border-slate-200 rounded-xl" /></div>
        </div>

        {/* Select All Checkbox */}
        {questions.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-100 font-cairo font-bold text-sm text-slate-600">
            <Checkbox checked={selectedIds.length === questions.length && questions.length > 0} onCheckedChange={toggleSelectAll} className="w-5 h-5 border-slate-300 data-[state=checked]:bg-primary" />
            <span>تحديد الكل ({questions.length})</span>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden z-10 min-h-[400px]">
          {!selectedSubject ? (
            <div className="p-24 text-center text-slate-400 flex flex-col items-center gap-4 font-cairo"><BookOpen className="w-16 h-16 opacity-10" /><p className="font-bold">يرجى اختيار مادة تعليمية</p></div>
          ) : isLoading ? (
            <div className="p-6 space-y-4"><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>
          ) : (
            <div className="divide-y divide-slate-50 font-cairo">
              {questions.map((q, i) => (
                <div key={q.id} className={cn("p-6 hover:bg-slate-50 transition-colors group relative flex gap-4 items-start", selectedIds.includes(q.id) && "bg-blue-50/50")}>
                  <div className="pt-1"><Checkbox checked={selectedIds.includes(q.id)} onCheckedChange={() => toggleSelectOne(q.id)} className="w-5 h-5 border-slate-300 data-[state=checked]:bg-primary" /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-800 text-lg mb-4 leading-relaxed cursor-pointer" onClick={() => toggleSelectOne(q.id)}>{q.question_text}</p>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(q)} className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg"><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteQuestion(q)} className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-700 bg-red-50 text-red-600 border border-red-200 rounded-lg"><Trash2 className="w-4 h-4" /></Button>
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

      {/* Import Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl bg-white rounded-3xl p-8 border-none shadow-2xl h-[94vh] flex flex-col overflow-hidden z-[9999] font-cairo">
          <DialogHeader className="border-b pb-6 flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900"><Eye className="text-primary w-8 h-8" /> مراجعة الاستيراد</DialogTitle>
            <div className="flex gap-3"><Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-bold px-8">إلغاء</Button><Button onClick={() => bulkSave.mutate(previewQuestions)} disabled={bulkSave.isPending} className="gradient-primary text-white font-black px-12 rounded-xl shadow-xl">{bulkSave.isPending ? <Loader2 className="animate-spin" /> : "حفظ الكل"}</Button></div>
          </DialogHeader>
          <div className="mt-4"><Input placeholder="بحث..." value={previewSearch} onChange={(e) => setPreviewSearch(e.target.value)} className="h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold" /></div>
          <ScrollArea className="flex-1 mt-6 pr-4">
            <div className="space-y-10 pb-12">
              {previewQuestions.filter(x => x.question_text.includes(previewSearch)).map((q) => (
                <div key={q.id} className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100 relative group/item">
                  <button onClick={() => setPreviewQuestions(prev => prev.filter(p => p.id !== q.id))} className="absolute -left-3 -top-3 w-10 h-10 bg-white border border-red-100 text-destructive rounded-2xl flex items-center justify-center shadow-lg hover:bg-destructive hover:text-white transition-all opacity-0 group-hover/item:opacity-100 z-30"><Trash2 className="w-5 h-5" /></button>
                  <Textarea value={q.question_text} onChange={(e) => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i].question_text = e.target.value; setPreviewQuestions(up); }} className="mb-8 rounded-2xl border-slate-200 font-bold text-lg bg-white min-h-[100px] font-cairo shadow-sm" dir="rtl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{['A', 'B', 'C', 'D'].map(l => (<div key={l} className="space-y-2 font-cairo"><div className="flex justify-between items-center px-1"><Label className="text-[10px] font-black uppercase">خيار ({l})</Label><button onClick={() => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i].correct_option = l; setPreviewQuestions(up); }} className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg transition-all", q.correct_option === l ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400")}>{q.correct_option === l ? 'إجابة صحيحة' : 'تحديد'}</button></div><Input value={q[`option_${l.toLowerCase()}`]} onChange={(e) => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i][`option_${l.toLowerCase()}`] = e.target.value; setPreviewQuestions(up); }} className="rounded-xl border-slate-200 bg-white font-bold h-12" dir="rtl" /></div>))}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-10 shadow-2xl border-none z-[9999] font-cairo">
          <DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900"><ScanLine className="text-primary" /> رفع ملف الاختبار</DialogTitle></DialogHeader>
          <div onClick={() => fileInputRef.current?.click()} className="mt-8 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 cursor-pointer group transition-all relative overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.html" />
            {isProcessingFile ? <div className="flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 text-primary animate-spin" /><p className="text-sm font-black text-slate-600">جاري المعالجة...</p></div> : <div className="flex flex-col items-center gap-4"><div className="p-5 bg-slate-100 rounded-2xl transition-all shadow-sm group-hover:bg-white"><FileText className="w-10 h-10 text-slate-400 group-hover:text-primary" /></div><p className="font-black text-slate-700 text-lg font-cairo">اضغط لاختيار ملف PDF</p></div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white p-8 border-none shadow-2xl font-cairo">
          <AlertDialogHeader><AlertDialogTitle className="font-black text-2xl text-slate-900">
            {role === 'admin' ? 'حذف السؤال نهائياً' : 'طلب حذف السؤال'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {role === 'admin' ? 'هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.' : 'سيتم إرسال طلب للمسؤول لحذف هذا السؤال.'}
          </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-8 font-bold"><AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel><AlertDialogAction onClick={() => deleteQuestion && deleteMutation.mutate(deleteQuestion)} className="bg-destructive text-white rounded-xl font-black px-10">{role === 'admin' ? 'حذف' : 'إرسال الطلب'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white p-8 border-none shadow-2xl font-cairo">
          <AlertDialogHeader><AlertDialogTitle className="font-black text-2xl text-slate-900">حذف ({selectedIds.length}) سؤال</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>
             {role === 'admin' ? 'سيتم الحذف نهائياً. هل أنت متأكد؟' : 'سيتم إرسال طلبات حذف للمسؤول.'}
          </AlertDialogDescription>
          <AlertDialogFooter className="gap-3 mt-8 font-bold"><AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel><AlertDialogAction onClick={() => bulkDeleteMutation.mutate()} disabled={bulkDeleteMutation.isPending} className="bg-destructive text-white rounded-xl font-black px-10">تأكيد</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 z-[9999] font-cairo font-bold">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-6 mt-4">
            <div className="space-y-2.5"><Label className="font-black text-slate-700">نص السؤال *</Label><Textarea value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} required className="rounded-2xl border-slate-200 min-h-[120px]" /></div>
            <div className="grid grid-cols-2 gap-4">{['a', 'b', 'c', 'd'].map(l => <div key={l}><Label className="text-xs mb-1 block">خيار {l.toUpperCase()}</Label><Input placeholder={`نص الخيار...`} value={formData[`option_${l}` as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [`option_${l}`]: e.target.value })} className="rounded-xl h-12" /></div>)}</div>
            <div className="grid grid-cols-2 gap-4">
               <div><Label>الإجابة الصحيحة</Label><Select value={formData.correct_option} onValueChange={(v) => setFormData({...formData, correct_option: v as any})}><SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">أ (A)</SelectItem><SelectItem value="B">ب (B)</SelectItem><SelectItem value="C">ج (C)</SelectItem><SelectItem value="D">د (D)</SelectItem></SelectContent></Select></div>
               <div><Label>السنة</Label><Select value={formData.exam_year} onValueChange={(v) => setFormData({...formData, exam_year: v})}><SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="اختر السنة" /></SelectTrigger><SelectContent>{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="mt-4"><Label>ملاحظة (Hint)</Label><Input value={formData.hint} onChange={(e) => setFormData({...formData, hint: e.target.value})} className="rounded-xl h-12" placeholder="تلميح اختياري" /></div>
            <Button type="submit" disabled={saveMutation.isPending} className="gradient-primary text-white w-full h-12 rounded-xl text-lg font-black shadow-lg mt-6">{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ البيانات'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ExcelImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} subjectId={selectedSubject} />
      <HtmlImportDialog open={isHtmlImportDialogOpen} onOpenChange={setIsHtmlImportDialogOpen} subjectId={selectedSubject} />
    </AdminLayout>
  );
};

export default AdminQuestions;
