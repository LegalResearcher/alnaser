/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 * Version: 21.5 (OCR + Color Detection Support)
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

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

const EXAM_FORMS = [
  { id: 'General', name: 'نموذج العام' },
  { id: 'Parallel', name: 'نموذج الموازي' },
  { id: 'Mixed', name: 'نموذج مختلط' }
];

// --- محرك الاستخراج الذكي مع دعم تمييز الألوان ---
const parseSanaaLegalContent = (text: string) => {
  const cleanText = text.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/_/g, '');
  const lines = cleanText.split('\n');
  const results: any[] = [];
  let current: any = null;

  lines.forEach(line => {
    const t = line.trim();
    if (!t || t.length < 2) return;

    const questionMatch = t.match(/^(\d+)\s*[-\.\)]\s*(.+)/);
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
      // إذا كان النص المستخرج يحتوي على علامة "+" أو "✅" فسيتم اعتبارها صحيحة
      const isCorrectText = t.includes('+') || t.includes('✅') || t.includes('CORRECT');
      let cleanVal = optionMatch[2].trim();

      if (cleanVal) {
        current.count++;
        const letters = ['A', 'B', 'C', 'D'];
        const letter = letters[current.count - 1];
        if (letter) {
          current[`option_${letter.toLowerCase()}`] = cleanVal;
          if (isCorrectText) current.correct_option = letter;
        }
      }
    } 
    else if (current && t.length > 5 && !t.match(/^\d/)) {
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

  // --- تحليل الألوان في الصورة لاكتشاف الإجابة الصحيحة (اللون الأخضر) ---
  const detectGreenInRegion = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): boolean => {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    let greenPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // فحص درجات اللون الأخضر (معدل أخضر أعلى من الأحمر والأزرق)
      if (g > 100 && g > r * 1.2 && g > b * 1.2) {
        greenPixels++;
      }
    }
    return greenPixels > (data.length / 4) * 0.1; // إذا كان 10% من المنطقة أخضر
  };

  const processFileWithOCRAndColor = async (file: File) => {
    let fullText = "";
    if (file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        // استخراج النص مع الحفاظ على أماكن الكلمات لاكتشاف الألوان لاحقاً
        const { data: { text, paragraphs } } = await Tesseract.recognize(canvas, 'ara+eng');
        
        let pageText = "";
        paragraphs.forEach(p => {
          // فحص هل الفقرة محددة بالأخضر
          const isGreen = detectGreenInRegion(context, p.bbox.x0, p.bbox.y0, p.bbox.x1 - p.bbox.x0, p.bbox.y1 - p.bbox.y0);
          pageText += (isGreen ? "+ " : "") + p.text + "\n";
        });
        
        fullText += pageText + "\n";
      }
    } else {
      const { data: { text } } = await Tesseract.recognize(file, 'ara+eng');
      fullText = text;
    }
    return fullText;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    try {
      const extractedText = await processFileWithOCRAndColor(file);
      const questions = parseSanaaLegalContent(extractedText);
      
      if (questions.length > 0) {
        setPreviewQuestions(questions);
        setIsFileUploadOpen(false);
        setIsPreviewOpen(true);
      } else {
        toast({ title: "فشل التعرف", description: "لم نتمكن من تحليل الملف. تأكد من جودته.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء المعالجة الرقمية.", variant: "destructive" });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- CRUD Operations (ابقاء الكود مستقراً) ---
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
      await supabase.from('questions').insert(formatted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: "تم الاستيراد بنجاح ✅" });
      setIsPreviewOpen(false);
    }
  });

  const saveSingleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = { ...data, subject_id: selectedSubject, exam_year: data.exam_year ? parseInt(data.exam_year) : null, created_by: user?.id, status: 'active' };
      if (editingQuestion) await supabase.from('questions').update(payload).eq('id', editingQuestion.id);
      else await supabase.from('questions').insert(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['questions'] }); setIsDialogOpen(false); }
  });

  const softDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.rpc('soft_delete_questions', { p_ids: ids }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['questions'] }); setSelectedIds([]); setIsBulkDeleteDialogOpen(false); }
  });

  const toggleSelectOne = (id: string) => selectedIds.includes(id) ? setSelectedIds(prev => prev.filter(x => x !== id)) : setSelectedIds(prev => [...prev, id]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 font-cairo">
          <div><h1 className="text-2xl font-black text-slate-900">إدارة بنك الأسئلة</h1><p className="text-sm text-slate-500">العدد الكلي: {questions.length}</p></div>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)}>حذف المحدد</Button>}
            <Button variant="outline" size="sm" onClick={() => setIsFileUploadOpen(true)} disabled={!selectedSubject} className="gap-2 border-primary/20 bg-primary/5 text-primary font-bold"><ScanLine className="w-4 h-4" /> استيراد ذكي (تعرف على الألوان)</Button>
            <Button size="sm" onClick={() => { setEditingQuestion(null); setIsDialogOpen(true); }} disabled={!selectedSubject} className="gradient-primary text-white font-bold"><Plus className="w-4 h-4" /> إضافة سؤال</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 font-cairo">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}><SelectTrigger className="bg-white"><SelectValue placeholder="المستوى" /></SelectTrigger><SelectContent className="bg-white">{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger className="bg-white"><SelectValue placeholder="المادة" /></SelectTrigger><SelectContent className="bg-white">{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}><SelectTrigger className="bg-white"><SelectValue placeholder="السنة" /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="all">كل السنوات</SelectItem>{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedExamForm || "all"} onValueChange={(v) => setSelectedExamForm(v === "all" ? "" : v)}><SelectTrigger className="bg-white"><SelectValue placeholder="النموذج" /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="all">كل النماذج</SelectItem>{EXAM_FORMS.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select>
          <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white pr-10" /></div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
          {isLoading ? <div className="p-6 space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div> : (
            <div className="divide-y divide-slate-50 font-cairo">
              {questions.map((q) => (
                <div key={q.id} className={cn("p-6 hover:bg-slate-50 transition-colors flex gap-4 items-start", selectedIds.includes(q.id) && "bg-blue-50/50")}>
                  <Checkbox checked={selectedIds.includes(q.id)} onCheckedChange={() => toggleSelectOne(q.id)} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-800 text-lg mb-4">{q.question_text}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingQuestion(q); setFormData({...q, exam_year: q.exam_year?.toString() || '', exam_form: (q as any).exam_form || 'General'} as any); setIsDialogOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteQuestion(q)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={cn("p-4 rounded-xl border font-bold", q.correct_option === 'A' ? "bg-emerald-50 border-emerald-200" : "bg-white")}>أ. {q.option_a}</div>
                      <div className={cn("p-4 rounded-xl border font-bold", q.correct_option === 'B' ? "bg-emerald-50 border-emerald-200" : "bg-white")}>ب. {q.option_b}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl bg-white h-[94vh] flex flex-col font-cairo rounded-3xl p-0 z-[9999]">
          <div className="p-6 border-b flex justify-between items-center">
            <DialogTitle className="text-2xl font-black">مراجعة وتأكيد الإجابات (المستخرجة بالألوان)</DialogTitle>
            <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>إلغاء</Button>
          </div>
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-8 pb-10">
              {previewQuestions.map((q) => (
                <div key={q.id} className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 relative">
                  <Textarea value={q.question_text} onChange={(e) => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i].question_text = e.target.value; setPreviewQuestions(up); }} className="mb-6 rounded-xl font-bold text-lg bg-white" dir="rtl" />
                  <div className="grid grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map(l => (
                      <div key={l} className="space-y-1">
                        <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase">خيار ({l})</Label><button onClick={() => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i].correct_option = l; setPreviewQuestions(up); }} className={cn("text-[9px] font-black px-2 py-0.5 rounded-md", q.correct_option === l ? "bg-emerald-500 text-white" : "bg-slate-200")}>{q.correct_option === l ? 'إجابة صحيحة' : 'تغيير'}</button></div>
                        <Input value={q[`option_${l.toLowerCase()}`]} className="h-10 font-bold" dir="rtl" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-6 border-t"><Button onClick={() => bulkSave.mutate(previewQuestions)} disabled={bulkSave.isPending} className="gradient-primary text-white font-black w-full h-12 rounded-xl text-lg">{bulkSave.isPending ? 'جاري الحفظ...' : `حفظ ${previewQuestions.length} سؤال تم تحديد إجاباتها آلياً`}</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-10 z-[9999] font-cairo shadow-2xl">
          <DialogTitle className="text-2xl font-black">رفع الملف الملون (أخضر)</DialogTitle>
          <div onClick={() => fileInputRef.current?.click()} className="mt-8 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:bg-primary/5 cursor-pointer transition-all">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
            {isProcessingFile ? <div className="flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 text-primary animate-spin" /><p className="text-sm font-black text-slate-600">جاري تحليل النصوص واكتشاف تظليل الإجابات...</p></div> : <div className="flex flex-col items-center gap-4"><FileText className="w-12 h-12 text-slate-400" /><p className="font-black text-slate-700 text-lg">اضغط لرفع الملف (PDF/صورة)</p></div>}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white p-8 shadow-2xl font-cairo">
          <AlertDialogTitle className="font-black text-2xl">حذف السؤال</AlertDialogTitle>
          <AlertDialogFooter className="gap-3 mt-8"><AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel><AlertDialogAction onClick={() => deleteQuestion && softDeleteMutation.mutate([deleteQuestion.id])} className="bg-destructive text-white rounded-xl font-black px-10">حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 z-[9999] font-cairo font-bold shadow-2xl">
          <DialogTitle className="text-2xl font-black">{editingQuestion ? 'تعديل' : 'إضافة'}</DialogTitle>
          <form onSubmit={(e) => { e.preventDefault(); saveSingleMutation.mutate(formData); }} className="space-y-4 mt-4">
            <Label>نص السؤال</Label><Textarea value={formData.question_text} onChange={(e) => setFormData({...formData, question_text: e.target.value})} required className="min-h-[100px]" />
            <div className="grid grid-cols-2 gap-4">{['a', 'b', 'c', 'd'].map(l => <div key={l}><Label>خيار {l.toUpperCase()}</Label><Input value={formData[`option_${l}` as keyof typeof formData] as string} onChange={(e) => setFormData({...formData, [`option_${l}`]: e.target.value})} /></div>)}</div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>الصح</Label><Select value={formData.correct_option} onValueChange={(v) => setFormData({...formData, correct_option: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="A">أ</SelectItem><SelectItem value="B">ب</SelectItem><SelectItem value="C">ج</SelectItem><SelectItem value="D">د</SelectItem></SelectContent></Select></div>
              <div><Label>السنة</Label><Select value={formData.exam_year} onValueChange={(v) => setFormData({...formData, exam_year: v})}><SelectTrigger><SelectValue placeholder="سنة" /></SelectTrigger><SelectContent className="bg-white max-h-[150px]">{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>النموذج</Label><Select value={formData.exam_form} onValueChange={(v) => setFormData({...formData, exam_form: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-white">{EXAM_FORMS.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <Button type="submit" className="gradient-primary text-white w-full h-12 rounded-xl text-lg font-black mt-4">حفظ</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminQuestions;
