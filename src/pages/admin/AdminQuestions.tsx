/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Version: 4.5 (Ultimate Smart PDF Import & Preview System)
 * Developed by: Mueen Al-Nasser
 */

import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/Layout';
import { 
  Plus, Search, Edit2, Trash2, BookOpen, FileSpreadsheet, 
  FileCode, CheckCircle2, FileUp, Loader2, FileText, AlertCircle, 
  Eye, Save, X, PencilLine, FileWarning 
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

// استيراد مكتبة PDF.js
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- محرك الاستخراج الذكي (Sana'a University Pattern) ---
const parseSanaaLegalContent = (text: string) => {
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
    // اكتشاف الخيارات: تبدأ بـ (1) أو 1)
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
  
  // حالات الاستيراد والمعاينة
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

  // --- دوال استخراج النصوص من PDF ---
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join('\n') + '\n';
    }
    return fullText;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      let content = "";
      if (file.type === "application/pdf") {
        content = await extractTextFromPDF(file);
      } else {
        const reader = new FileReader();
        content = await new Promise((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsText(file);
        });
      }

      const extracted = parseSanaaLegalContent(content);
      if (extracted.length > 0) {
        setPreviewQuestions(extracted);
        setIsFileUploadOpen(false);
        setIsPreviewOpen(true);
      } else {
        toast({ title: 'تنبيه', description: 'لم نتمكن من العثور على أسئلة نصية. إذا كان الملف صوراً ممسوحة ضوئياً، يرجى تحويله لنص أولاً.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء معالجة ملف الـ PDF.', variant: 'destructive' });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updatePreviewQuestion = (id: string, field: string, value: string) => {
    setPreviewQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const removePreviewQuestion = (id: string) => {
    setPreviewQuestions(prev => prev.filter(q => q.id !== id));
  };

  const filteredPreview = previewQuestions.filter(q => q.question_text.includes(previewSearch));

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
            <p className="text-sm text-slate-500 font-medium tracking-wide">الناصر تِك: استيراد ذكي من الـ PDF والنصوص</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" size="sm" 
              onClick={() => setIsFileUploadOpen(true)} 
              disabled={!selectedSubject}
              className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold shadow-sm"
            >
              <FileUp className="w-4 h-4" /> استيراد PDF / نص
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)} disabled={!selectedSubject} className="gradient-primary text-white gap-2 shadow-lg">
              <Plus className="w-4 h-4" /> إضافة يدوية
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative z-20">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold font-cairo"><SelectValue placeholder="المستوى" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white border-slate-200 shadow-xl">{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold font-cairo"><SelectValue placeholder="المادة" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white border-slate-200 shadow-xl">{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}>
            <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold font-cairo"><SelectValue placeholder="السنة" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-white border-slate-200 shadow-xl max-h-[250px] overflow-y-auto">
              <SelectItem value="all">كافة السنوات</SelectItem>{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>نموذج {y}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="بحث سريع..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-white border-slate-200 rounded-xl" /></div>
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
                      <div className="flex items-center gap-3 mb-3"><span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-lg"># {i + 1}</span>{q.exam_year && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">نموذج {q.exam_year}</span>}</div>
                      <p className="font-bold text-slate-800 text-lg mb-4 leading-relaxed font-cairo">{q.question_text}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className={cn("p-4 rounded-xl border transition-all text-sm", q.correct_option === 'A' ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" : "bg-white border-slate-100 text-slate-500")}>أ. {q.option_a}</div>
                        <div className={cn("p-4 rounded-xl border transition-all text-sm", q.correct_option === 'B' ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" : "bg-white border-slate-100 text-slate-500")}>ب. {q.option_b}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Advanced Preview & Editing Dialog --- */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl bg-white rounded-3xl p-8 border-none shadow-2xl h-[94vh] flex flex-col overflow-hidden z-[9999]">
          <DialogHeader className="border-b pb-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900 font-cairo"><Eye className="text-primary w-8 h-8" /> مراجعة وتصفية الأسئلة المستخرجة</DialogTitle>
              <p className="text-xs text-slate-400 font-bold tracking-tight">لديك ({previewQuestions.length}) سؤالاً. يمكنك التعديل أو الحذف قبل الحفظ.</p>
            </div>
            <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-bold px-8">إلغاء</Button>
               <Button onClick={() => bulkSaveMutation.mutate(previewQuestions)} disabled={bulkSaveMutation.isPending} className="gradient-primary text-white font-black px-12 rounded-xl shadow-xl">
                 {bulkSaveMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
                 تأكيد وحفظ الكل
               </Button>
            </div>
          </DialogHeader>
          
          <div className="mt-4"><Input placeholder="بحث داخل المعاينة لفلترة الأسئلة..." value={previewSearch} onChange={(e) => setPreviewSearch(e.target.value)} className="h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold font-cairo" /></div>

          <ScrollArea className="flex-1 mt-6 pr-4">
            <div className="space-y-10 pb-12">
              {filteredPreview.map((q, idx) => (
                <div key={q.id} className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100 relative group/item">
                  <button onClick={() => removePreviewQuestion(q.id)} className="absolute -left-3 -top-3 w-10 h-10 bg-white border border-red-100 text-destructive rounded-2xl flex items-center justify-center shadow-lg hover:bg-destructive hover:text-white transition-all opacity-0 group-hover/item:opacity-100 z-30"><Trash2 className="w-5 h-5" /></button>
                  <div className="flex items-center gap-3 mb-6"><span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">#{idx + 1}</span><Label className="font-black text-slate-400 text-[10px] uppercase">تعديل نص السؤال</Label></div>
                  <Textarea value={q.question_text} onChange={(e) => updatePreviewQuestion(q.id, 'question_text', e.target.value)} className="mb-8 rounded-2xl border-slate-200 font-bold text-lg bg-white min-h-[90px] font-cairo" dir="rtl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['A', 'B', 'C', 'D'].map((letter) => {
                      const field = `option_${letter.toLowerCase()}`;
                      const isCorrect = q.correct_option === letter;
                      if (!q[field] && letter !== 'A' && letter !== 'B') return null;
                      return (
                        <div key={letter} className="space-y-2 font-cairo">
                          <div className="flex items-center justify-between px-1"><Label className="text-[10px] font-black text-slate-400 tracking-widest">الخيار ({letter})</Label><button onClick={() => updatePreviewQuestion(q.id, 'correct_option', letter)} className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg transition-all", isCorrect ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400 hover:bg-slate-300")}>{isCorrect ? 'الإجابة الصحيحة ✅' : 'تحديد كإجابة'}</button></div>
                          <Input value={q[field]} onChange={(e) => updatePreviewQuestion(q.id, field, e.target.value)} className={cn("rounded-xl border-slate-200 font-bold text-sm bg-white", isCorrect && "border-emerald-500 ring-2 ring-emerald-500/10")} dir="rtl" />
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

      {/* --- Smart File Upload Dialog --- */}
      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-10 shadow-2xl border-none z-[9999]">
          <DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3 font-cairo"><FileUp className="text-primary" /> رفع ملف الاختبار الذكي</DialogTitle></DialogHeader>
          <div className="mt-8 space-y-8">
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
              <div className="text-xs text-slate-600 leading-relaxed font-medium font-cairo">
                <p className="font-black text-slate-900 mb-2 underline underline-offset-4">تعليمات النمط الذكي:</p>
                <li className="mb-1">يدعم ملفات الـ **PDF** النصية، والـ **Text** والـ **HTML**.</li>
                <li>يجب تمييز الإجابة بـ (**+**) مثل: **3) + أغلبية الشركاء**.</li>
              </div>
            </div>
            <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.html" />
              {isProcessingFile ? (
                <div className="flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 text-primary animate-spin" /><p className="text-sm font-black text-slate-600">جاري تحليل محتوى الملف...</p></div>
              ) : (
                <div className="flex flex-col items-center gap-4"><div className="p-5 bg-slate-100 rounded-2xl group-hover:scale-110 group-hover:bg-white transition-all shadow-sm"><FileText className="w-10 h-10 text-slate-400 group-hover:text-primary" /></div><p className="font-black text-slate-700 text-lg font-cairo tracking-tight">اضغط لاختيار الملف الآن</p></div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Standard Dialogs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 z-[9999]">
          <DialogHeader><DialogTitle className="text-2xl font-black font-cairo tracking-tight">{editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-6 mt-6">
            <div className="space-y-2.5"><Label className="font-black text-slate-700">نص السؤال *</Label><Textarea value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} required className="rounded-2xl border-slate-200 min-h-[120px] font-bold font-cairo" /></div>
            <div className="grid grid-cols-2 gap-4">
              {['a', 'b', 'c', 'd'].map(l => <div key={l} className="space-y-2"><Label className="text-xs font-bold text-slate-400 tracking-widest uppercase">الخيار ({l})</Label><Input value={formData[`option_${l}` as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [`option_${l}`]: e.target.value })} className="rounded-xl font-cairo" /></div>)}
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t"><Button type="button" variant="ghost" onClick={handleCloseDialog} className="rounded-xl font-bold">إلغاء</Button><Button type="submit" disabled={saveMutation.isPending} className="gradient-primary text-white px-10 rounded-xl font-black shadow-lg shadow-primary/20">حفظ البيانات</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white border-none shadow-2xl p-8">
          <AlertDialogHeader><AlertDialogTitle className="font-black text-2xl font-cairo tracking-tight">تأكيد عملية الحذف</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription className="font-bold text-slate-500 text-base mt-2">هل أنت متأكد من حذف هذا السؤال نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          <AlertDialogFooter className="gap-3 mt-8"><AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel><AlertDialogAction onClick={() => deleteQuestion && supabase.from('questions').update({ status: 'deleted' }).eq('id', deleteQuestion.id).then(() => queryClient.invalidateQueries())} className="bg-destructive text-white rounded-xl font-black px-10 shadow-lg shadow-destructive/20 hover:bg-destructive/90 transition-all">حذف الآن</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExcelImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} subjectId={selectedSubject} />
      <HtmlImportDialog open={isHtmlImportDialogOpen} onOpenChange={setIsHtmlImportDialogOpen} subjectId={selectedSubject} />
    </div>
  </AdminLayout>
);
};

export default AdminQuestions;
