import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, 
  Download, FileText, ArrowRight, Loader2, Sparkles, 
  Database, History, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
}

interface ParsedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  hint?: string;
  exam_year?: number;
}

export const ExcelImportDialog = ({ open, onOpenChange, subjectId }: ExcelImportDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');

  const resetState = () => {
    setParsedQuestions([]);
    setErrors([]);
    setProgress(0);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'نص السؤال': 'ما هو السؤال الأول؟',
        'الخيار أ': 'الإجابة الأولى',
        'الخيار ب': 'الإجابة الثانية',
        'الخيار ج': 'الإجابة الثالثة',
        'الخيار د': 'الإجابة الرابعة',
        'الإجابة الصحيحة': 'A',
        'ملاحظة': 'ملاحظة اختيارية',
        'سنة الاختبار': 2024,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الأسئلة');
    
    ws['!cols'] = [{ wch: 50 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 15 }];
    XLSX.writeFile(wb, 'قالب_الأسئلة_الباحث_القانوني.xlsx');
  };

  const parseExcelFile = async (file: File) => {
    setIsProcessing(true);
    setErrors([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const questions: ParsedQuestion[] = [];
      const parseErrors: string[] = [];

      jsonData.forEach((row: any, index: number) => {
        const rowNum = index + 2;
        const questionText = row['نص السؤال'] || row['السؤال'] || row['question_text'] || '';
        const optionA = row['الخيار أ'] || row['خيار أ'] || row['option_a'] || row['A'] || '';
        const optionB = row['الخيار ب'] || row['خيار ب'] || row['option_b'] || row['B'] || '';
        const optionC = row['الخيار ج'] || row['خيار ج'] || row['option_c'] || row['C'] || '';
        const optionD = row['الخيار د'] || row['خيار د'] || row['option_d'] || row['D'] || '';
        const correctOption = (row['الإجابة الصحيحة'] || row['الجواب'] || row['correct_option'] || row['correct'] || '').toString().toUpperCase();
        const hint = row['ملاحظة'] || row['hint'] || '';
        const examYear = row['سنة الاختبار'] || row['السنة'] || row['exam_year'] || '';

        if (!questionText) { parseErrors.push(`الصف ${rowNum}: نص السؤال مطلوب`); return; }
        if (!optionA || !optionB || !optionC || !optionD) { parseErrors.push(`الصف ${rowNum}: جميع الخيارات مطلوبة`); return; }
        if (!['A', 'B', 'C', 'D'].includes(correctOption)) { parseErrors.push(`الصف ${rowNum}: الإجابة الصحيحة يجب أن تكون A, B, C, أو D`); return; }

        questions.push({
          question_text: questionText.toString().trim(),
          option_a: optionA.toString().trim(),
          option_b: optionB.toString().trim(),
          option_c: optionC.toString().trim(),
          option_d: optionD.toString().trim(),
          correct_option: correctOption as 'A' | 'B' | 'C' | 'D',
          hint: hint?.toString().trim() || undefined,
          exam_year: examYear ? parseInt(examYear.toString()) : undefined,
        });
      });

      if (questions.length === 0 && parseErrors.length === 0) parseErrors.push('لم يتم العثور على أسئلة في الملف');

      setParsedQuestions(questions);
      setErrors(parseErrors);
      setStep('preview');
    } catch (error) {
      setErrors(['حدث خطأ أثناء قراءة الملف. تأكد من أن الملف بصيغة Excel صحيحة.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseExcelFile(file);
  };

  const importQuestions = async () => {
    if (parsedQuestions.length === 0 || !subjectId) return;
    setStep('importing');
    setProgress(0);

    try {
      const batchSize = 50;
      const totalBatches = Math.ceil(parsedQuestions.length / batchSize);
      let successCount = 0;

      for (let i = 0; i < totalBatches; i++) {
        const batch = parsedQuestions.slice(i * batchSize, (i + 1) * batchSize);
        const questionsToInsert = batch.map(q => ({
          subject_id: subjectId,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          hint: q.hint || null,
          exam_year: q.exam_year || null,
          created_by: user?.id,
        }));

        const { error } = await supabase.from('questions').insert(questionsToInsert);
        if (error) throw error;

        successCount += batch.length;
        setProgress(Math.round((successCount / parsedQuestions.length) * 100));
      }

      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: 'تم الاستيراد بنجاح', description: `تم إضافة ${successCount} سؤال إلى قاعدة البيانات` });
      handleClose();
    } catch (error) {
      toast({ title: 'حدث خطأ أثناء الاستيراد', variant: 'destructive' });
      setStep('preview');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl rounded-[2rem] overflow-hidden border-none p-0 bg-slate-50 shadow-2xl">
        
        {/* Header - تصميم متطور مع خلفية متدرجة */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Database className="w-24 h-24" />
          </div>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">استيراد الأسئلة الذكي</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-sm font-medium">
              نظام المعالجة التلقائية لملفات Excel - حول بياناتك إلى اختبارات حية.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8">
          {/* Progress Tracker - مؤشر خطوات عالمي */}
          <div className="flex items-center justify-between mb-10 px-10">
            {[
              { id: 'upload', label: 'رفع الملف', icon: Upload },
              { id: 'preview', label: 'مراجعة البيانات', icon: FileText },
              { id: 'importing', label: 'بدء الاستيراد', icon: Database },
            ].map((s, i) => (
              <div key={s.id} className="flex flex-col items-center relative flex-1">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 shadow-lg",
                  step === s.id ? "bg-primary text-white scale-110" : "bg-white text-slate-300 border border-slate-200"
                )}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-widest mt-3 transition-colors", 
                  step === s.id ? "text-primary" : "text-slate-400")}>{s.label}</span>
                {i < 2 && <div className="absolute top-6 left-[-50%] w-full h-[2px] bg-slate-200 -z-0" />}
              </div>
            ))}
          </div>

          {step === 'upload' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div 
                className="group border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white p-12 text-center hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer relative"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner">
                  {isProcessing ? <Loader2 className="w-10 h-10 text-primary animate-spin" /> : <Upload className="w-10 h-10 text-slate-400 group-hover:text-primary transition-colors" />}
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-2">اسحب وأفلت ملف الـ Excel هنا</h4>
                <p className="text-slate-500 text-sm mb-6">يدعم التنسيقات .xlsx و .xls فقط</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
                <Button variant="secondary" className="rounded-2xl px-8 font-bold">تصفح ملفاتك</Button>
              </div>

              <div className="flex items-center justify-between p-6 bg-primary/5 rounded-3xl border border-primary/10">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">هل تبحث عن القالب الصحيح؟</p>
                    <p className="text-slate-500 text-xs">قم بتحميل النموذج لضمان توافق البيانات.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="rounded-xl font-bold gap-2">
                  تحميل القالب <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {errors.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6">
                  <div className="flex items-center gap-3 text-rose-600 mb-4">
                    <AlertCircle className="w-6 h-6" />
                    <span className="font-black">تنبيه: تم اكتشاف ({errors.length}) أخطاء</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-2 text-xs font-bold text-rose-500/80">
                    {errors.map((error, i) => <div key={i} className="flex gap-2"><span>•</span> {error}</div>)}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <span className="font-black text-slate-800">معاينة البيانات المستخرجة ({parsedQuestions.length} سؤال)</span>
                  </div>
                  <History className="w-5 h-5 text-slate-300" />
                </div>
                <div className="grid gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {parsedQuestions.slice(0, 5).map((q, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                         <p className="text-sm font-black text-slate-700 leading-relaxed group-hover:text-primary transition-colors">{i + 1}. {q.question_text}</p>
                         <span className="text-[10px] bg-white border px-2 py-0.5 rounded-lg text-slate-400 font-bold uppercase">{q.correct_option}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                         <div className="flex items-center gap-1"><Info className="w-3 h-3" /> نموذج {q.exam_year || 'عام'}</div>
                      </div>
                    </div>
                  ))}
                  {parsedQuestions.length > 5 && <p className="text-center py-4 text-xs font-black text-slate-400 uppercase tracking-widest">+ {parsedQuestions.length - 5} أسئلة إضافية قيد التحميل</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <Button variant="ghost" onClick={resetState} className="rounded-2xl font-bold px-8">إلغاء</Button>
                <Button onClick={importQuestions} disabled={parsedQuestions.length === 0} className="rounded-2xl px-10 font-black shadow-lg shadow-primary/25">بدء حقن البيانات</Button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-10 py-12 text-center animate-in zoom-in-95 duration-500">
              <div className="relative w-24 h-24 mx-auto mb-8">
                 <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                 <div className="relative w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-slate-50">
                    <Database className="w-10 h-10 text-primary animate-bounce" />
                 </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">جاري مزامنة البيانات...</h3>
                <p className="text-slate-500 font-medium">يرجى عدم إغلاق هذه الصفحة حتى تكتمل العملية.</p>
              </div>
              <div className="max-w-md mx-auto space-y-3">
                <Progress value={progress} className="h-3 rounded-full bg-slate-100 shadow-inner" />
                <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                   <span>Processing Data</span>
                   <span className="text-primary text-sm">{progress}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
