/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 * Version: 22.0 (RTL Fix + Arabic Text Support)
 */

import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Plus, Search, Edit2, Trash2, BookOpen, CheckCircle2, FileUp, 
  Loader2, FileText, AlertCircle, Eye, Save, X, PencilLine, ScanLine,
  ChevronUp, ChevronDown, Replace
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question, Subject, Level, EXAM_YEARS } from '@/types/database';
import { AdminSEO } from '@/components/seo/SEOHead';
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
import { parseQuestionsFromWords, normalizeArabicPresentationForms, type ParserWord } from '@/lib/pdf-question-parser';

// رابط الـ Worker (ثابت)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

// نماذج الاختبار
const EXAM_FORMS = [
  { id: 'General', name: 'نموذج العام' },
  { id: 'Parallel', name: 'نموذج الموازي' },
  { id: 'Mixed', name: 'نموذج مختلط' },
  { id: 'Trial', name: 'أسئلة تجريبية' }
];

// --- المحرك الذكي الشامل (يدعم العربية بالكامل + RTL) ---
const parseSanaaLegalContent = (text: string) => {
  const cleanText = text.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/_/g, '');
  const lines = cleanText.split('\n');
  const results: any[] = [];
  let current: any = null;

  lines.forEach(line => {
    const t = line.trim();
    if (!t || t.length < 2) return;

    // تحديد ما إذا كان السطر "خياراً":
    // الخيار يبدأ بـ "رقم) + أو -" أو يحتوي على "العبارة صحيحة/خاطئة"
    // السؤال يبدأ بـ "رقم)" بدون + أو - مباشرة بعده
    const isTrueFalse = t.includes('العبارة صحيحة') || t.includes('العبارة خاطئة');
    // الخيار: رقم أحادي (1-4) فقط + ) + مسافة + علامة — لا رقمين مثل 16) أو 30)
    const hasSignAfterNum = /^[١٢٣٤1-4]\)\s*[+\-]/.test(t) && !/^\d{2,}/.test(t);
    // اعتبره خياراً فقط إذا كان هناك سؤال حالي — يمنع الخلط مع أرقام الأسئلة
    const isOption = (isTrueFalse || hasSignAfterNum) && !!current;

    if (isOption) {
      if (!current) return;

      const isCorrect = t.includes('+');

      let cleanVal = t
        .replace(/^[\(]?[١٢٣٤1-4][\)]\s*[+\-]?\s*/, '')
        .replace(/\s*[+\-]\s*$/, '')
        .replace(/\s*(TCPDF|tcpdf|www\.tcpdf\.org|Powered by TCPDF)[^$]*/gi, '')
        .trim();

      if (t.includes('العبارة صحيحة')) cleanVal = 'العبارة صحيحة';
      else if (t.includes('العبارة خاطئة')) cleanVal = 'العبارة خاطئة';

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
    else {
      // حفظ السؤال السابق فقط إذا كان يحتوي على خيارات كافية
      if (current && current.count >= 2) {
        // أسئلة صح/خطأ: أكمل الخيارات الفارغة
        if (current.count === 2 && !current.option_c && !current.option_d) {
          current.option_c = '';
          current.option_d = '';
        }
        results.push(current);
        current = null;
      } else if (current && current.count > 0 && current.count < 2) {
        // سؤال ناقص — تجاهله
        current = null;
      }

      if (!current) {
        current = {
          id: Math.random().toString(36).substr(2, 9),
          question_text: t.replace(/^[\(]?[١٢٣٤\d]+[\)]\s*/, '').trim(),
          option_a: '', option_b: '', option_c: '', option_d: '',
          correct_option: 'A',
          count: 0
        };
      } else {
        current.question_text += ' ' + t.replace(/^[\(]?[١٢٣٤\d]+[\)]\s*/, '').trim();
      }
    }
  });

  if (current && current.count >= 2) results.push(current);
  return results;
};

// تنظيف نص الخيار القادم من PDF (يُزيل الأرقام والرموز الزائدة)
const cleanPDFOptionText = (text: string): string =>
  text
    .replace(/^[\(\s\d١٢٣٤\)\.\-\+]+/, '')   // بداية السطر
    .replace(/[\s\+\-]+$/, '')                  // نهاية السطر
    .replace(/[\(（]\s*[\d١٢٣٤]\s*[)）]/g, '') // أرقام بين قوسين في الوسط
    .trim();

const toArabicOrdinal = (n: number): string => {
  const ordinals = ['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر','الثالث عشر','الرابع عشر','الخامس عشر'];
  return `القسم ${ordinals[n - 1] ?? n}`;
};

const AdminQuestions = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isEditor } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2Col = useRef<HTMLInputElement>(null);

  const requireAdminOrEditor = () => {
    if (!user) {
      const err: any = new Error('يلزم تسجيل الدخول لإجراء هذه العملية');
      err.code = 'AUTH_REQUIRED';
      throw err;
    }

    if (!isAdmin && !isEditor) {
      const err: any = new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      err.code = 'FORBIDDEN';
      throw err;
    }
  };

  const getFriendlyError = (err: any): { title: string; description: string } => {
    const raw = (err?.message ?? err?.error_description ?? '').toString();
    const lower = raw.toLowerCase();

    if (err?.code === 'AUTH_REQUIRED') {
      return {
        title: 'يلزم تسجيل الدخول',
        description: 'سجّل الدخول بحساب مدير/محرر ثم أعد المحاولة.',
      };
    }

    if (err?.code === 'FORBIDDEN') {
      return {
        title: 'لا تملك صلاحية',
        description: 'هذه العملية متاحة فقط للمديرين أو المحررين.',
      };
    }

    if (lower.includes('row-level security') || lower.includes('violates row-level security')) {
      return {
        title: 'خطأ صلاحيات (RLS)',
        description: 'حسابك الحالي لا يملك صلاحية التعديل/الحذف. تأكد من تسجيل الدخول وأن دورك (admin/editor) مُسجل في النظام.',
      };
    }

    return {
      title: 'حدث خطأ',
      description: raw || 'حدث خطأ غير متوقع. حاول مرة أخرى.',
    };
  };

  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedExamForm, setSelectedExamForm] = useState<string>('');
  const [selectedTrialModel, setSelectedTrialModel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isProcessingFile2Col, setIsProcessingFile2Col] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');
  const [importExamForm, setImportExamForm] = useState<string>('Model_1');
  const [pasteText, setPasteText] = useState('');

  // حالات التعديل والحذف
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [requestDeleteQuestion, setRequestDeleteQuestion] = useState<Question | null>(null);

  // حالات نماذج ثالث ثانوي
  const [isAddFormDialogOpen, setIsAddFormDialogOpen] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormPosition, setNewFormPosition] = useState<number>(16);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [editingFormName, setEditingFormName] = useState('');
  const [confirmDeleteFormId, setConfirmDeleteFormId] = useState<string | null>(null);

  // حالات البحث والاستبدال الجماعي
  const [isBulkReplaceOpen, setIsBulkReplaceOpen] = useState(false);
  const [brSearchTerm, setBrSearchTerm] = useState('');
  const [brReplaceTerm, setBrReplaceTerm] = useState('');
  const [brPreviewResults, setBrPreviewResults] = useState<{ id: string; fields: string[] }[]>([]);
  const [brIsPreviewing, setBrIsPreviewing] = useState(false);
  const [brIsApplying, setBrIsApplying] = useState(false);
  const [brDone, setBrDone] = useState(false);

  const [formData, setFormData] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D', hint: '', explanation: '', exam_year: '', exam_form: 'General',
  });

  // معالجة PDF
  const processPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let allLines: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      if (textContent.items.length === 0) {
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport, canvas } as any).promise;
        const { data: { text } } = await Tesseract.recognize(canvas, "ara");
        allLines.push(...text.split("\n").filter(l => l.trim()));
        continue;
      }

      // تجميع الكلمات مع إحداثياتها
      interface WordItem { text: string; x: number; y: number; }
      const wordItems: WordItem[] = [];
      for (const item of textContent.items as any[]) {
        if (!item.str?.trim()) continue;
        wordItems.push({ text: item.str.trim(), x: item.transform[4], y: item.transform[5] });
      }

      // تجميع في أسطر
      const linesMap = new Map<number, WordItem[]>();
      for (const w of wordItems) {
        const yKey = Math.round(w.y / 3) * 3;
        if (!linesMap.has(yKey)) linesMap.set(yKey, []);
        linesMap.get(yKey)!.push(w);
      }

      // ترتيب أسطر الصفحة من أعلى لأسفل، والكلمات RTL
      const sortedYKeys = Array.from(linesMap.keys()).sort((a, b) => b - a);
      const pageRawLines: string[] = [];

      for (const yKey of sortedYKeys) {
        const lineWords = linesMap.get(yKey)!;
        lineWords.sort((a, b) => b.x - a.x);
        const lineText = lineWords.map(w => w.text).join(" ");

        // 1. تحويل (10 ... أو (1 ... → 10) ... / 1) ...
        const fixed = lineText.replace(/^\((\d{1,2})\s+/, "$1) ");

        // 2. حذف footer "الصفحة N / M" بكلا الصيغتين (Presentation Forms أو Unicode عادي)
        const cleanFixed = fixed.replace(/[\u0600-\u06FF\uFE70-\uFEFF]+\s+\d+\s*\/\s*\d+/g, "").trim();
        if (!cleanFixed) continue;
        if (/TCPDF|tcpdf|www\.tcpdf/i.test(cleanFixed)) continue;

        pageRawLines.push(cleanFixed);
      }

      // 3. حذف header: ابقِ من أول سطر يبدأ بـ رقم)
      let startIdx = 0;
      for (let i = 0; i < pageRawLines.length; i++) {
        if (/^\d+\)\s/.test(pageRawLines[i].trim())) { startIdx = i; break; }
      }

      // 4. دمج سطور الامتداد (لا تبدأ بـ رقم) مع السطر السابق
      const pageLines = pageRawLines.slice(startIdx);
      const merged: string[] = [];
      for (const line of pageLines) {
        const t = line.trim();
        if (!t) continue;
        const isNewLine = /^\d+\)/.test(t);
        if (!isNewLine && merged.length > 0) {
          merged[merged.length - 1] += " " + t;
        } else {
          merged.push(t);
        }
      }

      allLines.push(...merged);
    }

    return normalizeArabicPresentationForms(allLines.join("\n"));
  };

  // ========== معالجة PDF ذو العمودين (يدعم التظليل + الخيارات المنفصلة + الكشف التلقائي للعمود) ==========
  const parsePDFTwoColumnQuestions = async (file: File): Promise<any[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allQuestions: any[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      if (textContent.items.length === 0) continue;

      const pageH = page.getViewport({ scale: 1 }).height;

      // ── استخراج الكلمات: نص + إحداثيات (top/x) + عرض + كشف اللون الأبيض ──
      const words: ParserWord[] = [];
      for (const item of textContent.items as any[]) {
        const raw = item.str || '';
        const s = raw.trim();
        if (!s) {
          // عنصر مسافة صريح من pdf.js: نحتفظ به كفاصل كلمات بدل إسقاطه (يمنع التصاق الكلمات)
          if (raw.length > 0) {
            words.push({ text: '', x: item.transform[4], top: pageH - item.transform[5], width: item.width || 0, space: true });
          }
          continue;
        }
        // استخراج لون النص إذا كان متاحاً (نص أبيض = غالباً على خلفية ملوّنة)
        let r = 0, g = 0, b = 0;
        if (item.color && Array.isArray(item.color)) {
          r = Math.round((item.color[0] ?? 0) * 255);
          g = Math.round((item.color[1] ?? 0) * 255);
          b = Math.round((item.color[2] ?? 0) * 255);
        }
        const whiteText = r > 200 && g > 200 && b > 200;
        words.push({
          text: normalizeArabicPresentationForms(s),
          x: item.transform[4],
          top: pageH - item.transform[5],
          width: item.width || 0,
          h: item.height || Math.abs(item.transform[3]) || 0,
          highlighted: whiteText,
        });
      }

      // ── كشف مناطق التظليل (أزرق أو أخضر) عبر Canvas ──
      interface HighlightRect { top: number; bottom: number; x0: number; x1: number; }
      const highlightRects: HighlightRect[] = [];
      try {
        const SCALE = 2.0;
        const viewport = page.getViewport({ scale: SCALE });
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const isHighlight = (r: number, g: number, b: number, a: number) => {
          if (a < 20) return false;
          const isGreen = g > 100 && g > r * 1.4 && g > b * 1.4;
          const isLightGreen = g > 150 && r < 220 && b < 180 && g > r + 20 && g > b + 20;
          const isBlue  = b > r + 25 && b > g + 15 && b > 90 && r < 210 && g < 210;
          const isCyan  = g > 110 && b > 110 && r < 160 && Math.abs(g - b) < 70;
          return isGreen || isLightGreen || isBlue || isCyan;
        };

        type Run = { x0: number; x1: number };
        const rowRuns: Map<number, Run[]> = new Map();

        for (let y = 0; y < height; y++) {
          let runStart = -1;
          const runs: Run[] = [];
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (isHighlight(data[idx], data[idx+1], data[idx+2], data[idx+3])) {
              if (runStart === -1) runStart = x;
            } else {
              if (runStart !== -1) {
                if (x - runStart >= 4) runs.push({ x0: runStart, x1: x - 1 });
                runStart = -1;
              }
            }
          }
          if (runStart !== -1 && width - runStart >= 4) runs.push({ x0: runStart, x1: width - 1 });
          if (runs.length) rowRuns.set(y, runs);
        }

        const used = new Set<number>();
        for (const [y, runs] of Array.from(rowRuns.entries()).sort((a, b) => a[0] - b[0])) {
          if (used.has(y)) continue;
          for (const run of runs) {
            let yEnd = y;
            for (let ny = y + 1; ny < y + 80; ny++) {
              const nr = rowRuns.get(ny);
              if (!nr) break;
              const overlap = nr.some(r => r.x0 <= run.x1 + 8 && r.x1 >= run.x0 - 8);
              if (!overlap) break;
              used.add(ny);
              yEnd = ny;
            }
            if (yEnd - y >= 1) {
              highlightRects.push({
                top:    y    / SCALE,
                bottom: yEnd / SCALE,
                x0:     run.x0 / SCALE,
                x1:     run.x1 / SCALE,
              });
            }
          }
          used.add(y);
        }
      } catch (_) { /* ignore */ }

      // ── ربط حالة التظليل بكل كلمة حسب موقعها داخل المستطيلات الملوّنة ──
      for (const w of words) {
        if (w.highlighted) continue;
        const xMax = w.x + (w.width || 0);
        for (const r of highlightRects) {
          if (w.top >= r.top - 12 && w.top <= r.bottom + 12 && xMax >= r.x0 - 12 && w.x <= r.x1 + 12) {
            w.highlighted = true;
            break;
          }
        }
      }

      // ── تحليل الأسئلة عبر الطبقة المشتركة ──
      const pageW = page.getViewport({ scale: 1 }).width;
      const pageQuestions = parseQuestionsFromWords(words, {
        pageWidth: pageW,
        log: (...a: any[]) => console.log(`[v0] 2col p${pageNum}`, ...a),
      });
      allQuestions.push(...pageQuestions);
    }

    console.log('[v0] 2col total questions:', allQuestions.length);
    return allQuestions;
  };

  const handleFileChange2Col = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({ title: 'تنبيه', description: 'يرجى اختيار ملف PDF فقط.', variant: 'destructive' });
      return;
    }
    setIsProcessingFile2Col(true);
    try {
      const extracted = await parsePDFTwoColumnQuestions(file);
      if (extracted.length > 0) {
        setPreviewQuestions(extracted);
        setImportExamForm(
          selectedExamForm === 'Trial'
            ? (selectedTrialModel !== 'all' ? selectedTrialModel : 'Model_1')
            : (selectedExamForm || 'General')
        );
        setIsFileUploadOpen(false);
        setIsPreviewOpen(true);
      } else {
        toast({ title: 'تنبيه', description: 'لم يتم العثور على أسئلة. تأكد أن الملف بتخطيط عمودين مع مستطيل أخضر للإجابة الصحيحة.', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'خطأ', description: 'حدثت مشكلة أثناء معالجة الملف.', variant: 'destructive' });
    } finally {
      setIsProcessingFile2Col(false);
      if (fileInputRef2Col.current) fileInputRef2Col.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    try {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        const textContent = await file.text();
        const jsonData = JSON.parse(textContent);

        if (Array.isArray(jsonData)) {
          const mappedQuestions = jsonData.map((q: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            question_text: q.question_text || "",
            option_a: q.option_a || "",
            option_b: q.option_b || "",
            option_c: q.option_c || "",
            option_d: q.option_d || "",
            correct_option: q.correct_option || "A",
            exam_form: q.exam_form || "General",
            hint: q.hint || "",
            explanation: q.explanation || "",
            count: 4
          }));

          if (mappedQuestions.length > 0) {
            setPreviewQuestions(mappedQuestions);
            setImportExamForm(
              selectedExamForm === 'Trial'
                ? (selectedTrialModel !== 'all' ? selectedTrialModel : 'Model_1')
                : (selectedExamForm || 'General')
            );
            setIsFileUploadOpen(false);
            setIsPreviewOpen(true);
          } else {
            toast({ title: 'تنبيه', description: 'ملف JSON فارغ أو غير صالح.', variant: 'destructive' });
          }
        } else {
          toast({ title: 'تنبيه', description: 'صيغة ملف JSON غير صحيحة (يجب أن يكون مصفوفة).', variant: 'destructive' });
        }
      } else {
      const content = file.type === "application/pdf"
        ? await processPDF(file)
        : await file.text();
        const extracted = parseSanaaLegalContent(content);
        if (extracted.length > 0) {
          setPreviewQuestions(extracted);
          setImportExamForm(
            selectedExamForm === 'Trial'
              ? (selectedTrialModel !== 'all' ? selectedTrialModel : 'Model_1')
              : (selectedExamForm || 'General')
          );
          setIsFileUploadOpen(false);
          setIsPreviewOpen(true);
        } else {
          toast({ title: 'تنبيه', description: 'لم يتم العثور على أسئلة.', variant: 'destructive' });
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'خطأ', description: 'حدثت مشكلة أثناء المعالجة.', variant: 'destructive' });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // معالجة النص الملصق مباشرة
  const handlePasteText = () => {
    if (!pasteText.trim()) return;
    const extracted = parseSanaaLegalContent(pasteText);
    if (extracted.length > 0) {
      setPreviewQuestions(extracted);
      setImportExamForm(
        selectedExamForm === 'Trial'
          ? (selectedTrialModel !== 'all' ? selectedTrialModel : 'Model_1')
          : (selectedExamForm || 'General')
      );
      setIsFileUploadOpen(false);
      setIsPreviewOpen(true);
      setPasteText('');
    } else {
      toast({ title: 'تنبيه', description: 'لم يتم العثور على أسئلة. تأكد من الصيغة الصحيحة.', variant: 'destructive' });
    }
  };

  const { data: levels = [] } = useQuery({ queryKey: ['levels'], queryFn: async () => (await supabase.from('levels').select('*').order('order_index')).data as Level[] });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects', selectedLevel], queryFn: async () => { let q = supabase.from('subjects').select('*').order('order_index'); if(selectedLevel) q = q.eq('level_id', selectedLevel); return (await q).data as Subject[]; } });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', selectedSubject, selectedYear, selectedExamForm, selectedTrialModel],
    queryFn: async () => {
      let query = supabase.from('questions').select('*').eq('status', 'active').order('created_at', { ascending: false });
      if (selectedSubject) query = query.eq('subject_id', selectedSubject);
      if (selectedExamForm === 'Trial') {
        query = query.is('exam_year', null);
        if (selectedTrialModel && selectedTrialModel !== 'all') {
          query = query.eq('exam_form', selectedTrialModel);
        }
      } else {
        if (selectedYear) query = query.eq('exam_year', parseInt(selectedYear));
        if (selectedExamForm) query = query.eq('exam_form', selectedExamForm);
      }
      const { data } = await query;
      return data as Question[];
    },
    enabled: !!selectedSubject,
  });

  // --- منطق النماذج (أسئلة تجريبية لجميع المستويات) ---
  const isTrialSelected = selectedExamForm === 'Trial';


  const { data: customForms = [] } = useQuery({
    queryKey: ['subject-exam-forms', selectedSubject],
    queryFn: async () => {
      const { data } = await (supabase.from('subject_exam_forms' as any) as any)
        .select('*')
        .eq('subject_id', selectedSubject)
        .order('order_index');
      return (data || []) as { id: string; form_id: string; form_name: string; order_index: number; hidden?: boolean }[];
    },
    enabled: isTrialSelected && !!selectedSubject,
  });

  const addFormMutation = useMutation({
    mutationFn: async ({ name, position }: { name: string; position: number }) => {
      const formId = name.replace(/\s+/g, '_') + '_' + Date.now().toString(36);
      const { error } = await (supabase.from('subject_exam_forms' as any) as any).insert({
        subject_id: selectedSubject,
        form_id: formId,
        form_name: name,
        order_index: position,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-exam-forms'] });
      setNewFormName('');
      setNewFormPosition(16);
      toast({ title: 'تمت إضافة النموذج ✅' });
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' }),
  });

  // حذف نموذج: للنماذج الافتراضية (Model_1..15) يتم إخفاؤها عبر إدراج/تحديث صف override
  // للنماذج المخصصة يتم حذف الصف نهائياً
  const deleteFormMutation = useMutation({
    mutationFn: async ({ rowId, formId, isDefault }: { rowId: string | null; formId: string; isDefault: boolean }) => {
      if (isDefault) {
        if (rowId) {
          const { error } = await (supabase.from('subject_exam_forms' as any) as any)
            .update({ hidden: true })
            .eq('id', rowId);
          if (error) throw error;
        } else {
          const orderIndex = parseInt(formId.replace('Model_', '')) || 1;
          const { error } = await (supabase.from('subject_exam_forms' as any) as any).insert({
            subject_id: selectedSubject,
            form_id: formId,
            form_name: toArabicOrdinal(orderIndex),
            order_index: orderIndex,
            hidden: true,
            created_by: user?.id,
          });
          if (error) throw error;
        }
      } else {
        if (!rowId) return;
        const { error } = await (supabase.from('subject_exam_forms' as any) as any).delete().eq('id', rowId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-exam-forms'] });
      toast({ title: 'تم حذف النموذج 🗑️' });
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' }),
  });

  // إعادة تسمية: للافتراضية ننشئ/نحدّث صف override، للمخصصة نحدّث الاسم مباشرة
  const renameFormMutation = useMutation({
    mutationFn: async ({ rowId, formId, isDefault, newName }: { rowId: string | null; formId: string; isDefault: boolean; newName: string }) => {
      if (rowId) {
        const { error } = await (supabase.from('subject_exam_forms' as any) as any)
          .update({ form_name: newName })
          .eq('id', rowId);
        if (error) throw error;
      } else if (isDefault) {
        const orderIndex = parseInt(formId.replace('Model_', '')) || 1;
        const { error } = await (supabase.from('subject_exam_forms' as any) as any).insert({
          subject_id: selectedSubject,
          form_id: formId,
          form_name: newName,
          order_index: orderIndex,
          hidden: false,
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-exam-forms'] });
      toast({ title: 'تم تحديث الاسم ✏️' });
      setEditingFormId(null);
      setEditingFormName('');
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' }),
  });

  const showFormMutation = useMutation({
    mutationFn: async ({ rowId }: { rowId: string }) => {
      const { error } = await (supabase.from('subject_exam_forms' as any) as any)
        .update({ hidden: false })
        .eq('id', rowId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-exam-forms'] });
      toast({ title: 'تم إظهار النموذج ✅' });
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' }),
  });

  const reorderFormMutation = useMutation({
    mutationFn: async ({ id, direction, currentIndex }: { id: string; direction: 'up' | 'down'; currentIndex: number }) => {
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 1) return;
      const { error } = await (supabase.from('subject_exam_forms' as any) as any)
        .update({ order_index: newIndex })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-exam-forms'] });
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' }),
  });

  // قائمة موحّدة لكل النماذج التجريبية مع معلومات الـ override
  // كل عنصر: { id, name, order_index, isDefault, rowId, hidden }
  const allTrialForms = useMemo(() => {
    const overridesByFormId = new Map<string, any>();
    customForms.forEach((f: any) => overridesByFormId.set(f.form_id, f));

    const items: { id: string; name: string; order_index: number; isDefault: boolean; rowId: string | null; hidden: boolean }[] = [];

    // الافتراضية مع تطبيق overrides
    for (let i = 1; i <= 15; i++) {
      const formId = `Model_${i}`;
      const override = overridesByFormId.get(formId);
      if (override) {
        items.push({
          id: formId,
          name: override.form_name,
          order_index: override.order_index ?? i,
          isDefault: true,
          rowId: override.id,
          hidden: !!override.hidden,
        });
        overridesByFormId.delete(formId);
      } else {
        items.push({ id: formId, name: toArabicOrdinal(i), order_index: i, isDefault: true, rowId: null, hidden: false });
      }
    }

    // المخصصة المتبقية
    overridesByFormId.forEach((f: any) => {
      items.push({
        id: f.form_id,
        name: f.form_name,
        order_index: f.order_index,
        isDefault: false,
        rowId: f.id,
        hidden: !!f.hidden,
      });
    });

    return items.sort((a, b) => a.order_index - b.order_index);
  }, [customForms]);

  const activeExamForms = useMemo(() => {
    if (!isTrialSelected) return EXAM_FORMS;
    // الفلتر/Selects تعرض النماذج غير المخفية فقط
    return allTrialForms.filter(f => !f.hidden).map(({ id, name }) => ({ id, name }));
  }, [isTrialSelected, allTrialForms]);

  // --- حفظ جماعي ---
  const bulkSave = useMutation({
    mutationFn: async (list: any[]) => {
      if (!selectedSubject) throw new Error("اختر المادة أولاً");
      if (!user?.id) throw new Error("سجل دخولك");

      const formatted = list.map(q => ({
        subject_id: selectedSubject,
        question_text: q.question_text || "سؤال",
        option_a: q.option_a || "",
        option_b: q.option_b || "",
        option_c: q.option_c || "",
        option_d: q.option_d || "",
        correct_option: q.correct_option || 'A',
        hint: q.hint || null,
        explanation: q.explanation || null,
        exam_year: (importExamForm === 'Trial') ? null : (selectedYear ? parseInt(selectedYear) : null),
        exam_form: importExamForm,
        created_by: user.id,
        status: 'active' as const
      }));

      // المحرر: إرسال طلب إضافة بدلاً من الحفظ المباشر
      if (isEditor && !isAdmin) {
        const { error } = await supabase.from('deletion_requests').insert({
          request_type: 'add',
          requested_by: user.id,
          status: 'pending',
          reason: 'طلب إضافة أسئلة من المحرر',
          question_data: { questions: formatted, subject_id: selectedSubject, exam_year: (importExamForm === 'Trial') ? null : (selectedYear ? parseInt(selectedYear) : null), exam_form: importExamForm },
        });
        if (error) throw error;
        return null;
      }

      const { data, error } = await supabase.from('questions').insert(formatted).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
      toast({ title: (isEditor && !isAdmin) ? 'تم إرسال طلب الإضافة للمسؤل ✅' : '✅ تم الحفظ بنجاح', description: (isEditor && !isAdmin) ? 'سيتم مراجعته والموافقة عليه' : `تمت إضافة ${previewQuestions.length} سؤال.` });
      setIsPreviewOpen(false); setPreviewQuestions([]);
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
  });

  // --- حفظ فردي (إضافة/تعديل) ---
  const saveSingleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!selectedSubject) throw new Error("اختر المادة");
      const payload = {
        subject_id: selectedSubject,
        question_text: data.question_text,
        option_a: data.option_a || "",
        option_b: data.option_b || "",
        option_c: data.option_c || "",
        option_d: data.option_d || "",
        correct_option: data.correct_option,
        hint: data.hint?.trim() || null,
        explanation: data.explanation?.trim() || null,
        exam_year: (data.exam_year && data.exam_year !== 'trial') ? parseInt(data.exam_year) : null,
        exam_form: data.exam_form || 'General',
        created_by: user?.id,
        status: 'active' as const
      };

      // المحرر يعدّل سؤال موجود → إرسال طلب تعديل
      if (editingQuestion && isEditor && !isAdmin) {
        const { error } = await supabase.from('deletion_requests').insert({
          request_type: 'edit',
          requested_by: user?.id,
          status: 'pending',
          reason: 'طلب تعديل سؤال من المحرر',
          target_question_id: editingQuestion.id,
          question_data: payload,
        });
        if (error) throw error;
        return;
      }

      if (editingQuestion) {
        const { error } = await supabase.from('questions').update(payload).eq('id', editingQuestion.id);
        if (error) throw error;
      } else {
        // المحرر يضيف سؤال فردي → إرسال طلب إضافة
        if (isEditor && !isAdmin) {
          const { error } = await supabase.from('deletion_requests').insert({
            request_type: 'add',
            requested_by: user?.id,
            status: 'pending',
            reason: 'طلب إضافة سؤال من المحرر',
            question_data: { questions: [payload], subject_id: selectedSubject, exam_year: payload.exam_year, exam_form: payload.exam_form },
          });
          if (error) throw error;
          return;
        }
        const { error } = await supabase.from('questions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
      const isEditorRequest = isEditor && !isAdmin;
      const msg = isEditorRequest
        ? (editingQuestion ? 'تم إرسال طلب التعديل للمسؤل ✅' : 'تم إرسال طلب الإضافة للمسؤل ✅')
        : (editingQuestion ? 'تم التعديل ✅' : 'تمت الإضافة ✅');
      toast({ title: msg });
      setIsDialogOpen(false); setEditingQuestion(null);
      setFormData({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', hint: '', explanation: '', exam_year: '', exam_form: 'General' });
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
  });

  // --- حذف منطقي عبر RPC ---
  const softDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      requireAdminOrEditor();
      if (!ids.length) return 0;

      const { data, error } = await supabase.rpc('soft_delete_questions', { p_ids: ids });

      if (error) throw error;
      return data as number;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['questions'] });
      const previous = queryClient.getQueriesData<Question[]>({ queryKey: ['questions'] });

      queryClient.setQueriesData<Question[]>({ queryKey: ['questions'] }, (old) => {
        if (!old) return old as any;
        return old.filter((q) => !ids.includes(q.id));
      });

      return { previous };
    },
    onError: (err: any, _ids, ctx) => {
      if (ctx?.previous) {
        ctx.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }

      const friendly = getFriendlyError(err);
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });

      if (err?.code === 'AUTH_REQUIRED') {
        navigate('/admin/login');
      }
    },
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: `تم حذف ${ids.length} سؤال ✅` });

      if (ids.length > 1) {
        setSelectedIds([]);
        setIsBulkDeleteDialogOpen(false);
      }
      setDeleteQuestion(null);
    },
  });

  // --- طلب حذف من المحرر (يحتاج موافقة المسؤل) ---
  const requestDeleteMutation = useMutation({
    mutationFn: async (question: Question) => {
      const { error } = await supabase.from('deletion_requests').insert({
        question_id: question.id,
        requested_by: user?.id,
        status: 'pending',
        reason: 'طلب حذف من المحرر',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم إرسال طلب الحذف للمسؤل ✅', description: 'سيتم مراجعته والموافقة عليه' });
      setRequestDeleteQuestion(null);
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  // ─── منطق البحث والاستبدال الجماعي ───
  const REPLACEABLE_FIELDS = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'hint', 'explanation'] as const;

  const handleBrPreview = () => {
    if (!brSearchTerm.trim()) return;
    setBrIsPreviewing(true);
    const results = questions
      .map(q => {
        const matchedFields = REPLACEABLE_FIELDS.filter(f => (q as any)[f]?.includes(brSearchTerm));
        return matchedFields.length ? { id: q.id, fields: matchedFields } : null;
      })
      .filter(Boolean) as { id: string; fields: string[] }[];
    setBrPreviewResults(results);
    setBrIsPreviewing(false);
    setBrDone(false);
  };

  const handleBrApply = async () => {
    if (!brPreviewResults.length) return;
    setBrIsApplying(true);
    try {
      const idsToUpdate = brPreviewResults.map(r => r.id);
      const questionsToUpdate = questions.filter(q => idsToUpdate.includes(q.id));

      const updates = questionsToUpdate.map(q => {
        const patch: Record<string, string> = {};
        REPLACEABLE_FIELDS.forEach(f => {
          const val = (q as any)[f];
          if (val?.includes(brSearchTerm)) {
            patch[f] = val.split(brSearchTerm).join(brReplaceTerm);
          }
        });
        return supabase.from('questions').update(patch).eq('id', q.id);
      });

      await Promise.all(updates.map(p => p));
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setBrDone(true);
      setBrPreviewResults([]);
      toast({ title: `✅ تم التحديث`, description: `تم معالجة ${idsToUpdate.length} سؤال بنجاح.` });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setBrIsApplying(false);
    }
  };

  const handleBrClose = () => {
    setIsBulkReplaceOpen(false);
    setBrSearchTerm('');
    setBrReplaceTerm('');
    setBrPreviewResults([]);
    setBrDone(false);
  };

  const toggleSelectAll = () => selectedIds.length === filteredQuestions.length ? setSelectedIds([]) : setSelectedIds(filteredQuestions.map(q => q.id));
  const toggleSelectOne = (id: string) => selectedIds.includes(id) ? setSelectedIds(prev => prev.filter(x => x !== id)) : setSelectedIds(prev => [...prev, id]);

  const filteredQuestions = useMemo(() => {
    const s = searchQuery.trim();
    if (!s) return questions;
    return questions.filter(q =>
      q.question_text?.includes(s) ||
      q.option_a?.includes(s) ||
      q.option_b?.includes(s) ||
      q.option_c?.includes(s) ||
      q.option_d?.includes(s) ||
      q.hint?.includes(s) ||
      (q as any).explanation?.includes(s)
    );
  }, [questions, searchQuery]);

  return (
    <AdminLayout>
      <AdminSEO pageName="إدارة الأسئلة" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 font-cairo">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة بنك الأسئلة</h1>
            <p className="text-sm text-slate-500 font-medium">العدد الكلي: {filteredQuestions.length} سؤال</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && isAdmin && (
              <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)} className="gap-2 animate-in fade-in zoom-in">
                <Trash2 className="w-4 h-4" /> حذف المحدد ({selectedIds.length})
              </Button>
            )}
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!filteredQuestions.length) return;
                  const _subjectNameJson = subjects.find(s => s.id === selectedSubject)?.name || 'بنك الأسئلة';

                  // ========== كل السنوات + نموذج محدد → ملف منفصل لكل سنة ==========
                  if (!selectedYear && !isTrialSelected) {
                    // جمع السنوات الموجودة فعلاً في البيانات
                    const yearsInData = Array.from(new Set(filteredQuestions.map(q => q.exam_year).filter(Boolean))).sort((a, b) => (a as number) - (b as number)) as number[];
                    if (yearsInData.length === 0) {
                      // لا توجد أسئلة مرتبطة بسنوات — تصدير ملف واحد
                    } else {
                      // بناء مجموعات التصدير
                      const groups: { year: number; formName: string; questions: typeof filteredQuestions }[] = [];

                      if (selectedExamForm) {
                        // نموذج محدد → ملف واحد لكل سنة
                        const _formNameJson = EXAM_FORMS.find(f => f.id === selectedExamForm)?.name || selectedExamForm;
                        yearsInData.forEach(year => {
                          const yearQuestions = filteredQuestions.filter(q => q.exam_year === year);
                          if (yearQuestions.length) groups.push({ year, formName: _formNameJson, questions: yearQuestions });
                        });
                      } else {
                        // كل النماذج → ملف لكل (سنة + نموذج)
                        yearsInData.forEach(year => {
                          const yearQuestions = filteredQuestions.filter(q => q.exam_year === year);
                          const formsInYear = Array.from(new Set(yearQuestions.map(q => (q as any).exam_form).filter(Boolean)));
                          formsInYear.forEach(formId => {
                            const formQuestions = yearQuestions.filter(q => (q as any).exam_form === formId);
                            const formName = EXAM_FORMS.find(f => f.id === formId)?.name || formId;
                            if (formQuestions.length) groups.push({ year, formName, questions: formQuestions });
                          });
                        });
                      }

                      groups.forEach(({ year, formName, questions: grpQuestions }) => {
                        const exportData = grpQuestions.map(q => ({
                          question_text: q.question_text,
                          option_a: q.option_a,
                          option_b: q.option_b,
                          option_c: q.option_c,
                          option_d: q.option_d,
                          correct_option: q.correct_option,
                          hint: (q as any).hint || '',
                          explanation: (q as any).explanation || '',
                          exam_year: q.exam_year || '',
                          exam_form: (q as any).exam_form || 'General',
                        }));
                        const filename = [_subjectNameJson, year.toString(), formName].filter(Boolean).join(' - ');
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${filename}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      });

                      toast({ title: `✅ تم تصدير ${groups.length} ملف JSON`, description: `ملف منفصل لكل سنة ونموذج: ${yearsInData.join('، ')}` });
                      return;
                    }
                  }

                  // ========== الحالة العادية: سنة محددة أو نماذج تجريبية → ملف واحد ==========
                  const exportData = filteredQuestions.map(q => ({
                    question_text: q.question_text,
                    option_a: q.option_a,
                    option_b: q.option_b,
                    option_c: q.option_c,
                    option_d: q.option_d,
                    correct_option: q.correct_option,
                    hint: (q as any).hint || '',
                    explanation: (q as any).explanation || '',
                    exam_year: q.exam_year || '',
                    exam_form: (q as any).exam_form || 'General',
                  }));
                  const _yearJson = selectedYear ? `${selectedYear}` : 'كل السنوات';
                  const _formNameJson = isTrialSelected
                    ? (allTrialForms.find(f => f.id === selectedTrialModel)?.name || 'أسئلة تجريبية')
                    : (EXAM_FORMS.find(f => f.id === selectedExamForm)?.name || '');
                  const _jsonFilename = [_subjectNameJson, _yearJson, _formNameJson].filter(Boolean).join(' - ');
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${_jsonFilename}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={!selectedSubject || !filteredQuestions.length}
                className="gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold shadow-sm hover:bg-emerald-100"
              >
                <FileText className="w-4 h-4" /> تصدير JSON
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!filteredQuestions.length) return;

                  const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'بنك الأسئلة';

                  // دالة مساعدة لبناء HTML لمجموعة أسئلة
                  const buildHtml = (qs: Question[], yearLabel: string) => {
                  const total = qs.length;

                  const questionsJson = JSON.stringify(qs.map(q => ({
                    question_text: q.question_text,
                    option_a: q.option_a,
                    option_b: q.option_b,
                    option_c: q.option_c,
                    option_d: q.option_d,
                    correct_option: q.correct_option,
                    hint: (q as any).hint || '',
                    explanation: (q as any).explanation || '',
                  })));

                  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>بنك أسئلة – ${subjectName} – منصة الناصر القانونية</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  :root{--primary:#4f46e5;--primary-light:#ede9fe;--emerald:#059669;--emerald-light:#d1fae5;--amber-light:#fef3c7;--slate-50:#f8fafc;--slate-100:#f1f5f9;--slate-200:#e2e8f0;--slate-400:#94a3b8;--slate-600:#475569;--slate-700:#334155;--slate-900:#0f172a;--white:#fff;--radius:16px;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Cairo',sans-serif;background:var(--slate-50);color:var(--slate-900);min-height:100vh;}
  .platform-banner{background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%);position:sticky;top:0;z-index:100;box-shadow:0 4px 24px rgba(79,70,229,.35);}
  .platform-banner-inner{max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:14px 24px;gap:16px;}
  .platform-brand{display:flex;align-items:center;gap:12px;text-decoration:none;transition:opacity .2s;}
  .platform-brand:hover{opacity:.85;}
  .platform-logo{width:44px;height:44px;background:rgba(255,255,255,.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;border:1.5px solid rgba(255,255,255,.25);flex-shrink:0;}
  .platform-name{display:flex;flex-direction:column;}
  .platform-name span:first-child{font-size:17px;font-weight:900;color:#fff;letter-spacing:-.3px;line-height:1.2;}
  .platform-name span:last-child{font-size:11px;font-weight:600;color:rgba(255,255,255,.65);}
  .platform-cta{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.3);color:#fff;font-family:'Cairo',sans-serif;font-weight:800;font-size:13px;padding:8px 18px;border-radius:10px;text-decoration:none;cursor:pointer;transition:all .2s;white-space:nowrap;}
  .platform-cta:hover{background:rgba(255,255,255,.25);transform:translateY(-1px);}
  .page-header{background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 24px 32px;}
  .page-header-inner{max-width:960px;margin:0 auto;}
  .page-header h1{font-size:26px;font-weight:900;color:#fff;margin-bottom:6px;}
  .page-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:12px;}
  .meta-chip{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.25);color:#fff;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;}
  .score-bar{position:sticky;top:72px;z-index:50;background:var(--white);border-bottom:1.5px solid var(--slate-100);display:none;padding:12px 24px;box-shadow:0 2px 10px rgba(0,0,0,.06);}
  .score-bar.show{display:flex;}
  .score-bar-inner{max-width:960px;margin:0 auto;width:100%;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
  .score-chip{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:800;}
  .score-chip.c{background:var(--emerald-light);color:#065f46;}
  .score-chip.w{background:#fee2e2;color:#991b1b;}
  .score-chip.t{background:var(--primary-light);color:#3730a3;}
  .score-progress{flex:1;height:8px;background:var(--slate-100);border-radius:99px;overflow:hidden;min-width:80px;}
  .score-progress-fill{height:100%;background:linear-gradient(90deg,#4f46e5,#7c3aed);border-radius:99px;transition:width .4s ease;width:0%;}
  .reset-btn{padding:6px 14px;border-radius:20px;border:2px solid var(--slate-200);background:var(--white);font-family:'Cairo',sans-serif;font-weight:800;font-size:12px;color:var(--slate-600);cursor:pointer;transition:all .2s;}
  .reset-btn:hover{border-color:var(--primary);color:var(--primary);}
  .toolbar{max-width:960px;margin:0 auto;padding:20px 24px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .mode-toggle{display:flex;background:var(--white);border:2px solid var(--slate-200);border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);}
  .mode-btn{padding:9px 20px;font-family:'Cairo',sans-serif;font-weight:800;font-size:13px;border:none;cursor:pointer;transition:all .2s;color:var(--slate-600);background:transparent;display:flex;align-items:center;gap:7px;}
  .mode-btn.active{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:9px;}
  .spacer{flex:1;}
  .print-btn{display:inline-flex;align-items:center;gap:8px;background:var(--white);border:2px solid var(--slate-200);color:var(--slate-700);font-family:'Cairo',sans-serif;font-weight:800;font-size:13px;padding:9px 18px;border-radius:11px;cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,.06);}
  .print-btn:hover{border-color:var(--primary);color:var(--primary);}
  .main{max-width:960px;margin:0 auto;padding:24px 24px 60px;}
  .question-card{background:var(--white);border-radius:var(--radius);border:1.5px solid var(--slate-200);margin-bottom:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.05);transition:box-shadow .2s;}
  .question-card:hover{box-shadow:0 4px 20px rgba(79,70,229,.1);}
  .question-header{display:flex;align-items:flex-start;gap:14px;padding:20px 22px 16px;border-bottom:1px solid var(--slate-100);}
  .q-num{min-width:38px;height:38px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:14px;font-weight:900;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .q-text{font-size:16px;font-weight:700;color:var(--slate-900);line-height:1.7;flex:1;padding-top:6px;}
  .options-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px 22px 20px;}
  .opt-review{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:11px;border:1.5px solid var(--slate-200);font-size:14px;font-weight:600;color:var(--slate-700);background:var(--slate-50);}
  .opt-review.correct{background:var(--emerald-light);border-color:#6ee7b7;color:#065f46;}
  .opt-badge{min-width:28px;height:28px;border-radius:8px;background:var(--slate-200);color:var(--slate-600);font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .opt-review.correct .opt-badge{background:var(--emerald);color:#fff;}
  .correct-tag{margin-right:auto;font-size:12px;font-weight:800;color:#059669;}
  .opt-interactive{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:11px;border:2px solid var(--slate-200);font-size:14px;font-weight:600;color:var(--slate-700);background:var(--white);cursor:pointer;transition:all .18s;user-select:none;}
  .opt-interactive:hover{border-color:#a5b4fc;background:#eef2ff;color:var(--primary);}
  .opt-interactive.sc{background:var(--emerald-light);border-color:var(--emerald);color:#065f46;}
  .opt-interactive.sw{background:#fee2e2;border-color:#fca5a5;color:#991b1b;}
  .opt-interactive.rc{background:var(--emerald-light);border-color:var(--emerald);color:#065f46;}
  .opt-radio{width:20px;height:20px;border-radius:50%;border:2px solid var(--slate-300);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .18s;}
  .opt-interactive.sc .opt-radio,.opt-interactive.sw .opt-radio,.opt-interactive.rc .opt-radio{border-color:currentColor;}
  .opt-radio-inner{width:10px;height:10px;border-radius:50%;background:currentColor;opacity:0;transition:opacity .15s;}
  .opt-interactive.sc .opt-radio-inner,.opt-interactive.sw .opt-radio-inner,.opt-interactive.rc .opt-radio-inner{opacity:1;}
  .hint-box{margin:0 22px 16px;padding:14px 18px;background:var(--amber-light);border:1.5px solid #fcd34d;border-radius:11px;font-size:13px;font-weight:600;color:#92400e;display:none;gap:8px;align-items:flex-start;line-height:1.75;white-space:pre-line;}
  .hint-box.show{display:flex;}
  .hint-toggle{display:flex;align-items:center;justify-content:flex-end;gap:6px;padding:0 22px 14px;cursor:pointer;font-family:\'Cairo\',sans-serif;font-size:13px;font-weight:800;color:var(--primary);user-select:none;transition:color .2s;}
  .hint-toggle:hover{color:#7c3aed;}
  .hint-toggle .arrow{display:inline-block;transition:transform .25s;font-size:11px;}
  .hint-toggle.open .arrow{transform:rotate(180deg);}
  .explanation-box{margin:0 22px 20px;border-radius:14px;overflow:hidden;display:none;direction:rtl;}
  .explanation-box.show{display:block;}
  .explanation-header{background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:14px 18px;display:flex;align-items:center;gap:10px;}
  .explanation-header-icon{width:32px;height:32px;background:rgba(255,255,255,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
  .explanation-header-title{font-size:14px;font-weight:900;color:#fff;letter-spacing:-.2px;}
  .explanation-header-sub{font-size:11px;font-weight:600;color:rgba(255,255,255,.7);margin-top:1px;}
  .explanation-body{background:#fafbff;border:1.5px solid #e0e7ff;border-top:none;padding:18px 20px;font-size:13.5px;font-weight:600;color:#1e1b4b;line-height:1.9;white-space:pre-wrap;border-radius:0 0 14px 14px;}
  .explanation-toggle{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:0 22px 16px;cursor:pointer;font-family:\'Cairo\',sans-serif;font-size:13px;font-weight:800;color:#4f46e5;user-select:none;transition:all .2s;border:none;background:none;width:100%;}
  .explanation-toggle:hover{color:#7c3aed;}
  .explanation-toggle .et-arrow{display:inline-block;transition:transform .28s;font-size:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .explanation-toggle.open .et-arrow{transform:rotate(180deg);}
  .page-footer{background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:32px 24px;margin-top:40px;text-align:center;}
  .footer-inner{max-width:960px;margin:0 auto;}
  .footer-logo{font-size:22px;font-weight:900;color:#fff;margin-bottom:6px;}
  .footer-credit{font-size:14px;font-weight:700;color:rgba(255,255,255,.75);margin-bottom:4px;}
  .footer-sub{font-size:12px;font-weight:600;color:rgba(255,255,255,.45);margin-bottom:20px;}
  .footer-link{display:inline-flex;align-items:center;gap:8px;padding:9px 22px;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.25);border-radius:10px;color:#fff;font-family:'Cairo',sans-serif;font-weight:800;font-size:13px;text-decoration:none;transition:all .2s;}
  .footer-link:hover{background:rgba(255,255,255,.25);}
  @media print{
    body{background:#fff;}
    .platform-banner,.toolbar,.score-bar,.page-footer{display:none!important;}
    .opt-interactive{border:1.5px solid #ccc!important;background:#fff!important;color:#000!important;cursor:default!important;}
    .question-card{box-shadow:none!important;break-inside:avoid;border:1px solid #ddd!important;}
    .page-header{background:#1e1b4b!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .main{padding:16px!important;}
    .opt-review.correct{background:#d1fae5!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .hint-box{display:none!important;}
    @page{margin:1.5cm;}
  }
  @media(max-width:640px){.options-grid{grid-template-columns:1fr;}.page-header h1{font-size:20px;}.platform-name span:first-child{font-size:14px;}}
</style>
</head>
<body>
<div class="platform-banner">
  <div class="platform-banner-inner">
    <a href="https://alnaseer.org" target="_blank" class="platform-brand">
      <div class="platform-logo">⚖️</div>
      <div class="platform-name"><span>منصة الناصر القانونية</span><span>Alnaser Legal Platform</span></div>
    </a>
    <a href="https://alnaseer.org" target="_blank" class="platform-cta">🔗 زيارة المنصة</a>
  </div>
</div>
<div class="page-header">
  <div class="page-header-inner">
    <h1>بنك أسئلة – ${subjectName}</h1>
    <div class="page-meta">
      <div class="meta-chip">📚 ${subjectName}</div>
      <div class="meta-chip">📅 ${yearLabel}</div>
      <div class="meta-chip" id="meta-count">📋 ${total} سؤال</div>
      <div class="meta-chip">👤 إعداد: أ.معين الناصر – الدفعة 50</div>
    </div>
  </div>
</div>
<div class="score-bar" id="score-bar">
  <div class="score-bar-inner">
    <div class="score-chip c">✅ <span id="cc">0</span> صحيح</div>
    <div class="score-chip w">❌ <span id="wc">0</span> خطأ</div>
    <div class="score-chip t">📊 <span id="ac">0</span>/<span id="tc">${total}</span></div>
    <div class="score-progress"><div class="score-progress-fill" id="pf"></div></div>
    <button class="reset-btn" onclick="resetQuiz()">🔄 إعادة</button>
  </div>
</div>
<div class="toolbar">
  <div class="mode-toggle">
    <button class="mode-btn active" id="br" onclick="setMode('review')">👁 مراجعة</button>
    <button class="mode-btn" id="bi" onclick="setMode('interactive')">✨ تفاعلي</button>
  </div>
  <div class="spacer"></div>
  <button class="print-btn" onclick="window.print()">🖨️ طباعة</button>
</div>
<div class="main" id="qc"></div>
<footer class="page-footer">
  <div class="footer-inner">
    <div class="footer-logo">⚖️ منصة الناصر القانونية</div>
    <div class="footer-credit">إعداد: أ.معين الناصر – الدفعة 50</div>
    <div class="footer-sub">جميع الحقوق محفوظة © ${new Date().getFullYear()} – Alnaser Legal Platform</div>
    <a href="https://alnaseer.org" target="_blank" class="footer-link">🌐 alnaseer.org</a>
  </div>
</footer>
<script>
const QS=${questionsJson};
let mode='review',answers={},cc=0,wc=0;
const L=['A','B','C','D'],LB=['أ','ب','ج','د'];
function render(){
  const c=document.getElementById('qc');c.innerHTML='';
  QS.forEach((q,i)=>{
    const opts=[q.option_a,q.option_b,q.option_c,q.option_d];
    let og='';
    if(mode==='review'){
      opts.forEach((o,j)=>{
        if(!o)return;
        const ok=L[j]===q.correct_option;
        og+=\`<div class="opt-review \${ok?'correct':''}"><div class="opt-badge">\${LB[j]}</div><span>\${o}</span>\${ok?'<span class="correct-tag">✓ صحيحة</span>':''}</div>\`;
      });
    }else{
      const ans=answers[i];
      opts.forEach((o,j)=>{
        if(!o)return;
        let cls='';
        if(ans!==undefined){
          if(L[j]===ans&&ans===q.correct_option)cls='sc';
          else if(L[j]===ans&&ans!==q.correct_option)cls='sw';
          else if(L[j]===q.correct_option&&ans!==q.correct_option)cls='rc';
        }
        og+=\`<div class="opt-interactive \${cls}" onclick="pick(\${i},'\${L[j]}')"><div class="opt-radio"><div class="opt-radio-inner"></div></div><div class="opt-badge" style="background:var(--slate-100);color:var(--slate-600);border-radius:7px;">\${LB[j]}</div><span>\${o}</span></div>\`;
      });
    }
    // hint for interactive wrong / explanation toggle for review
    let hintSection='';
    if(mode==='review'){
      if(q.explanation){
        hintSection+=\`<button class="explanation-toggle" id="et-\${i}" onclick="toggleExplanation(\${i})"><span>▼ الشرح المفصّل</span><span class="et-arrow">▲</span></button><div class="explanation-box" id="eb-\${i}"><div class="explanation-header"><div class="explanation-header-icon">📖</div><div><div class="explanation-header-title">الشرح المفصّل</div><div class="explanation-header-sub">اضغط للإغلاق</div></div></div><div class="explanation-body">\${q.explanation}</div></div>\`;
      }
    }else{
      if(q.hint&&answers[i]!==undefined&&answers[i]!==q.correct_option){
        hintSection=\`<div class="hint-box show" id="hb-\${i}">💡 <span>\${q.hint}</span></div>\`;
      }
    }
    const div=document.createElement('div');
    div.className='question-card';div.id='card-'+i;
    div.innerHTML=\`<div class=\"question-header\"><div class=\"q-num\">\${i+1}</div><div class=\"q-text\">\${q.question_text}</div></div><div class=\"options-grid\">\${og}</div>\${hintSection}\`;
    c.appendChild(div);
  });
  updScore();
}
function pick(i,l){
  if(answers[i]!==undefined)return;
  answers[i]=l;
  if(l===QS[i].correct_option)cc++;else wc++;
  render();
  document.getElementById('card-'+i)?.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function updScore(){
  const ans=Object.keys(answers).length,tot=QS.length;
  document.getElementById('cc').textContent=cc;
  document.getElementById('wc').textContent=wc;
  document.getElementById('ac').textContent=ans;
  document.getElementById('pf').style.width=(tot?(ans/tot)*100:0)+'%';
}
function resetQuiz(){answers={};cc=0;wc=0;render();}
function toggleExplanation(i){
  var box=document.getElementById('eb-'+i);
  var tog=document.getElementById('et-'+i);
  if(!box||!tog)return;
  var open=box.classList.toggle('show');
  tog.classList.toggle('open',open);
  if(open){var hdr=box.querySelector('.explanation-header-sub');if(hdr)hdr.textContent='اضغط للإغلاق';}
}
function setMode(m){
  mode=m;
  document.getElementById('br').classList.toggle('active',m==='review');
  document.getElementById('bi').classList.toggle('active',m==='interactive');
  document.getElementById('score-bar').classList.toggle('show',m==='interactive');
  if(m==='review'){answers={};cc=0;wc=0;}
  render();
}
render();
<\/script>
</body>
</html>`;

                  return html;
                  }; // نهاية buildHtml

                  const _formNameHtml = isTrialSelected
                    ? (allTrialForms.find(f => f.id === selectedTrialModel)?.name || 'أسئلة تجريبية')
                    : (EXAM_FORMS.find(f => f.id === selectedExamForm)?.name || '');

                  // ========== كل السنوات + نموذج محدد → ملف منفصل لكل سنة ==========
                  if (!selectedYear && !isTrialSelected) {
                    const yearsInData = Array.from(new Set(filteredQuestions.map(q => q.exam_year).filter(Boolean))).sort((a, b) => (a as number) - (b as number)) as number[];
                    if (yearsInData.length > 0) {
                      yearsInData.forEach(year => {
                        const yearQuestions = filteredQuestions.filter(q => q.exam_year === year);
                        if (!yearQuestions.length) return;
                        const html = buildHtml(yearQuestions as Question[], year.toString());
                        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const filename = [subjectName, year.toString(), _formNameHtml].filter(Boolean).join(' - ');
                        a.download = `${filename}.html`;
                        a.click();
                        URL.revokeObjectURL(url);
                      });
                      toast({ title: `✅ تم تصدير ${yearsInData.length} ملف HTML`, description: `ملف منفصل لكل سنة: ${yearsInData.join('، ')}` });
                      return;
                    }
                  }

                  // ========== الحالة العادية: سنة محددة أو نماذج تجريبية → ملف واحد ==========
                  const yearLabel = selectedYear || 'كل السنوات';
                  const html = buildHtml(filteredQuestions as Question[], yearLabel);
                  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  const _htmlFilename = [subjectName, yearLabel, _formNameHtml].filter(Boolean).join(' - ');
                  a.download = `${_htmlFilename}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={!selectedSubject || !filteredQuestions.length}
                className="gap-2 border-violet-200 bg-violet-50 text-violet-700 font-bold shadow-sm hover:bg-violet-100"
              >
                <FileText className="w-4 h-4" /> تصدير HTML
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setIsFileUploadOpen(true)} disabled={!selectedSubject} className="gap-2 border-primary/20 bg-primary/5 text-primary font-bold shadow-sm">
                <ScanLine className="w-4 h-4" /> استيراد PDF/JSON/نص
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setBrDone(false); setBrPreviewResults([]); setBrSearchTerm(''); setBrReplaceTerm(''); setIsBulkReplaceOpen(true); }}
                disabled={!selectedSubject || !questions.length}
                className="gap-2 border-orange-200 bg-orange-50 text-orange-700 font-bold shadow-sm hover:bg-orange-100"
              >
                <Replace className="w-4 h-4" /> بحث واستبدال
              </Button>
            )}
            <Button size="sm" onClick={() => { setEditingQuestion(null); setFormData({question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', hint: '', explanation: '', exam_year: '', exam_form: 'General'}); setIsDialogOpen(true); }} disabled={!selectedSubject} className="gradient-primary text-white gap-2 shadow-lg">
              <Plus className="w-4 h-4" /> إضافة سؤال
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative z-20 font-bold font-cairo">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}><SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="المستوى" /></SelectTrigger><SelectContent className="z-[9999] bg-white">{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="المادة" /></SelectTrigger><SelectContent className="z-[9999] bg-white">{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
          {/* إخفاء السنوات عند اختيار أسئلة تجريبية */}
          {!isTrialSelected && (
            <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}><SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="السنة" /></SelectTrigger><SelectContent className="z-[9999] bg-white shadow-2xl"><SelectItem value="all">كل السنوات</SelectItem>{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
          )}
          <div className="flex items-center gap-1">
            {/* فلتر النوع (أسئلة تجريبية / نماذج عادية) */}
            <Select value={selectedExamForm || "all"} onValueChange={(v) => { setSelectedExamForm(v === "all" ? "" : v); if (v === "Trial") { setSelectedYear(""); setSelectedTrialModel("all"); } }}><SelectTrigger className="bg-white border-slate-200 rounded-xl"><SelectValue placeholder="النموذج" /></SelectTrigger><SelectContent className="z-[9999] bg-white shadow-2xl max-h-[300px]"><SelectItem value="all">كل النماذج</SelectItem>{EXAM_FORMS.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select>
            {isTrialSelected && selectedSubject && <button onClick={() => setIsAddFormDialogOpen(true)} className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"><Plus className="w-4 h-4" /></button>}
          </div>
          {/* فلتر النموذج الرقمي - يظهر فقط عند اختيار أسئلة تجريبية */}
          {isTrialSelected && selectedSubject && (
            <Select value={selectedTrialModel} onValueChange={setSelectedTrialModel}><SelectTrigger className="bg-white border-blue-300 rounded-xl border-2"><SelectValue placeholder="كل النماذج" /></SelectTrigger><SelectContent className="z-[9999] bg-white shadow-2xl max-h-[300px]"><SelectItem value="all">كل النماذج</SelectItem>{activeExamForms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select>
          )}
          <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-white border-slate-200 rounded-xl" dir="rtl" /></div>
        </div>

        {/* Select All Checkbox */}
        {filteredQuestions.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-100 font-cairo font-bold text-sm text-slate-600">
            <Checkbox checked={selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0} onCheckedChange={toggleSelectAll} className="w-5 h-5 border-slate-300 data-[state=checked]:bg-primary" />
            <span>تحديد الكل ({filteredQuestions.length})</span>
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
              {filteredQuestions.map((q, i) => (
                <div key={q.id} className={cn("p-6 hover:bg-slate-50 transition-colors group relative flex gap-4 items-start", selectedIds.includes(q.id) && "bg-blue-50/50")}>
                  <div className="pt-1"><Checkbox checked={selectedIds.includes(q.id)} onCheckedChange={() => toggleSelectOne(q.id)} className="w-5 h-5 border-slate-300 data-[state=checked]:bg-primary" /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-800 text-lg mb-4 leading-relaxed cursor-pointer" onClick={() => toggleSelectOne(q.id)}>{q.question_text}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingQuestion(q); setFormData({ question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c || '', option_d: q.option_d || '', correct_option: q.correct_option as 'A' | 'B' | 'C' | 'D', hint: q.hint || '', explanation: (q as any).explanation || '', exam_year: q.exam_year?.toString() || '', exam_form: (q as any).exam_form || 'General' }); setIsDialogOpen(true); }} className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 bg-white border border-slate-100"><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => isAdmin ? setDeleteQuestion(q) : setRequestDeleteQuestion(q)} className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 bg-white border border-slate-100" title={isEditor ? 'طلب حذف (يحتاج موافقة المسؤل)' : 'حذف'}><Trash2 className="w-4 h-4" /></Button>
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
        <DialogContent className="max-w-5xl bg-white rounded-none md:rounded-3xl p-0 border-none shadow-2xl h-[100dvh] md:h-[94vh] flex flex-col overflow-hidden z-[9999] font-cairo">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white border-b px-4 md:px-8 py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <DialogTitle className="text-lg md:text-2xl font-black flex items-center gap-2 md:gap-3 text-slate-900">
                <Eye className="text-primary w-5 h-5 md:w-8 md:h-8" /> مراجعة الاستيراد
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Select value={importExamForm} onValueChange={setImportExamForm}>
                  <SelectTrigger className="w-32 md:w-40 rounded-xl bg-slate-50 border-slate-200 text-sm">
                    <SelectValue placeholder="النموذج" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001] bg-white">
                    {activeExamForms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-bold px-4 md:px-8 text-sm">إلغاء</Button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 md:px-8 py-3">
            <Input
              placeholder="بحث..."
              value={previewSearch}
              onChange={(e) => setPreviewSearch(e.target.value)}
              className="h-10 md:h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold text-sm text-right"
              dir="rtl"
              lang="ar"
            />
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 px-4 md:px-8">
            <div className="space-y-6 md:space-y-10 pb-6">
              {previewQuestions.filter(x => x.question_text.includes(previewSearch)).map((q) => (
                <div key={q.id} className="bg-slate-50/50 p-4 md:p-8 rounded-2xl md:rounded-[36px] border border-slate-100 relative group/item">
                  <button onClick={() => setPreviewQuestions(prev => prev.filter(p => p.id !== q.id))} className="absolute -left-2 -top-2 md:-left-3 md:-top-3 w-8 h-8 md:w-10 md:h-10 bg-white border border-red-100 text-destructive rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg hover:bg-destructive hover:text-white transition-all z-30"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                  <Textarea
                    value={q.question_text}
                    onChange={(e) => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i].question_text = e.target.value; setPreviewQuestions(up); }}
                    className="mb-4 md:mb-8 rounded-xl md:rounded-2xl border-slate-200 font-bold text-sm md:text-lg bg-white min-h-[80px] md:min-h-[100px] font-cairo shadow-sm text-right"
                    dir="rtl"
                    lang="ar"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                    {['A', 'B', 'C', 'D'].map(l => (
                      <div key={l} className="space-y-1.5 md:space-y-2 font-cairo">
                        <div className="flex justify-between items-center px-1">
                          <Label className="text-[9px] md:text-[10px] font-black uppercase">خيار ({l})</Label>
                          <button onClick={() => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i].correct_option = l; setPreviewQuestions(up); }} className={cn("text-[8px] md:text-[9px] font-black px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg transition-all", q.correct_option === l ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400")}>{q.correct_option === l ? 'إجابة صحيحة' : 'تحديد'}</button>
                        </div>
                        <Input
                          value={q[`option_${l.toLowerCase()}`]}
                          onChange={(e) => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i][`option_${l.toLowerCase()}`] = e.target.value; setPreviewQuestions(up); }}
                          className="rounded-xl border-slate-200 bg-white font-bold h-10 md:h-12 text-sm text-right"
                          dir="rtl"
                          lang="ar"
                        />
                      </div>
                    ))}
                  </div>

                  {/* حقل الملاحظة في الاستيراد */}
                  <div className="mt-4 space-y-1.5 font-cairo">
                    <Label className="text-[10px] font-black text-amber-600 flex items-center gap-1">
                      💡 ملاحظة / تفسير (اختياري — تظهر عند الإجابة الخاطئة)
                    </Label>
                    <Textarea
                      value={q.hint || ''}
                      onChange={(e) => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i].hint = e.target.value; setPreviewQuestions(up); }}
                      placeholder="اكتب شرحاً أو تلميحاً للطالب عند الإجابة الخاطئة..."
                      className="rounded-xl border-amber-200 bg-amber-50/40 font-bold text-xs md:text-sm min-h-[64px] text-right resize-none placeholder:text-amber-300 focus:border-amber-400"
                      dir="rtl"
                      lang="ar"
                    />
                  </div>

                  {/* حقل الشرح المفصّل في الاستيراد */}
                  <div className="mt-3 space-y-1.5 font-cairo">
                    <Label className="text-[10px] font-black text-indigo-600 flex items-center gap-1">
                      📖 الشرح المفصّل (اختياري — يظهر في وضع المراجعة)
                    </Label>
                    <Textarea
                      value={q.explanation || ''}
                      onChange={(e) => { const up = [...previewQuestions]; const i = up.findIndex(x => x.id === q.id); up[i].explanation = e.target.value; setPreviewQuestions(up); }}
                      placeholder="اكتب شرحاً مفصلاً بعناوين وتفاصيل..."
                      className="rounded-xl border-indigo-200 bg-indigo-50/30 font-bold text-xs md:text-sm min-h-[80px] text-right resize-none placeholder:text-indigo-300 focus:border-indigo-400"
                      dir="rtl"
                      lang="ar"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 z-10 bg-white border-t px-4 md:px-8 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <Button onClick={() => bulkSave.mutate(previewQuestions)} disabled={bulkSave.isPending} className="gradient-primary text-white font-black w-full h-12 md:h-14 rounded-xl shadow-xl text-base md:text-lg">
              {bulkSave.isPending ? <Loader2 className="animate-spin" /> : `حفظ جميع الأسئلة (${previewQuestions.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog - مع دعم اللصق المباشر */}
      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="max-w-lg bg-white rounded-3xl p-10 shadow-2xl border-none z-[9999] font-cairo">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
              <ScanLine className="text-primary" /> استيراد الأسئلة
            </DialogTitle>
          </DialogHeader>

          {/* حقل اللصق المباشر - مع دعم RTL كامل */}
          <div className="mt-6 space-y-3">
            <Label className="font-black text-slate-700 text-sm">لصق النص مباشرة</Label>
            <Textarea
              dir="rtl"
              lang="ar"
              placeholder="الصق الأسئلة هنا بالصيغة:&#10;نص السؤال؟&#10;1) الخيار الأول.&#10;2) الخيار الصحيح. +&#10;3) الخيار الثالث."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full min-h-[160px] rounded-2xl border-slate-200 font-cairo font-bold text-right text-sm resize-none"
            />
            <Button
              onClick={handlePasteText}
              disabled={!pasteText.trim()}
              className="gradient-primary text-white font-black w-full h-11 rounded-xl shadow-lg"
            >
              استيراد النص
            </Button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-bold">أو</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* رفع ملف */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-primary/40 hover:bg-primary/5 cursor-pointer group transition-all relative overflow-hidden"
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.json,.txt" />
            {isProcessingFile
              ? <div className="flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 text-primary animate-spin" /><p className="text-sm font-black text-slate-600">جاري المعالجة...</p></div>
              : <div className="flex flex-col items-center gap-4"><div className="p-5 bg-slate-100 rounded-2xl transition-all shadow-sm group-hover:bg-white"><FileText className="w-10 h-10 text-slate-400 group-hover:text-primary" /></div><p className="font-black text-slate-700 font-cairo">اضغط لاختيار ملف PDF أو JSON</p></div>
            }
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-bold">أو</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* رفع PDF ذو العمودين — مثل أحكام الأسرة */}
          <div
            onClick={() => fileInputRef2Col.current?.click()}
            className="border-2 border-dashed border-orange-200 rounded-3xl p-6 text-center hover:border-orange-400 hover:bg-orange-50/50 cursor-pointer group transition-all relative overflow-hidden"
          >
            <input type="file" ref={fileInputRef2Col} onChange={handleFileChange2Col} className="hidden" accept=".pdf" />
            {isProcessingFile2Col
              ? <div className="flex flex-col items-center gap-3"><Loader2 className="w-10 h-10 text-orange-500 animate-spin" /><p className="text-sm font-black text-slate-600">جاري معالجة العمودين...</p></div>
              : <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-orange-50 rounded-2xl transition-all shadow-sm group-hover:bg-white">
                    <FileText className="w-9 h-9 text-orange-400 group-hover:text-orange-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-700 font-cairo text-sm">PDF بتخطيط العمودين</p>
                    <p className="text-xs text-orange-500 font-bold mt-1">مثل: أحكام الأسرة — خيارين جنباً لجنب</p>
                  </div>
                </div>
            }
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white p-8 border-none shadow-2xl font-cairo">
          <AlertDialogHeader><AlertDialogTitle className="font-black text-2xl text-slate-900">حذف السؤال</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-8 font-bold">
            <AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteQuestion) return;
                softDeleteMutation.mutate([deleteQuestion.id]);
              }}
              disabled={softDeleteMutation.isPending}
              className="bg-destructive text-white rounded-xl font-black px-10"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* طلب حذف من المحرر - يحتاج موافقة المسؤل */}
      <AlertDialog open={!!requestDeleteQuestion} onOpenChange={() => setRequestDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white p-8 border-none shadow-2xl font-cairo">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-2xl text-slate-900">طلب حذف السؤال</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-slate-600 mt-2">
              لا تملك صلاحية الحذف المباشر. سيتم إرسال طلب حذف للمسؤل للمراجعة والموافقة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-8 font-bold">
            <AlertDialogCancel className="rounded-xl font-bold">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (!requestDeleteQuestion) return; requestDeleteMutation.mutate(requestDeleteQuestion); }}
              disabled={requestDeleteMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black px-10"
            >
              {requestDeleteMutation.isPending ? 'جاري الإرسال...' : 'إرسال طلب الحذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl z-[9999] bg-white p-8 border-none shadow-2xl font-cairo">
          <AlertDialogHeader><AlertDialogTitle className="font-black text-2xl text-slate-900">حذف ({selectedIds.length}) سؤال</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>سيتم حذف جميع الأسئلة المحددة. هل أنت متأكد؟</AlertDialogDescription>
          <AlertDialogFooter className="gap-3 mt-8 font-bold"><AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel><AlertDialogAction onClick={() => softDeleteMutation.mutate(selectedIds)} disabled={softDeleteMutation.isPending} className="bg-destructive text-white rounded-xl font-black px-10">حذف الجميع</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 z-[9999] font-cairo font-bold shadow-2xl border-none flex flex-col max-h-[90vh]">
          <DialogHeader className="px-8 pt-8 pb-4 border-b border-slate-100 shrink-0">
            <DialogTitle className="text-2xl font-black">{editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
          <form onSubmit={(e) => { e.preventDefault(); saveSingleMutation.mutate(formData); }} className="space-y-6 px-8 py-6" id="question-form">
            <div className="space-y-2.5">
              <Label className="font-black text-slate-700">نص السؤال *</Label>
              <Textarea value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} required className="rounded-2xl border-slate-200 min-h-[120px] text-right" dir="rtl" lang="ar" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['a', 'b', 'c', 'd'].map(l => (
                <div key={l}>
                  <Label className="text-xs mb-1 block">خيار {l.toUpperCase()}</Label>
                  <Input placeholder="نص الخيار..." value={formData[`option_${l}` as keyof typeof formData] as string} onChange={(e) => setFormData({ ...formData, [`option_${l}`]: e.target.value })} className="rounded-xl h-12 text-right" dir="rtl" lang="ar" />
                </div>
              ))}
            </div>

            {/* حقل الملاحظة/التفسير */}
            <div className="space-y-2.5">
              <Label className="font-black text-slate-700 flex items-center gap-2">
                <span>💡</span> ملاحظة / تفسير (اختياري)
              </Label>
              <Textarea
                value={formData.hint}
                onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                placeholder="اكتب شرحاً أو تلميحاً يظهر للطالب عند الإجابة الخاطئة فقط..."
                className="rounded-2xl border-amber-200 bg-amber-50/40 min-h-[90px] text-right focus:border-amber-400 focus:ring-amber-200 placeholder:text-amber-300"
                dir="rtl"
                lang="ar"
              />
              <p className="text-[11px] text-amber-500 font-bold text-right">
                ⚠️ تظهر هذه الملاحظة للطالب فقط عند اختياره إجابة خاطئة (وضع تفاعلي)
              </p>
            </div>

            {/* حقل الشرح المفصّل */}
            <div className="space-y-2.5">
              <Label className="font-black text-slate-700 flex items-center gap-2">
                <span>📖</span> الشرح المفصّل (اختياري)
              </Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="اكتب شرحاً مفصلاً بعناوين وتفاصيل... يظهر في وضع المراجعة فقط عند الضغط على ▼ الشرح المفصّل"
                className="rounded-2xl border-indigo-200 bg-indigo-50/30 min-h-[140px] text-right focus:border-indigo-400 focus:ring-indigo-200 placeholder:text-indigo-300"
                dir="rtl"
                lang="ar"
              />
              <p className="text-[11px] text-indigo-500 font-bold text-right">
                📖 يظهر هذا الشرح في وضع المراجعة فقط عند الضغط على زر "▼ الشرح المفصّل"
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>الإجابة الصحيحة</Label>
                <Select value={formData.correct_option} onValueChange={(v) => setFormData({...formData, correct_option: v as 'A' | 'B' | 'C' | 'D'})}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10001] bg-white border border-slate-200 shadow-xl rounded-xl">
                    <SelectItem value="A">أ (A)</SelectItem>
                    <SelectItem value="B">ب (B)</SelectItem>
                    <SelectItem value="C">ج (C)</SelectItem>
                    <SelectItem value="D">د (D)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>السنة</Label>
                <Select value={formData.exam_year} onValueChange={(v) => setFormData({...formData, exam_year: v})}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001] bg-white border border-slate-200 shadow-xl rounded-xl max-h-[200px] overflow-y-auto">
                    {EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>النموذج</Label>
                <Select value={formData.exam_form} onValueChange={(v) => setFormData({...formData, exam_form: v})}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="اختر النموذج" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001] bg-white border border-slate-200 shadow-xl rounded-xl">
                    {activeExamForms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" form="question-form" disabled={saveSingleMutation.isPending} className="gradient-primary text-white w-full h-12 rounded-xl text-lg font-black shadow-lg">
              {saveSingleMutation.isPending ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </Button>
          </form>
          </ScrollArea>
          <div className="px-8 py-5 border-t border-slate-100 bg-white rounded-b-3xl shrink-0">
            <Button type="submit" form="question-form" disabled={saveSingleMutation.isPending} className="gradient-primary text-white w-full h-12 rounded-xl text-lg font-black shadow-lg">
              {saveSingleMutation.isPending ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddFormDialogOpen} onOpenChange={setIsAddFormDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-8 z-[9999] font-cairo font-bold shadow-2xl border-none">
          <DialogHeader><DialogTitle className="text-xl font-black">إدارة النماذج الإضافية</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                placeholder="اسم النموذج (مثال: اسئلة مهمة)"
                className="rounded-xl h-11 text-right flex-1"
                dir="rtl"
              />
              <Button
                onClick={() => { if (newFormName.trim()) addFormMutation.mutate({ name: newFormName.trim(), position: newFormPosition }); }}
                disabled={!newFormName.trim() || addFormMutation.isPending}
                className="gradient-primary text-white rounded-xl px-6 font-black"
              >
                {addFormMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إضافة'}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-600 font-black shrink-0">الموضع في القائمة:</label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={newFormPosition}
                  onChange={(e) => setNewFormPosition(parseInt(e.target.value))}
                  className="flex-1 accent-violet-500"
                />
                <span className="text-sm font-black text-violet-600 w-8 text-center">{newFormPosition}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-bold text-right">
              النماذج 1-15 لها مواضع 1-15 — ضع النموذج قبل رقم معين لإدراجه قبله
            </p>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              <p className="text-xs text-slate-500 font-black">كل النماذج (افتراضية + مضافة):</p>
              {allTrialForms.map((f) => {
                const isEditingThis = editingFormId === f.id;
                return (
                  <div
                    key={f.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-colors",
                      f.hidden ? "bg-red-50 border-red-200 opacity-70" : "bg-slate-50 border-slate-100"
                    )}
                  >
                    {isEditingThis ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingFormName}
                          onChange={(e) => setEditingFormName(e.target.value)}
                          className="h-9 text-right rounded-lg flex-1"
                          dir="rtl"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingFormName.trim()) {
                              renameFormMutation.mutate({ rowId: f.rowId, formId: f.id, isDefault: f.isDefault, newName: editingFormName.trim() });
                            } else if (e.key === 'Escape') {
                              setEditingFormId(null); setEditingFormName('');
                            }
                          }}
                        />
                        <button
                          onClick={() => editingFormName.trim() && renameFormMutation.mutate({ rowId: f.rowId, formId: f.id, isDefault: f.isDefault, newName: editingFormName.trim() })}
                          disabled={renameFormMutation.isPending}
                          className="w-8 h-8 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center"
                          title="حفظ"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingFormId(null); setEditingFormName(''); }}
                          className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center"
                          title="إلغاء"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("text-sm font-bold truncate", f.hidden ? "text-red-600 line-through" : "text-slate-700")}>{f.name}</span>
                          {f.hidden && <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full shrink-0">مخفي</span>}
                          {!f.isDefault && <span className="text-[10px] font-black bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full shrink-0">مضاف</span>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-violet-500 font-black ml-1">#{f.order_index}</span>
                          {!f.isDefault && f.rowId && (
                            <>
                              <button
                                onClick={() => reorderFormMutation.mutate({ id: f.rowId!, direction: 'up', currentIndex: f.order_index })}
                                disabled={f.order_index <= 1 || reorderFormMutation.isPending}
                                className="w-7 h-7 rounded-lg text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-30"
                                title="رفع لأعلى"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => reorderFormMutation.mutate({ id: f.rowId!, direction: 'down', currentIndex: f.order_index })}
                                disabled={reorderFormMutation.isPending}
                                className="w-7 h-7 rounded-lg text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-30"
                                title="إنزال"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {f.hidden ? (
                            <button
                              onClick={() => f.rowId && showFormMutation.mutate({ rowId: f.rowId })}
                              disabled={showFormMutation.isPending}
                              className="text-xs font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              title="إظهار النموذج"
                            >
                              إظهار
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditingFormId(f.id); setEditingFormName(f.name); }}
                                className="w-7 h-7 rounded-lg text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                                title="تعديل الاسم"
                              >
                                <PencilLine className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteFormId(f.id)}
                                disabled={deleteFormMutation.isPending}
                                className="w-7 h-7 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog البحث والاستبدال الجماعي ─── */}
      <Dialog open={isBulkReplaceOpen} onOpenChange={(open) => { if (!open) handleBrClose(); }}>
        <DialogContent className="bg-white rounded-3xl z-[10000] max-w-lg w-full font-cairo" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-black text-lg flex items-center gap-2">
              <Replace className="w-5 h-5 text-orange-500" />
              بحث واستبدال جماعي
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* حقل البحث */}
            <div className="space-y-1.5">
              <Label className="text-sm font-black text-slate-700">العبارة المراد البحث عنها</Label>
              <div className="relative">
                <Input
                  value={brSearchTerm}
                  onChange={(e) => { setBrSearchTerm(e.target.value); setBrPreviewResults([]); setBrDone(false); }}
                  placeholder="اكتب العبارة..."
                  className="rounded-xl h-11 text-right pr-4 pl-10 border-orange-200 focus:border-orange-400"
                  dir="rtl"
                />
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* حقل الاستبدال */}
            <div className="space-y-1.5">
              <Label className="text-sm font-black text-slate-700">
                الاستبدال بـ <span className="text-slate-400 font-normal">(اتركه فارغاً للحذف)</span>
              </Label>
              <Input
                value={brReplaceTerm}
                onChange={(e) => { setBrReplaceTerm(e.target.value); setBrPreviewResults([]); setBrDone(false); }}
                placeholder="اتركه فارغاً للحذف..."
                className="rounded-xl h-11 text-right"
                dir="rtl"
              />
            </div>

            {/* زر المعاينة */}
            <Button
              onClick={handleBrPreview}
              disabled={!brSearchTerm.trim() || brIsPreviewing || !questions.length}
              variant="outline"
              className="w-full h-11 rounded-xl font-black border-orange-200 text-orange-700 hover:bg-orange-50 gap-2"
            >
              {brIsPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              معاينة النتائج
            </Button>

            {/* نتائج المعاينة */}
            {brPreviewResults.length > 0 && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 space-y-3">
                <p className="text-sm font-black text-orange-800">
                  تم العثور على العبارة في <span className="text-orange-600 text-base">{brPreviewResults.length}</span> سؤال
                  {brReplaceTerm
                    ? <> — سيتم استبدالها بـ "<span className="font-bold">{brReplaceTerm}</span>"</>
                    : ' — سيتم حذفها نهائياً'
                  }
                </p>
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {brPreviewResults.slice(0, 20).map(r => {
                      const q = questions.find(x => x.id === r.id);
                      return (
                        <div key={r.id} className="bg-white rounded-xl p-3 border border-orange-100 text-right">
                          <p className="text-xs text-slate-600 font-bold line-clamp-2">{q?.question_text}</p>
                          <p className="text-[11px] text-orange-500 font-black mt-1">
                            الحقول المتأثرة: {r.fields.map(f => ({
                              question_text: 'السؤال', option_a: 'أ', option_b: 'ب', option_c: 'ج', option_d: 'د', hint: 'التلميح', explanation: 'الشرح'
                            }[f] || f)).join(' · ')}
                          </p>
                        </div>
                      );
                    })}
                    {brPreviewResults.length > 20 && (
                      <p className="text-xs text-center text-slate-400 font-bold py-1">... و {brPreviewResults.length - 20} سؤال آخر</p>
                    )}
                  </div>
                </ScrollArea>

                {/* زر التطبيق */}
                <Button
                  onClick={handleBrApply}
                  disabled={brIsApplying}
                  className="w-full h-11 rounded-xl font-black bg-orange-500 hover:bg-orange-600 text-white gap-2"
                >
                  {brIsApplying
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التطبيق...</>
                    : <><CheckCircle2 className="w-4 h-4" /> تطبيق على {brPreviewResults.length} سؤال</>
                  }
                </Button>
              </div>
            )}

            {/* لا نتائج */}
            {brSearchTerm.trim() && brPreviewResults.length === 0 && !brIsPreviewing && !brDone && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                <p className="text-sm text-slate-500 font-bold">لم يتم العثور على العبارة في أي سؤال محمّل</p>
                <p className="text-xs text-slate-400 mt-1">تأكد من تحديد المادة والسنة أولاً</p>
              </div>
            )}

            {/* رسالة النجاح */}
            {brDone && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <p className="text-sm font-black text-emerald-700">تم تطبيق الاستبدال بنجاح ✅</p>
              </div>
            )}

            {/* زر الإغلاق */}
            <Button variant="ghost" onClick={handleBrClose} className="w-full rounded-xl font-bold text-slate-500">
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأكيد حذف النموذج */}
      <AlertDialog open={!!confirmDeleteFormId} onOpenChange={(open) => !open && setConfirmDeleteFormId(null)}>
        <AlertDialogContent className="bg-white rounded-3xl z-[10000]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right font-black">تأكيد حذف النموذج</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيختفي النموذج فوراً من قائمة الطلاب. لن يتم حذف الأسئلة المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const f = allTrialForms.find(x => x.id === confirmDeleteFormId);
                if (f) deleteFormMutation.mutate({ rowId: f.rowId, formId: f.id, isDefault: f.isDefault });
                setConfirmDeleteFormId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminQuestions;