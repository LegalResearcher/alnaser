import { useState, useRef } from 'react';
import { Upload, FileCode, AlertCircle, CheckCircle2 } from 'lucide-react';
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

      // Strategy 1: Look for common question patterns in divs/sections
      const questionContainers = doc.querySelectorAll(
        '.question, .quiz-question, [class*="question"], div[data-question], article, .card'
      );

      if (questionContainers.length > 0) {
        questionContainers.forEach((container, index) => {
          const parsed = parseQuestionContainer(container, index + 1);
          if (parsed.question) {
            questions.push(parsed.question);
          } else if (parsed.error) {
            parseErrors.push(parsed.error);
          }
        });
      }

      // Strategy 2: Look for numbered list items (ol/li)
      if (questions.length === 0) {
        const listItems = doc.querySelectorAll('ol > li, ul > li');
        listItems.forEach((li, index) => {
          const parsed = parseListItem(li, index + 1);
          if (parsed.question) {
            questions.push(parsed.question);
          }
        });
      }

      // Strategy 3: Look for tables (common format)
      if (questions.length === 0) {
        const tables = doc.querySelectorAll('table');
        tables.forEach((table) => {
          const parsed = parseTable(table, parseErrors);
          questions.push(...parsed);
        });
      }

      // Strategy 4: Parse from plain text patterns
      if (questions.length === 0) {
        const bodyText = doc.body?.textContent || text;
        const textParsed = parseFromText(bodyText);
        questions.push(...textParsed);
      }

      if (questions.length === 0 && parseErrors.length === 0) {
        parseErrors.push('لم يتم العثور على أسئلة في الملف. تأكد من تنسيق الملف.');
      }

      setParsedQuestions(questions);
      setErrors(parseErrors);
      setStep('preview');
    } catch (error) {
      console.error('Error parsing HTML file:', error);
      setErrors(['حدث خطأ أثناء قراءة الملف. تأكد من أن الملف بصيغة HTML صحيحة.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseQuestionContainer = (container: Element, index: number): { question?: ParsedQuestion; error?: string } => {
    const text = container.textContent?.trim() || '';
    
    // Look for question text
    const questionEl = container.querySelector(
      '.question-text, .q-text, h1, h2, h3, h4, p:first-of-type, strong'
    );
    const questionText = questionEl?.textContent?.trim() || '';

    if (!questionText || questionText.length < 5) {
      return {};
    }

    // Look for options
    const optionEls = container.querySelectorAll(
      '.option, .answer, .choice, input[type="radio"] + label, label, li'
    );
    
    const options: string[] = [];
    let correctIndex = -1;

    optionEls.forEach((el, i) => {
      const optText = el.textContent?.trim().replace(/^[أ-يa-dA-D][\.\)\-\s]+/, '') || '';
      if (optText && optText.length > 0 && options.length < 4) {
        options.push(optText);
        
        // Check if this is marked as correct
        if (
          el.classList.contains('correct') ||
          el.classList.contains('right') ||
          el.getAttribute('data-correct') === 'true' ||
          (el as HTMLInputElement).checked
        ) {
          correctIndex = options.length - 1;
        }
      }
    });

    // If no options found, try to extract from text
    if (options.length < 4) {
      const extracted = extractOptionsFromText(text);
      if (extracted.options.length >= 4) {
        options.length = 0;
        options.push(...extracted.options.slice(0, 4));
        correctIndex = extracted.correctIndex;
      }
    }

    if (options.length < 4) {
      return { error: `السؤال ${index}: لم يتم العثور على 4 خيارات` };
    }

    return {
      question: {
        question_text: cleanQuestionText(questionText),
        option_a: options[0],
        option_b: options[1],
        option_c: options[2],
        option_d: options[3],
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
          option_a: extracted.options[0],
          option_b: extracted.options[1],
          option_c: extracted.options[2],
          option_d: extracted.options[3],
          correct_option: extracted.correctIndex >= 0 
            ? (['A', 'B', 'C', 'D'][extracted.correctIndex] as 'A' | 'B' | 'C' | 'D') 
            : 'A',
        },
      };
    }

    return {};
  };

  const parseTable = (table: Element, errors: string[]): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header
      
      const cells = row.querySelectorAll('td, th');
      if (cells.length >= 6) {
        const questionText = cells[0]?.textContent?.trim() || '';
        const optionA = cells[1]?.textContent?.trim() || '';
        const optionB = cells[2]?.textContent?.trim() || '';
        const optionC = cells[3]?.textContent?.trim() || '';
        const optionD = cells[4]?.textContent?.trim() || '';
        const correct = cells[5]?.textContent?.trim().toUpperCase() || 'A';

        if (questionText && optionA && optionB && optionC && optionD) {
          questions.push({
            question_text: cleanQuestionText(questionText),
            option_a: optionA,
            option_b: optionB,
            option_c: optionC,
            option_d: optionD,
            correct_option: ['A', 'B', 'C', 'D'].includes(correct) ? (correct as 'A' | 'B' | 'C' | 'D') : 'A',
          });
        }
      }
    });

    return questions;
  };

  const parseFromText = (text: string): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];
    
    // Pattern: numbered questions with options
    const questionPattern = /(\d+[\.\)\-\s]+[^\n]+)\s*\n?\s*[أاآ][\.\)\-\s]+([^\n]+)\s*\n?\s*[ب][\.\)\-\s]+([^\n]+)\s*\n?\s*[ج][\.\)\-\s]+([^\n]+)\s*\n?\s*[د][\.\)\-\s]+([^\n]+)/g;
    
    let match;
    while ((match = questionPattern.exec(text)) !== null) {
      questions.push({
        question_text: cleanQuestionText(match[1]),
        option_a: match[2].trim(),
        option_b: match[3].trim(),
        option_c: match[4].trim(),
        option_d: match[5].trim(),
        correct_option: 'A', // Default, user can edit later
      });
    }

    // Alternative pattern with A, B, C, D
    if (questions.length === 0) {
      const altPattern = /(\d+[\.\)\-\s]+[^\n]+)\s*\n?\s*[Aa][\.\)\-\s]+([^\n]+)\s*\n?\s*[Bb][\.\)\-\s]+([^\n]+)\s*\n?\s*[Cc][\.\)\-\s]+([^\n]+)\s*\n?\s*[Dd][\.\)\-\s]+([^\n]+)/g;
      
      while ((match = altPattern.exec(text)) !== null) {
        questions.push({
          question_text: cleanQuestionText(match[1]),
          option_a: match[2].trim(),
          option_b: match[3].trim(),
          option_c: match[4].trim(),
          option_d: match[5].trim(),
          correct_option: 'A',
        });
      }
    }

    return questions;
  };

  const extractOptionsFromText = (text: string): { options: string[]; correctIndex: number } => {
    const options: string[] = [];
    let correctIndex = -1;

    // Arabic options: أ، ب، ج، د
    const arabicPattern = /[أاآ][\.\)\-\s]+([^بجد\n]+)[ب][\.\)\-\s]+([^جد\n]+)[ج][\.\)\-\s]+([^د\n]+)[د][\.\)\-\s]+([^\n]+)/;
    const arabicMatch = text.match(arabicPattern);
    
    if (arabicMatch) {
      options.push(arabicMatch[1].trim(), arabicMatch[2].trim(), arabicMatch[3].trim(), arabicMatch[4].trim());
    }

    // English options: A, B, C, D
    if (options.length === 0) {
      const englishPattern = /[Aa][\.\)\-\s]+([^BbCcDd\n]+)[Bb][\.\)\-\s]+([^CcDd\n]+)[Cc][\.\)\-\s]+([^Dd\n]+)[Dd][\.\)\-\s]+([^\n]+)/;
      const englishMatch = text.match(englishPattern);
      
      if (englishMatch) {
        options.push(englishMatch[1].trim(), englishMatch[2].trim(), englishMatch[3].trim(), englishMatch[4].trim());
      }
    }

    // Check for correct answer marker
    const correctMarker = text.match(/الإجابة\s*:?\s*([أبجدABCD])/i);
    if (correctMarker) {
      const letter = correctMarker[1].toUpperCase();
      correctIndex = { 'أ': 0, 'ا': 0, 'A': 0, 'ب': 1, 'B': 1, 'ج': 2, 'C': 2, 'د': 3, 'D': 3 }[letter] ?? -1;
    }

    return { options, correctIndex };
  };

  const cleanQuestionText = (text: string): string => {
    return text
      .replace(/^\d+[\.\)\-\s]+/, '') // Remove question number
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseHtmlFile(file);
    }
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
        
        if (error) {
          throw error;
        }

        successCount += batch.length;
        setProgress(Math.round((successCount / parsedQuestions.length) * 100));
      }

      queryClient.invalidateQueries({ queryKey: ['questions'] });
      
      toast({
        title: 'تم الاستيراد بنجاح',
        description: `تم إضافة ${successCount} سؤال`,
      });

      handleClose();
    } catch (error) {
      console.error('Error importing questions:', error);
      toast({
        title: 'حدث خطأ أثناء الاستيراد',
        variant: 'destructive',
      });
      setStep('preview');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            استيراد الأسئلة من HTML
          </DialogTitle>
          <DialogDescription>
            قم برفع ملف HTML يحتوي على الأسئلة
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                اسحب الملف هنا أو اضغط للاختيار
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                onChange={handleFileChange}
                className="hidden"
                id="html-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? 'جاري القراءة...' : 'اختر ملف HTML'}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">التنسيقات المدعومة:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>أسئلة في عناصر div أو section مع class يحتوي "question"</li>
                <li>جداول مع أعمدة: السؤال، أ، ب، ج، د، الإجابة</li>
                <li>قوائم مرقمة (ol/li) مع الخيارات</li>
                <li>نص عادي بتنسيق: رقم. السؤال أ. ب. ج. د.</li>
              </ul>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-2">ملاحظة:</p>
              <p className="text-muted-foreground">
                سيتم محاولة التعرف على الإجابة الصحيحة تلقائياً. إذا لم يتم التعرف عليها، 
                سيتم تعيين الخيار "أ" كإجابة افتراضية ويمكنك تعديلها لاحقاً.
              </p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">تنبيهات ({errors.length})</span>
                </div>
                <ul className="text-sm text-destructive space-y-1 max-h-32 overflow-y-auto">
                  {errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {parsedQuestions.length > 0 && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-success mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">جاهز للاستيراد: {parsedQuestions.length} سؤال</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {parsedQuestions.slice(0, 5).map((q, i) => (
                    <div key={i} className="text-sm p-2 bg-background rounded border">
                      <p className="font-medium line-clamp-1">{i + 1}. {q.question_text}</p>
                      <p className="text-muted-foreground text-xs">
                        الإجابة الصحيحة: {q.correct_option}
                      </p>
                    </div>
                  ))}
                  {parsedQuestions.length > 5 && (
                    <p className="text-muted-foreground text-sm text-center">
                      و {parsedQuestions.length - 5} سؤال آخر...
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={resetState}>
                اختيار ملف آخر
              </Button>
              <Button
                onClick={importQuestions}
                disabled={parsedQuestions.length === 0}
                className="gradient-primary text-primary-foreground border-0"
              >
                استيراد {parsedQuestions.length} سؤال
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <FileCode className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
              <p className="font-medium mb-2">جاري استيراد الأسئلة...</p>
              <p className="text-muted-foreground text-sm">يرجى الانتظار</p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">{progress}%</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
