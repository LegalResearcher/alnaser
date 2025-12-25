/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 * Version: 13.0 (Final Stable - Anti-Overlap & Bulk Save Fixed)
 */

import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Plus, Search, Edit2, Trash2, BookOpen, FileUp, Loader2, FileText, 
  Eye, Save, X, ScanLine, CheckCircle2, AlertCircle 
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ExcelImportDialog } from '@/components/admin/ExcelImportDialog';
import { HtmlImportDialog } from '@/components/admin/HtmlImportDialog';

// استيراد المكتبات (تأكد من تثبيتها)
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// تهيئة Worker الـ PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- المحرك الذكي (معالجة النصوص ومنع التداخل) ---
const parseSanaaLegalContent = (text: string) => {
  const cleanText = text.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/_/g, '');
  const lines = cleanText.split('\n');
  const results: any[] = [];
  let current: any = null;

  lines.forEach(line => {
    const t = line.trim();
    if (!t || t.length < 3) return;

    // التعرف على السؤال
    const isQuestion = t.endsWith(':') || t.includes('؟');
    
    if (isQuestion) {
      if (current && current.option_a) results.push(current);
      current = {
        id: Math.random().toString(36).substr(2, 9),
        question_text: t.replace(/^\(?\d+\)?\s*/, '').trim(),
        option_a: '', option_b: '', option_c: '', option_d: '',
        correct_option: 'A',
        count: 0
      };
    } 
    // التعرف على الخيارات
    else if (t.match(/^\(?\d+\)?\s*[-+]/) || t.match(/^\d+\s*\)/) || t.startsWith('+')) {
      if (!current) return;
      const isCorrect = t.includes('+');
      let cleanVal = t.replace(/^\(?\d+\)?\s*[-+]\s*/, '').replace(/^\d+\s*\)\s*/, '').replace('+', '').trim();
      
      if (cleanVal) {
        current.count++;
        const letter = ['A', 'B', 'C', 'D'][current.count - 1];
        if (letter) {
          current[`option_${letter.toLowerCase()}`] = cleanVal;
          if (isCorrect) current.correct_option = letter;
        }
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
  
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isHtmlImportDialogOpen, setIsHtmlImportDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A', hint: '', exam_year: '',
  });

  // --- دالة الحفظ (تم إصلاحها لتقبل الإدخال لقاعدة البيانات) ---
  const bulkSaveMutation = useMutation({
    mutationFn: async (list: any[]) => {
      if (!selectedSubject) throw new Error("يرجى اختيار المادة أولاً");
      if (!user?.id) throw new Error("يرجى تسجيل الدخول");

      // إعداد البيانات بنفس هيكلية الجدول في Supabase
      const dataToInsert = list.map(q => ({
        subject_id: selectedSubject,
        question_text: q.question_text,
        option_a: q.option_a || "خيار أ",
        option_b: q.option_b || "خيار ب",
        option_c: q.option_c || null,
        option_d: q.option_d || null,
        correct_option: q.correct_option || 'A',
        hint: null,
        exam_year: selectedYear ? parseInt(selectedYear) : null,
        created_by: user.id, // ضروري جداً لتخطي حماية RLS
        status: 'active'
      }));

      const { data, error } = await supabase
        .from('questions')
        .insert(dataToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: 'تم الحفظ بنجاح! ✅', description: `تم حفظ ${previewQuestions.length} سؤال.` });
      setIsPreviewOpen(false);
      setPreviewQuestions([]);
    },
    onError: (err: any) => {
      toast({ title: 'فشل الحفظ', description: err.message, variant: 'destructive' });
    }
  });

  // --- معالجة الـ PDF (الترتيب المكاني) ---
  const processPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      if (textContent.items.length > 0) {
        const items: any[] = textContent.items;
        // الفرز: Y (الأسطر) ثم X (الأعمدة)
        items.sort((a, b) => (b.transform[5] - a.transform[5]) || (a.transform[4] - b.transform[4]));

        let lastY = -1;
        items.forEach(it => {
          if (lastY !== -1 && Math.abs(it.transform[5] - lastY) > 5) fullText += '\n';
          fullText += it.str + ' ';
          lastY = it.transform[5];
        });
        fullText += '\n';
      } else {
        // OCR للصور
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
      return data as Question[];
    },
    enabled: !!selectedSubject,
  });

  return (
    <AdminLayout>
      <div className="space-y-6 font-cairo">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900">إدارة بنك الأسئلة</h1>
            <p className="text-sm text-slate-500">نظام الاستيراد الذكي (PDF & OCR)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFileUploadOpen(true)} disabled={!selectedSubject} className="gap-2 border-primary/20 bg-primary/5 text-primary font-bold">
              <ScanLine className="w-4 h-4" /> استيراد PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsHtmlImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200">
              <FileCode className="w-4 h-4 text-orange-500" /> HTML
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)} disabled={!selectedSubject} className="gap-2 border-slate-200">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)} disabled={!selectedSubject} className="gradient-primary text-white gap-2 shadow-lg">
              <Plus className="w-4 h-4" /> إضافة يدوية
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative z-20 font-bold">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}><SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="المستوى" /></SelectTrigger><SelectContent className="z-[9999] bg-white">{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="المادة" /></SelectTrigger><SelectContent className="z-[9999] bg-white">{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}><SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="السنة" /></SelectTrigger><SelectContent className="z-[9999] bg-white shadow-2xl"><SelectItem value="all">الكل</SelectItem>{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
          <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-white border-slate-200 rounded-xl" /></div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden z-10 min-h-[400px]">
          {isLoading ? (
            <div className="p-6 space-y-4"><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {questions.map((q, i) => (
                <div key={q.id} className="p-6 hover:bg-slate-50 transition-colors group">
                  <p className="font-bold text-slate-800 text-lg mb-4">{q.question_text}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className={cn("p-4 rounded-xl border font-bold", q.correct_option === 'A' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-100 text-slate-500")}>أ. {q.option_a}</div>
                    <div className={cn("p-4 rounded-xl border font-bold", q.correct_option === 'B' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-100 text-slate-500")}>ب. {q.option_b}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl bg-white rounded-3xl p-8 border-none shadow-2xl h-[94vh] flex flex-col overflow-hidden z-[9999]">
          <DialogHeader className="border-b pb-6 flex flex-row items-center justify-between">
            <div><DialogTitle className="text-2xl font-black text-slate-900"><Eye className="inline w-6 h-6 mr-2 text-primary" />مراجعة واعتماد الأسئلة</DialogTitle><p className="text-xs text-slate-500 font-bold mt-1">العدد: {previewQuestions.length} سؤال</p></div>
            <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-bold">إلغاء</Button>
               <Button onClick={() => bulkSaveMutation.mutate(previewQuestions)} disabled={bulkSaveMutation.isPending} className="gradient-primary text-white font-black px-12 rounded-xl shadow-xl">{bulkSaveMutation.isPending ? <Loader2 className="animate-spin" /> : "حفظ الكل"}</Button>
            </div>
          </DialogHeader>
          <div className="mt-4"><Input placeholder="بحث وتعديل..." value={previewSearch} onChange={(e) => setPreviewSearch(e.target.value)} className="h-12 bg-slate-50 rounded-2xl font-bold" /></div>
          <ScrollArea className="flex-1 mt-6 pr-4">
            <div className="space-y-10 pb-12">
              {previewQuestions.filter(x => x.question_text.includes(previewSearch)).map((q) => (
                <div key={q.id} className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100 relative group/item">
                  <button onClick={() => setPreviewQuestions(prev => prev.filter(p => p.id !== q.id))} className="absolute -left-3 -top-3 w-10 h-10 bg-white border border-red-100 text-destructive rounded-2xl flex items-center justify-center shadow-lg hover:bg-destructive hover:text-white transition-all opacity-0 group-hover/item:opacity-100"><Trash2 className="w-5 h-5" /></button>
                  <Textarea value={q.question_text} onChange={(e) => {
                    const up = [...previewQuestions];
                    const i = up.findIndex(x => x.id === q.id);
                    up[i].question_text = e.target.value;
                    setPreviewQuestions(up);
                  }} className="mb-8 rounded-2xl border-slate-200 font-bold text-lg bg-white min-h-[100px] shadow-sm" dir="rtl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['A', 'B', 'C', 'D'].map(l => (
                      <div key={l} className="space-y-2">
                        <div className="flex justify-between px-1"><Label className="text-[10px] font-black text-slate-500">خيار ({l})</Label><button onClick={() => {
                            const up = [...previewQuestions];
                            const i = up.findIndex(x => x.id === q.id);
                            up[i].correct_option = l;
                            setPreviewQuestions(up);
                        }} className={cn("text-[9px] font-black px-2 py-1 rounded", q.correct_option === l ? "bg-emerald-500 text-white" : "bg-slate-200")}>{q.correct_option === l ? 'صحيح' : 'تحديد'}</button></div>
                        <Input value={q[`option_${l.toLowerCase()}`]} onChange={(e) => {
                           const up = [...previewQuestions];
                           const i = up.findIndex(x => x.id === q.id);
                           up[i][`option_${l.toLowerCase()}`] = e.target.value;
                           setPreviewQuestions(up);
                        }} className="rounded-xl border-slate-200 bg-white font-bold h-12" dir="rtl" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-10 shadow-2xl border-none z-[9999]">
          <DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3"><ScanLine className="text-primary" /> رفع ملف</DialogTitle></DialogHeader>
          <div onClick={() => fileInputRef.current?.click()} className="mt-8 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:bg-slate-50 cursor-pointer">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.html" />
            {isProcessingFile ? <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" /> : <div className="text-center"><FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="font-bold text-slate-600">اضغط لاختيار ملف</p></div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 z-[9999] font-bold">
          <DialogHeader><DialogTitle className="text-2xl font-black">إضافة سؤال</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); bulkSaveMutation.mutate([formData]); setIsDialogOpen(false); }} className="space-y-6 mt-4">
            <Textarea value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} required className="rounded-2xl min-h-[120px]" placeholder="نص السؤال" />
            <div className="grid grid-cols-2 gap-4">{['a', 'b', 'c', 'd'].map(l => <Input key={l} placeholder={`خيار ${l}`} value={formData[`option_${l}` as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [`option_${l}`]: e.target.value })} className="rounded-xl" />)}</div>
            <Button type="submit" disabled={bulkSaveMutation.isPending} className="gradient-primary text-white w-full rounded-xl h-12">حفظ</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialogs */}
      <ExcelImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} subjectId={selectedSubject} />
      <HtmlImportDialog open={isHtmlImportDialogOpen} onOpenChange={setIsHtmlImportDialogOpen} subjectId={selectedSubject} />
      
      {/* Delete Dialog */}
      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white p-8"><AlertDialogHeader><AlertDialogTitle className="font-black">تأكيد الحذف</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter className="gap-3"><AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel><AlertDialogAction onClick={() => deleteQuestion && supabase.from('questions').update({ status: 'deleted' }).eq('id', deleteQuestion.id).then(() => queryClient.invalidateQueries())} className="bg-destructive text-white rounded-xl font-bold px-8">حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminQuestions;
