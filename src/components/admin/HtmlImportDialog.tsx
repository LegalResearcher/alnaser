import { useState, useRef } from 'react';
import { 
  Upload, FileCode, AlertCircle, CheckCircle2, 
  Settings2, Code2, ListOrdered, Table as TableIcon, 
  FileSearch, Database, Loader2, Sparkles, ChevronLeft
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

interface HtmlImportDialogProps {
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

export const HtmlImportDialog = ({ open, onOpenChange, subjectId }: HtmlImportDialogProps) => {
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

  const parseHtmlFile = async (file: File) => {
    setIsProcessing(true);
    setErrors([]);

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const questions: ParsedQuestion[] = [];
      const parseErrors: string[] = [];

      const questionContainers = doc.querySelectorAll(
        '.question, .quiz-question, [class*="question"], div[data-question], article, .card'
      );

      if (questionContainers.length > 0) {
        questionContainers.forEach((container, index) => {
          const parsed = parseQuestionContainer(container, index + 1);
          if (parsed.question) questions.push(parsed.question);
          else if (parsed.error) parseErrors.push(parsed.error);
        });
      }

      if (questions.length === 0) {
        const listItems = doc.querySelectorAll('ol > li, ul > li');
        listItems.forEach((li, index) => {
          const parsed = parseListItem(li, index + 1);
          if (parsed.question) questions.push(parsed.question);
        });
      }

      if (questions.length === 0) {
        const tables = doc.querySelectorAll('table');
        tables.forEach((table) => {
          const parsed = parseTable(table, parseErrors);
          questions.push(...parsed);
        });
      }

      if (questions.length === 0) {
        const bodyText = doc.body?.textContent || text;
        const textParsed = parseFromText(bodyText);
        questions.push(...textParsed);
      }

      if (questions.length === 0 && parseErrors.length === 0) {
        parseErrors.push('لم يتم العثور على أسئلة في الملف. تأكد من تنسيق ملف الـ HTML.');
      }

      setParsedQuestions(questions);
      setErrors(parseErrors);
      setStep('preview');
    } catch (error) {
      setErrors(['حدث خطأ أثناء قراءة الملف. تأكد من سلامة كود الـ HTML.']);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- الهياكل البرمجية المساعدة (نفس المنطق الأصلي مع تحسين التنظيف) ---
  const parseQuestionContainer = (container: Element, index: number): { question?: ParsedQuestion; error?: string } => {
    const text = container.textContent?.trim() || '';
    const questionEl = container.querySelector('.question-text, .q-text, h1, h2, h3, h4, p:first-of-type, strong');
    const questionText = questionEl?.textContent?.trim() || '';
    if (!questionText || questionText.length < 5) return {};
    const optionEls = container.querySelectorAll('.option, .answer, .choice, input[type="radio"] + label, label, li');
    const options: string[] = [];
    let correctIndex = -1;
    optionEls.forEach((el, i) => {
      const optText = el.textContent?.trim().replace(/^[أ-يa-dA-D][\.\)\-\s]+/, '') || '';
      if (optText && options.length < 4) {
        options.push(optText);
        if (el.classList.contains('correct') || el.classList.contains('right') || el.getAttribute('data-correct') === 'true' || (el as HTMLInputElement).checked) {
          correctIndex = options.length - 1;
        }
      }
    });
    if (options.length < 4) {
      const extracted = extractOptionsFromText(text);
      if (extracted.options.length >= 4) {
        options.length = 0;
        options.push(...extracted.options.slice(0, 4));
        correctIndex = extracted.correctIndex;
      }
    }
    if (options.length < 4) return { error: `السؤال ${index}: لم يتم العثور على خيارات كافية` };
    return {
      question: {
        question_text: cleanQuestionText(questionText),
        option_a: options[0], option_b: options[1], option_c: options[2], option_d: options[3],
        correct_option: correctIndex >= 0 ? (['A', 'B', 'C', 'D'][correctIndex] as 'A' | 'B' | 'C' | 'D') : 'A',
      },
    };
  };

  const parseListItem = (li: Element, index: number): { question?: ParsedQuestion; error?: string } => {
    const text = li.textContent?.trim() || '';
    const extracted = extractOptionsFromText(text);
    if (extracted.options.length >= 4) {
      const questionMatch = text.match(/^[^أابجدABCD]+/);
      const questionText = questionMatch ? questionMatch[0].trim() : text.split('\n')[0];
      return {
        question: {
          question_text: cleanQuestionText(questionText),
          option_a: extracted.options[0], option_b: extracted.options[1], option_c: extracted.options[2], option_d: extracted.options[3],
          correct_option: extracted.correctIndex >= 0 ? (['A', 'B', 'C', 'D'][extracted.correctIndex] as 'A' | 'B' | 'C' | 'D') : 'A',
        },
      };
    }
    return {};
  };

  const parseTable = (table: Element, errors: string[]): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (index === 0) return;
      const cells = row.querySelectorAll('td, th');
      if (cells.length >= 6) {
        const questionText = cells[0]?.textContent?.trim() || '';
        const options = [cells[1]?.textContent?.trim() || '', cells[2]?.textContent?.trim() || '', cells[3]?.textContent?.trim() || '', cells[4]?.textContent?.trim() || ''];
        const correct = cells[5]?.textContent?.trim().toUpperCase() || 'A';
        if (questionText && options.every(o => o)) {
          questions.push({
            question_text: cleanQuestionText(questionText),
            option_a: options[0], option_b: options[1], option_c: options[2], option_d: options[3],
            correct_option: ['A', 'B', 'C', 'D'].includes(correct) ? (correct as 'A' | 'B' | 'C' | 'D') : 'A',
          });
        }
      }
    });
    return questions;
  };

  const parseFromText = (text: string): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];
    const questionPattern = /(\d+[\.\)\-\s]+[^\n]+)\s*\n?\s*[أاآ][\.\)\-\s]+([^\n]+)\s*\n?\s*[ب][\.\)\-\s]+([^\n]+)\s*\n?\s*[ج][\.\)\-\s]+([^\n]+)\s*\n?\s*[د][\.\)\-\s]+([^\n]+)/g;
    let match;
    while ((match = questionPattern.exec(text)) !== null) {
      questions.push({
        question_text: cleanQuestionText(match[1]),
        option_a: match[2].trim(), option_b: match[3].trim(), option_c: match[4].trim(), option_d: match[5].trim(),
        correct_option: 'A',
      });
    }
    if (questions.length === 0) {
      const altPattern = /(\d+[\.\)\-\s]+[^\n]+)\s*\n?\s*[Aa][\.\)\-\s]+([^\n]+)\s*\n?\s*[Bb][\.\)\-\s]+([^\n]+)\s*\n?\s*[Cc][\.\)\-\s]+([^\n]+)\s*\n?\s*[Dd][\.\)\-\s]+([^\n]+)/g;
      while ((match = altPattern.exec(text)) !== null) {
        questions.push({
          question_text: cleanQuestionText(match[1]),
          option_a: match[2].trim(), option_b: match[3].trim(), option_c: match[4].trim(), option_d: match[5].trim(),
          correct_option: 'A',
        });
      }
    }
    return questions;
  };

  const extractOptionsFromText = (text: string): { options: string[]; correctIndex: number } => {
    const options: string[] = [];
    let correctIndex = -1;
    const arabicPattern = /[أاآ][\.\)\-\s]+([^بجد\n]+)[ب][\.\)\-\s]+([^جد\n]+)[ج][\.\)\-\s]+([^د\n]+)[د][\.\)\-\s]+([^\n]+)/;
    const arabicMatch = text.match(arabicPattern);
    if (arabicMatch) options.push(arabicMatch[1].trim(), arabicMatch[2].trim(), arabicMatch[3].trim(), arabicMatch[4].trim());
    if (options.length === 0) {
      const englishPattern = /[Aa][\.\)\-\s]+([^BbCcDd\n]+)[Bb][\.\)\-\s]+([^CcDd\n]+)[Cc][\.\)\-\s]+([^Dd\n]+)[Dd][\.\)\-\s]+([^\n]+)/;
      const englishMatch = text.match(englishPattern);
      if (englishMatch) options.push(englishMatch[1].trim(), englishMatch[2].trim(), englishMatch[3].trim(), englishMatch[4].trim());
    }
    const correctMarker = text.match(/الإجابة\s*:?\s*([أبجدABCD])/i);
    if (correctMarker) {
      const letter = correctMarker[1].toUpperCase();
      correctIndex = { 'أ': 0, 'ا': 0, 'A': 0, 'ب': 1, 'B': 1, 'ج': 2, 'C': 2, 'د': 3, 'D': 3 }[letter] ?? -1;
    }
    return { options, correctIndex };
  };

  const cleanQuestionText = (text: string): string => text.replace(/^\d+[\.\)\-\s]+/, '').replace(/\s+/g, ' ').trim();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseHtmlFile(file);
  };

  const importQuestions = async () => {
    if (parsedQuestions.length === 0 || !subjectId) return;
    
    if (!user?.id) {
      toast({ 
        title: 'خطأ في المصادقة', 
        description: 'يجب تسجيل الدخول لاستيراد الأسئلة. يرجى تحديث الصفحة والمحاولة مرة أخرى.',
        variant: 'destructive' 
      });
      return;
    }
    
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
      toast({ title: 'نجح الاستخراج والاستيراد', description: `تمت إضافة ${successCount} سؤال قانوني بنجاح` });
      handleClose();
    } catch (error) {
      toast({ title: 'فشل الاستيراد', variant: 'destructive' });
      setStep('preview');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl rounded-[2rem] overflow-hidden border-none p-0 bg-slate-50 shadow-2xl">
        
        {/* Header - تصميم "Code & Tech" فاخر */}
        <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Code2 className="w-24 h-24" />
          </div>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center backdrop-blur-md border border-primary/30">
                <FileCode className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">الاستيراد الذكي من HTML</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-sm font-medium">
              محرك تحليل المستويات؛ استخرج الأسئلة من أي صفحة ويب أو ملف HTML محلي بسهولة.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8">
          {/* Progress Steps Indicator */}
          <div className="flex items-center justify-between mb-10 px-10 relative">
            {[
              { id: 'upload', label: 'المصدر', icon: Upload },
              { id: 'preview', label: 'المعاينة', icon: FileSearch },
              { id: 'importing', label: 'المزامنة', icon: Database },
            ].map((s, i) => (
              <div key={s.id} className="flex flex-col items-center relative z-10 flex-1">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                  step === s.id ? "bg-primary text-white scale-110" : "bg-white text-slate-300 border border-slate-200"
                )}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-widest mt-3", 
                  step === s.id ? "text-primary" : "text-slate-400")}>{s.label}</span>
                {i < 2 && <div className="absolute top-6 left-[-50%] w-full h-[2px] bg-slate-200 -z-0" />}
              </div>
            ))}
          </div>

          {step === 'upload' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div 
                className="group border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white p-12 text-center hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  {isProcessing ? <Loader2 className="w-10 h-10 text-primary animate-spin" /> : <Upload className="w-10 h-10 text-slate-400 group-hover:text-primary" />}
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-2">ارفع ملف الـ HTML الخاص بك</h4>
                <p className="text-slate-500 text-sm mb-6">سنتكفل نحن بتحليل الهيكل واستخراج الأسئلة</p>
                <input ref={fileInputRef} type="file" accept=".html,.htm" onChange={handleFileChange} className="hidden" />
                <Button variant="secondary" className="rounded-2xl px-8 font-bold">اختيار ملف من الجهاز</Button>
              </div>

              {/* Supported Patterns Visual Guide */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Settings2, text: 'عناصر Div/Section' },
                  { icon: TableIcon, text: 'جداول البيانات' },
                  { icon: ListOrdered, text: 'قوائم مرقمة' },
                  { icon: FileCode, text: 'نصوص برمجية' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <item.icon className="w-4 h-4 text-primary opacity-60" />
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5">
                  <div className="flex items-center gap-3 text-amber-600 mb-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-black text-sm">تنبيهات التحليل ({errors.length})</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-xs font-bold text-amber-700/70 custom-scrollbar">
                    {errors.map((error, i) => <div key={i} className="flex gap-2"><span>•</span> {error}</div>)}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="font-black text-slate-800">تم التعرف على ({parsedQuestions.length}) سؤال</span>
                  </div>
                  <Sparkles className="w-5 h-5 text-primary opacity-30 animate-pulse" />
                </div>
                
                <div className="grid gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {parsedQuestions.slice(0, 5).map((q, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all">
                      <p className="text-sm font-bold text-slate-700 leading-relaxed line-clamp-2">{i + 1}. {q.question_text}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black uppercase tracking-widest">Correct: {q.correct_option}</span>
                      </div>
                    </div>
                  ))}
                  {parsedQuestions.length > 5 && <p className="text-center py-2 text-[11px] font-black text-slate-400 uppercase">و {parsedQuestions.length - 5} أسئلة إضافية...</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="ghost" onClick={resetState} className="rounded-2xl font-bold px-8">تغيير الملف</Button>
                <Button onClick={importQuestions} className="rounded-2xl px-10 font-black shadow-lg shadow-primary/25">
                  تأكيد وحفظ البيانات
                </Button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-10 py-12 text-center animate-in zoom-in-95 duration-500">
              <div className="relative w-24 h-24 mx-auto mb-8">
                 <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                 <div className="relative w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-slate-50">
                    <FileCode className="w-10 h-10 text-primary animate-pulse" />
                 </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">جاري حقن الأسئلة...</h3>
                <p className="text-slate-500 font-medium">نقوم الآن بمزامنة البيانات المستخرجة مع قاعدة البيانات.</p>
              </div>
              <div className="max-w-md mx-auto space-y-3">
                <Progress value={progress} className="h-3 rounded-full bg-slate-100 shadow-inner" />
                <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                   <span>Processing Batch</span>
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
