/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 * Version: 9.0 (Ultimate Build: PDF + Image OCR + Smart Parser)
 */

import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Plus, Search, Edit2, Trash2, BookOpen, FileSpreadsheet, 
  FileCode, CheckCircle2, FileUp, Loader2, FileText, AlertCircle, 
  Eye, Save, X, PencilLine, ImageIcon, ScanLine
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

// استيراد المكتبات (تأكد من تثبيتها عبر Lovable أولاً)
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- المحرك الذكي المطور (Sana'a University Pattern) ---
const parseSanaaLegalContent = (text: string) => {
  const lines = text.split('\n');
  const results: any[] = [];
  let current: any = null;

  lines.forEach(line => {
    const t = line.trim();
    if (!t || t.length < 2) return;

    // نمط السؤال: ينتهي بـ (:) أو (؟)
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
    // نمط الخيارات: (1) أو 1) أو علامة +
    else if (t.match(/^\d+[\)\-\s]/) || t.match(/^\(\d+/) || t.includes('(1')) {
      if (!current) return;
      const isCorrect = t.includes('+');
      let clean = t.replace(/^[\d\(\)\-\s]+/, '').replace('+', '').replace(/^-/, '').trim();
      
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
  
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0); // تتبع تقدم المسح الضوئي
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);

  const [formData, setFormData] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A', hint: '', exam_year: '',
  });

  // --- دالة معالجة الـ PDF (نصوص + صور) ---
  const processPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // إذا كانت الصفحة تحتوي على نصوص رقمية
      if (textContent.items.length > 0) {
        fullText += textContent.items.map((it: any) => it.str).join('\n') + '\n';
      } 
      // إذا كانت الصفحة "صورة"، نستخدم Tesseract OCR
      else {
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context!, viewport }).promise;
        const { data: { text } } = await Tesseract.recognize(canvas, 'ara', {
          logger: m => { if(m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100)); }
        });
        fullText += text + '\n';
      }
    }
    return fullText;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    setOcrProgress(0);

    try {
      const content = file.type === "application/pdf" ? await processPDF(file) : await file.text();
      const extracted = parseSanaaLegalContent(content);
      if (extracted.length > 0) {
        setPreviewQuestions(extracted);
        setIsFileUploadOpen(false);
        setIsPreviewOpen(true);
      } else {
        toast({ title: 'تنبيه', description: 'لم نتمكن من استخراج الأسئلة. تأكد من جودة الصورة ونمط الكتابة.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء المعالجة الذكية للملف.', variant: 'destructive' });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- جلب البيانات ---
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

  const bulkSave = useMutation({
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
      toast({ title: 'تم الحفظ بنجاح في قاعدة البيانات ✅' });
      setIsPreviewOpen(false);
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 font-cairo">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة بنك الأسئلة</h1>
            <p className="text-sm text-slate-500 font-medium">نظام المسح الضوئي الذكي (OCR + PDF)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFileUploadOpen(true)} disabled={!selectedSubject} className="gap-2 border-primary/20 bg-primary/5 text-primary font-bold shadow-sm">
              <ScanLine className="w-4 h-4" /> استيراد ذكي (شامل)
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)} disabled={!selectedSubject} className="gradient-primary text-white gap-2 shadow-lg">
              <Plus className="w-4 h-4" /> إضافة يدوية
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative z-20 font-bold font-cairo">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="المستوى" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white">{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="المادة" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white">{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}>
            <SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="السنة" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white"><SelectItem value="all">كافة السنوات</SelectItem>{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>نموذج {y}</SelectItem>)}</SelectContent>
          </Select>
          <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="بحث سريع..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-white border-slate-200 rounded-xl" /></div>
        </div>

        {/* Questions Display Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
          {!selectedSubject ? (
            <div className="p-24 text-center text-slate-400 flex flex-col items-center gap-4 font-cairo"><BookOpen className="w-16 h-16 opacity-10" /><p className="font-bold">يرجى اختيار مادة تعليمية لعرض المحتوى</p></div>
          ) : isLoading ? (
            <div className="p-6 space-y-4"><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {questions.map((q, i) => (
                <div key={q.id} className="p-6 hover:bg-slate-50 transition-colors group">
                  <p className="font-bold text-slate-800 text-lg mb-4 font-cairo">{q.question_text}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className={cn("p-4 rounded-xl border font-bold font-cairo", q.correct_option === 'A' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-100 text-slate-500")}>أ. {q.option_a}</div>
                    <div className={cn("p-4 rounded-xl border font-bold font-cairo", q.correct_option === 'B' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-100 text-slate-500")}>ب. {q.option_b}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- حوار المعاينة المتقدم --- */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl bg-white rounded-3xl p-8 border-none shadow-2xl h-[94vh] flex flex-col overflow-hidden z-[9999] font-cairo">
          <DialogHeader className="border-b pb-6 flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900 font-cairo"><Eye className="text-primary w-8 h-8" /> مراجعة استخراج الـ PDF</DialogTitle>
            <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-bold px-8">إلغاء</Button>
               <Button onClick={() => bulkSave.mutate(previewQuestions)} disabled={bulkSave.isPending} className="gradient-primary text-white font-black px-10 rounded-xl shadow-xl">{bulkSave.isPending ? <Loader2 className="animate-spin" /> : <Save className="mr-2 w-4 h-4" />} حفظ الكل</Button>
            </div>
          </DialogHeader>
          <div className="mt-4"><Input placeholder="بحث داخل المعاينة..." value={previewSearch} onChange={(e) => setPreviewSearch(e.target.value)} className="h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold" /></div>
          <ScrollArea className="flex-1 mt-6 pr-4">
            <div className="space-y-10 pb-12">
              {previewQuestions.filter(x => x.question_text.includes(previewSearch)).map((q) => (
                <div key={q.id} className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100 relative group/item">
                  <button onClick={() => setPreviewQuestions(prev => prev.filter(p => p.id !== q.id))} className="absolute -left-3 -top-3 w-10 h-10 bg-white border border-red-100 text-destructive rounded-2xl flex items-center justify-center shadow-lg hover:bg-destructive hover:text-white z-30 transition-all opacity-0 group-hover/item:opacity-100"><Trash2 className="w-5 h-5" /></button>
                  <Textarea value={q.question_text} onChange={(e) => {
                    const up = [...previewQuestions];
                    const i = up.findIndex(x => x.id === q.id);
                    up[i].question_text = e.target.value;
                    setPreviewQuestions(up);
                  }} className="mb-8 rounded-2xl border-slate-200 font-bold text-lg bg-white min-h-[90px] font-cairo" dir="rtl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <div key={letter} className="space-y-2">
                        <div className="flex justify-between items-center px-1"><Label className="text-[10px] font-black tracking-widest font-cairo">الخيار ({letter})</Label><button onClick={() => {
                            const up = [...previewQuestions];
                            const i = up.findIndex(x => x.id === q.id);
                            up[i].correct_option = letter;
                            setPreviewQuestions(up);
                        }} className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg", q.correct_option === letter ? "bg-emerald-500 text-white" : "bg-slate-200")}>{q.correct_option === letter ? 'إجابة صحيحة' : 'تحديد كإجابة'}</button></div>
                        <Input value={q[`option_${letter.toLowerCase()}`]} onChange={(e) => {
                           const up = [...previewQuestions];
                           const i = up.findIndex(x => x.id === q.id);
                           up[i][`option_${letter.toLowerCase()}`] = e.target.value;
                           setPreviewQuestions(up);
                        }} className="rounded-xl border-slate-200 bg-white font-bold" dir="rtl" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* --- حوار الرفع الرئيسي --- */}
      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-10 shadow-2xl border-none z-[9999] font-cairo">
          <DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900 font-cairo"><ScanLine className="text-primary" /> مستورد جامعة صنعاء الذكي</DialogTitle></DialogHeader>
          <div className="mt-8 space-y-8">
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
              <div className="text-xs text-slate-600 leading-relaxed font-medium">
                <p className="font-black text-slate-900 mb-2 underline underline-offset-4 font-cairo">تعليمات النمط الشامل:</p>
                <li>يدعم ملفات الـ **PDF الممسوحة ضوئياً (صور)** عبر خاصية OCR.</li>
                <li>يدعم ملفات الـ **Text** والـ **HTML** والـ **PDF** الرقمي.</li>
                <li>الإجابة الصحيحة هي المسبوقة بـ (**+**).</li>
              </div>
            </div>

            <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 cursor-pointer group transition-all relative overflow-hidden">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.html" />
              {isProcessingFile ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-sm font-black text-slate-600">جاري مسح محتوى الملف ضوئياً... ({ocrProgress}%)</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4"><div className="p-5 bg-slate-100 rounded-2xl transition-all shadow-sm group-hover:bg-white"><FileText className="w-10 h-10 text-slate-400 group-hover:text-primary" /></div><p className="font-black text-slate-700 text-lg font-cairo">اضغط لاختيار الملف الآن</p></div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminQuestions;
