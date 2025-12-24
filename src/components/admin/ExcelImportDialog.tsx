import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';
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
      {
        'نص السؤال': 'ما هو السؤال الثاني؟',
        'الخيار أ': 'خيار 1',
        'الخيار ب': 'خيار 2',
        'الخيار ج': 'خيار 3',
        'الخيار د': 'خيار 4',
        'الإجابة الصحيحة': 'B',
        'ملاحظة': '',
        'سنة الاختبار': 2024,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الأسئلة');
    
    // Set RTL direction
    ws['!cols'] = [
      { wch: 50 }, // نص السؤال
      { wch: 25 }, // الخيار أ
      { wch: 25 }, // الخيار ب
      { wch: 25 }, // الخيار ج
      { wch: 25 }, // الخيار د
      { wch: 15 }, // الإجابة الصحيحة
      { wch: 30 }, // ملاحظة
      { wch: 15 }, // سنة الاختبار
    ];

    XLSX.writeFile(wb, 'قالب_الأسئلة.xlsx');
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
        const rowNum = index + 2; // Account for header row

        // Get values with multiple possible column names
        const questionText = row['نص السؤال'] || row['السؤال'] || row['question_text'] || '';
        const optionA = row['الخيار أ'] || row['خيار أ'] || row['option_a'] || row['A'] || '';
        const optionB = row['الخيار ب'] || row['خيار ب'] || row['option_b'] || row['B'] || '';
        const optionC = row['الخيار ج'] || row['خيار ج'] || row['option_c'] || row['C'] || '';
        const optionD = row['الخيار د'] || row['خيار د'] || row['option_d'] || row['D'] || '';
        const correctOption = (row['الإجابة الصحيحة'] || row['الجواب'] || row['correct_option'] || row['correct'] || '').toString().toUpperCase();
        const hint = row['ملاحظة'] || row['hint'] || '';
        const examYear = row['سنة الاختبار'] || row['السنة'] || row['exam_year'] || '';

        // Validate required fields
        if (!questionText) {
          parseErrors.push(`الصف ${rowNum}: نص السؤال مطلوب`);
          return;
        }
        if (!optionA || !optionB || !optionC || !optionD) {
          parseErrors.push(`الصف ${rowNum}: جميع الخيارات مطلوبة`);
          return;
        }
        if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
          parseErrors.push(`الصف ${rowNum}: الإجابة الصحيحة يجب أن تكون A, B, C, أو D`);
          return;
        }

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

      if (questions.length === 0 && parseErrors.length === 0) {
        parseErrors.push('لم يتم العثور على أسئلة في الملف');
      }

      setParsedQuestions(questions);
      setErrors(parseErrors);
      setStep('preview');
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setErrors(['حدث خطأ أثناء قراءة الملف. تأكد من أن الملف بصيغة Excel صحيحة.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelFile(file);
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
            <FileSpreadsheet className="w-5 h-5" />
            استيراد الأسئلة من Excel
          </DialogTitle>
          <DialogDescription>
            قم برفع ملف Excel يحتوي على الأسئلة بالتنسيق المطلوب
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
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? 'جاري القراءة...' : 'اختر ملف Excel'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">تحتاج للتنسيق الصحيح؟</p>
                <p>قم بتحميل القالب وملئه بالأسئلة</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 ml-2" />
                تحميل القالب
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">الأعمدة المطلوبة:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>نص السؤال (مطلوب)</li>
                <li>الخيار أ، ب، ج، د (مطلوبة)</li>
                <li>الإجابة الصحيحة: A, B, C, أو D (مطلوب)</li>
                <li>ملاحظة (اختياري)</li>
                <li>سنة الاختبار (اختياري)</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">أخطاء في الملف ({errors.length})</span>
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
                        {q.exam_year && ` | نموذج ${q.exam_year}`}
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
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
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
