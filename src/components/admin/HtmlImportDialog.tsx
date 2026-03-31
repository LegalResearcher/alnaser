import { useState, useRef } from 'react';
import { 
  Upload, FileCode, AlertCircle, CheckCircle2, 
  Settings2, Code2, ListOrdered, Table as TableIcon, 
  FileSearch, Database, Loader2, Sparkles, ChevronLeft,
  FileText
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();
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

// --- المحرك الذكي الشامل (نفس منطق لصق النص) ---
const parseSanaaLegalContent = (text: string) => {
  const cleanText = text.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/_/g, '');
  const lines = cleanText.split('\n');
  const results: ParsedQuestion[] = [];
  let current: any = null;

  lines.forEach(line => {
    const t = line.trim();
    if (!t || t.length < 2) return;

    const isTrueFalse = t.includes('العبارة صحيحة') || t.includes('العبارة خاطئة');
    const hasSignAfterNum = /^[١٢٣٤1-4]\)\s*[+\-]/.test(t);
    const isOption = isTrueFalse || hasSignAfterNum;

    if (isOption) {
      if (!current) return;
      const isCorrect = t.includes('+');
      let cleanVal = t
        .replace(/^[\(\s\d١٢٣٤\)\.\-\+]+/, '')
        .replace(/[\+\-]$/, '')
        .replace(/\s*(TCPDF|tcpdf|www\.tcpdf\.org|Powered by TCPDF)[^$]*/gi, '')
        .trim();
      if (t.includes('العبارة صحيحة')) cleanVal = 'العبارة صحيحة';
      else if (t.includes('العبارة خاطئة')) cleanVal = 'العبارة خاطئة';
      if (cleanVal) {
        current.count++;
        const letters = ['A', 'B', 'C', 'D'] as const;
        const letter = letters[current.count - 1];
        if (letter) {
          current[`option_${letter.toLowerCase()}`] = cleanVal;
          if (isCorrect) current.correct_option = letter;
        }
      }
    } else {
      if (current && current.count > 0) { results.push(current); current = null; }
      if (!current) {
        current = {
          question_text: t.replace(/^[\(\s\d١٢٣٤\)]+/, '').trim(),
          option_a: '', option_b: '', option_c: '', option_d: '',
          correct_option: 'A' as const, count: 0
        };
      } else {
        current.question_text += ' ' + t.replace(/^[\(\s\d١٢٣٤\)]+/, '').trim();
      }
    }
  });

  if (current && current.count > 0) results.push(current);
  return results;
};

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

  // --- استخراج النص من PDF مع دعم RTL الكامل ---
  const processPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let allLines: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      if (textContent.items.length === 0) {
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport, canvas } as any).promise;
        const { data: { text } } = await Tesseract.recognize(canvas, 'ara');
        allLines.push(...text.split('\n').filter((l: string) => l.trim()));
        continue;
      }

      interface WordItem { text: string; x: number; y: number; }
      const wordItems: WordItem[] = [];
      for (const item of textContent.items as any[]) {
        if (!item.str?.trim()) continue;
        wordItems.push({ text: item.str.trim(), x: item.transform[4], y: item.transform[5] });
      }

      const linesMap = new Map<number, WordItem[]>();
      for (const w of wordItems) {
        const yKey = Math.round(w.y / 3) * 3;
        if (!linesMap.has(yKey)) linesMap.set(yKey, []);
        linesMap.get(yKey)!.push(w);
      }

      const sortedYKeys = Array.from(linesMap.keys()).sort((a, b) => b - a);
      const pageRawLines: string[] = [];

      for (const yKey of sortedYKeys) {
        const lineWords = linesMap.get(yKey)!;
        lineWords.sort((a, b) => b.x - a.x);
        const lineText = lineWords.map(w => w.text).join(' ');
        const fixed = lineText.replace(/^\((\d{1,2})\s+/, '$1) ');
        const cleanFixed = fixed.replace(/[\u0600-\u06FF\uFE70-\uFEFF]+\s+\d+\s*\/\s*\d+/g, '').trim();
        if (!cleanFixed) continue;
        if (/TCPDF|tcpdf|www\.tcpdf/i.test(cleanFixed)) continue;
        pageRawLines.push(cleanFixed);
      }

      let startIdx = 0;
      for (let i = 0; i < pageRawLines.length; i++) {
        if (/^\d+\)\s/.test(pageRawLines[i].trim())) { startIdx = i; break; }
      }

      const pageLines = pageRawLines.slice(startIdx);
      const merged: string[] = [];
      for (const line of pageLines) {
        const t = line.trim();
        if (!t) continue;
        const isNewLine = /^\d+\)/.test(t);
        if (!isNewLine && merged.length > 0) {
          merged[merged.length - 1] += ' ' + t;
        } else {
          merged.push(t);
        }
      }

      allLines.push(...merged);
    }

    return allLines.join('\n');
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
    const lines = text.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // ── صيغة PDF: السؤال يبدأ برقم) مثل: 1) نص السؤال
      // والخيارات: 1) - نص أو 1) + نص (+ تعني الصحيحة)
      const qMatchPdf = line.match(/^(\d+)\)\s*[-–]?\s*(.+)/);
      if (
        qMatchPdf &&
        i + 4 < lines.length &&
        /^1\)\s*[+-–]/.test(lines[i+1]?.trim()) &&
        /^2\)\s*[+-–]/.test(lines[i+2]?.trim()) &&
        /^3\)\s*[+-–]/.test(lines[i+3]?.trim()) &&
        /^4\)\s*[+-–]/.test(lines[i+4]?.trim())
      ) {
        const questionText = qMatchPdf[2].trim();
        const rawOpts = [
          lines[i+1].trim(),
          lines[i+2].trim(),
          lines[i+3].trim(),
          lines[i+4].trim(),
        ];
        let correctOption: 'A' | 'B' | 'C' | 'D' = 'A';
        const cleanedOpts = rawOpts.map((opt, idx) => {
          const m = opt.match(/^\d+\)\s*([+-–])\s*(.+)/);
          if (!m) return opt.trim();
          if (m[1] === '+') correctOption = (['A', 'B', 'C', 'D'] as const)[idx];
          return m[2].trim();
        });
        if (cleanedOpts.every(o => o.length > 0)) {
          questions.push({
            question_text: questionText,
            option_a: cleanedOpts[0],
            option_b: cleanedOpts[1],
            option_c: cleanedOpts[2],
            option_d: cleanedOpts[3],
            correct_option: correctOption,
          });
          i += 5;
          continue;
        }
      }

      // ── الصيغة اليدوية: السؤال بدون رقم، خيارات 1) نص +
      if (line && !/^\d+\)/.test(line)) {
        if (
          i + 4 < lines.length &&
          /^1\)/.test(lines[i+1]?.trim()) &&
          /^2\)/.test(lines[i+2]?.trim()) &&
          /^3\)/.test(lines[i+3]?.trim()) &&
          /^4\)/.test(lines[i+4]?.trim())
        ) {
          const rawOpts = [
            lines[i+1].trim().replace(/^1\)\s*/, ''),
            lines[i+2].trim().replace(/^2\)\s*/, ''),
            lines[i+3].trim().replace(/^3\)\s*/, ''),
            lines[i+4].trim().replace(/^4\)\s*/, ''),
          ];
          let correctOption: 'A' | 'B' | 'C' | 'D' = 'A';
          const cleanedOpts = rawOpts.map((opt, idx) => {
            if (opt.trimEnd().endsWith('+')) {
              correctOption = (['A', 'B', 'C', 'D'] as const)[idx];
              return opt.trimEnd().slice(0, -1).trim();
            }
            return opt.trim();
          });
          if (cleanedOpts.every(o => o.length > 0)) {
            questions.push({
              question_text: line,
              option_a: cleanedOpts[0],
              option_b: cleanedOpts[1],
              option_c: cleanedOpts[2],
              option_d: cleanedOpts[3],
              correct_option: correctOption,
            });
            i += 5;
            continue;
          }
        }
      }

      i++;
    }

    if (questions.length > 0) return questions;

    // ── الصيغة القديمة: أ، ب، ج، د
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setIsProcessing(true);
      setErrors([]);
      try {
        const text = await processPDF(file);
        const questions = parseSanaaLegalContent(text);
        if (questions.length > 0) {
          setParsedQuestions(questions);
          setErrors([]);
          setStep('preview');
        } else {
          setErrors(['لم يتم العثور على أسئلة في ملف PDF. تأكد من أن الصيغة صحيحة.']);
          setStep('preview');
        }
      } catch (err) {
        setErrors(['حدث خطأ أثناء قراءة ملف PDF.']);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Handle HTML file - same inline implementation
      setIsProcessing(true);
      setErrors([]);

      try {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const textParsed = parseFromText(doc.body?.textContent || text);
        
        if (textParsed.length === 0) {
          setErrors(['لم يتم العثور على أسئلة في الملف. تأكد من تنسيق الملف.']);
        }
        
        setParsedQuestions(textParsed);
        setStep('preview');
      } catch (error) {
        setErrors(['حدث خطأ أثناء قراءة الملف.']);
      } finally {
        setIsProcessing(false);
      }
    }
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
              <DialogTitle className="text-2xl font-black tracking-tight">الاستيراد الذكي من PDF / HTML</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-sm font-medium">
              محرك تحليل متطور؛ استخرج الأسئلة من ملفات PDF أو HTML بنفس دقة لصق النص مباشرةً.
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
                <h4 className="text-lg font-black text-slate-800 mb-2">ارفع ملف PDF أو HTML</h4>
                <p className="text-slate-500 text-sm mb-6">سنستخرج الأسئلة تلقائياً بنفس دقة لصق النص</p>
                <input ref={fileInputRef} type="file" accept=".html,.htm,.pdf" onChange={handleFileChange} className="hidden" />
                <Button variant="secondary" className="rounded-2xl px-8 font-bold">اختيار ملف PDF أو HTML</Button>
              </div>

              {/* Supported Patterns Visual Guide */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: FileText, text: 'ملفات PDF' },
                  { icon: TableIcon, text: 'جداول البيانات' },
                  { icon: ListOrdered, text: 'قوائم مرقمة' },
                  { icon: FileCode, text: 'ملفات HTML' },
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
