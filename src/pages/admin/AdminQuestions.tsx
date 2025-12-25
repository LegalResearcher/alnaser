/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Developed by: Mueen Al-Nasser
 * Version: 3.5 (Ultimate Smart Import System)
 * Features: Smart Parsing (Colon & Plus pattern), Editable Preview, Search in Preview, Bulk Save.
 */

import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Plus, Search, Edit2, Trash2, BookOpen, FileSpreadsheet, 
  FileCode, CheckCircle2, FileUp, Loader2, FileText, AlertCircle, Eye, Save, X, PencilLine
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

// --- محرك الاستخراج الذكي (نمط جامعة صنعاء: نقطتين : وعلامة +) ---
const parseLegalExamContent = (textContent: string) => {
  const lines = textContent.split('\n');
  const extractedQuestions: any[] = [];
  let currentQ: any = null;

  lines.forEach((line) => {
    const text = line.trim();
    if (!text) return;

    // 1. اكتشاف السؤال: ينتهي بنقطتين ":" أو يحتوي على "؟"
    if (text.endsWith(':') || text.includes('؟')) {
      if (currentQ && currentQ.option_a) extractedQuestions.push(currentQ);
      currentQ = {
        id: Math.random().toString(36).substr(2, 9),
        question_text: text,
        option_a: '', option_b: '', option_c: '', option_d: '',
        correct_option: 'A',
        count: 0
      };
    } 
    // 2. اكتشاف الخيارات: (1) أو 1) أو ترقيم يليه شرطة
    else if (text.match(/^\d+[\)\-\s]/) || text.match(/^\(\d+/) || text.includes('(1')) {
      if (!currentQ) return;
      
      // إزالة الترقيم والمسافات من بداية السطر
      let optValue = text.replace(/^[\d\(\)\-\s]+/, '').trim();
      
      // 3. تحديد الإجابة الصحيحة: التحقق من وجود علامة (+) في بداية أو داخل النص
      const isCorrect = optValue.includes('+');
      const cleanValue = optValue.replace('+', '').replace(/^-/, '').trim();
      
      currentQ.count++;
      const letter = ['A', 'B', 'C', 'D'][currentQ.count - 1];
      
      if (letter === 'A') currentQ.option_a = cleanValue;
      else if (letter === 'B') currentQ.option_b = cleanValue;
      else if (letter === 'C') currentQ.option_c = cleanValue;
      else if (letter === 'D') currentQ.option_d = cleanValue;
      
      if (isCorrect) currentQ.correct_option = letter;
    }
  });

  if (currentQ && currentQ.option_a) extractedQuestions.push(currentQ);
  return extractedQuestions;
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

  // --- دوال التحكم في المعاينة ---
  const updatePreviewQuestion = (id: string, field: string, value: string) => {
    setPreviewQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const removePreviewQuestion = (id: string) => {
    setPreviewQuestions(prev => prev.filter(q => q.id !== id));
    toast({ title: "تم استبعاد السؤال من القائمة المؤقتة" });
  };

  const filteredPreview = previewQuestions.filter(q => 
    q.question_text.includes(previewSearch) || 
    q.option_a.includes(previewSearch) || 
    q.option_b.includes(previewSearch)
  );

  // --- جلب البيانات الأساسية ---
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
      
      let filtered = data as Question[];
      if (searchQuery) filtered = filtered.filter(q => q.question_text.includes(searchQuery));
      return filtered;
    },
    enabled: !!selectedSubject,
  });

  // --- العمليات (Mutations) ---
  const bulkInsertMutation = useMutation({
    mutationFn: async (list: any[]) => {
      const formatted = list.map(q => ({
        subject_id: selectedSubject,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c || null,
        option_d: q.option_d || null,
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
      toast({ title: 'تم استيراد كافة الأسئلة بنجاح ✅' });
      setIsPreviewOpen(false);
      setPreviewQuestions([]);
    },
    onError: (err: any) => {
      toast({ title: 'فشل الحفظ الجماعي', description: err.message, variant: 'destructive' });
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const extracted = parseLegalExamContent(content);
      if (extracted.length > 0) {
        setPreviewQuestions(extracted);
        setIsFileUploadOpen(false);
        setIsPreviewOpen(true);
      } else {
        toast({ title: 'تنسيق الملف غير مدعوم', variant: 'destructive' });
      }
      setIsProcessingFile(false);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
    setFormData({
      question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
      correct_option: 'A', hint: '', exam_year: '',
    });
  };

  const handleEditManual = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text, option_a: question.option_a,
      option_b: question.option_b, option_c: question.option_c || '',
      option_d: question.option_d || '', correct_option: question.correct_option,
      hint: question.hint || '', exam_year: question.exam_year?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة بنك الأسئلة</h1>
            <p className="text-sm text-slate-500 font-medium">نظام الاستيراد الذكي والمراجعة المباشرة</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFileUploadOpen(true)} disabled={!selectedSubject} className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold shadow-sm">
              <FileUp className="w-4 h-4" /> رفع ملف الاختبار
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)} disabled={!selectedSubject} className="gradient-primary text-white gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> إضافة يدوية
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative z-20">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest">المستوى</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold font-cairo"><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
              <SelectContent className="z-[9999] bg-white border-slate-200 shadow-xl">{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest">المادة</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold font-cairo"><SelectValue placeholder="اختر المادة" /></SelectTrigger>
              <SelectContent className="z-[9999] bg-white border-slate-200 shadow-xl">{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest">سنة النموذج</Label>
            <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-white border-slate-200 rounded-xl font-bold font-cairo"><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent className="z-[9999] bg-white border-slate-200 shadow-xl max-h-[250px] overflow-y-auto">
                <SelectItem value="all">كافة السنوات</SelectItem>{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>نموذج {y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest">البحث</Label>
            <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="نص السؤال..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-white border-slate-200 rounded-xl" /></div>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden z-10 min-h-[400px]">
          {!selectedSubject ? (
            <div className="p-24 text-center text-slate-400 flex flex-col items-center gap-4"><BookOpen className="w-16 h-16 opacity-10" /><p className="font-bold">اختر المادة لعرض بنك الأسئلة الخاص بها</p></div>
          ) : isLoading ? (
            <div className="p-6 space-y-4"><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-24 w-full rounded-2xl" /></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {questions.map((q, i) => (
                <div key={q.id} className="p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3"><span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg"># {i + 1}</span>{q.exam_year && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">نموذج {q.exam_year}</span>}</div>
                      <p className="font-bold text-slate-800 text-lg mb-4 leading-relaxed">{q.question_text}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className={cn("p-4 rounded-xl border transition-all", q.correct_option === 'A' ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" : "bg-white border-slate-100 text-slate-500")}>أ. {q.option_a}</div>
                        <div className={cn("p-4 rounded-xl border transition-all", q.correct_option === 'B' ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" : "bg-white border-slate-100 text-slate-500")}>ب. {q.option_b}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="secondary" size="icon" onClick={() => handleEditManual(q)} className="rounded-xl"><Edit2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-destructive rounded-xl" onClick={() => setDeleteQuestion(q)}><Trash2 className="w-4 h-4" /></Button></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- حوار المعاينة المتقدم (البحث + التعديل + الحذف) --- */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl bg-white rounded-3xl p-8 border-none shadow-2xl h-[94vh] flex flex-col overflow-hidden">
          <DialogHeader className="border-b pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
                <Eye className="text-primary w-8 h-8" /> مراجعة وتصفية الأسئلة المستخرجة
              </DialogTitle>
              <div className="flex gap-3">
                 <Button variant="ghost" onClick={() => { setIsPreviewOpen(false); setPreviewQuestions([]); }} className="rounded-xl font-bold px-8">إلغاء</Button>
                 <Button onClick={() => bulkInsertMutation.mutate(previewQuestions)} disabled={bulkInsertMutation.isPending || previewQuestions.length === 0} className="gradient-primary text-white font-black px-12 rounded-xl shadow-xl">
                   {bulkInsertMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
                   حفظ ({previewQuestions.length}) سؤال
                 </Button>
              </div>
            </div>
            {/* شريط البحث داخل المعاينة */}
            <div className="relative">
              <Search className="absolute right-4 top-3 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="ابحث داخل الأسئلة لتعديلها أو استبعادها..." 
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                className="pr-12 h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 transition-all font-cairo"
              />
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 mt-8 pr-4">
            <div className="space-y-10 pb-12">
              {filteredPreview.length > 0 ? (
                filteredPreview.map((q, idx) => (
                  <div key={q.id} className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100 shadow-sm relative group/item hover:bg-white transition-all duration-300">
                    <button 
                      onClick={() => removePreviewQuestion(q.id)}
                      className="absolute -left-3 -top-3 w-10 h-10 bg-white border border-red-100 text-destructive rounded-2xl flex items-center justify-center shadow-lg hover:bg-destructive hover:text-white transition-all opacity-0 group-hover/item:opacity-100 z-30"
                      title="استبعاد السؤال"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">#{idx + 1}</span>
                      <Label className="font-black text-slate-400 tracking-tight text-[10px] uppercase">تعديل نص السؤال</Label>
                    </div>
                    
                    <Textarea 
                      value={q.question_text} 
                      onChange={(e) => updatePreviewQuestion(q.id, 'question_text', e.target.value)}
                      className="mb-8 rounded-2xl border-slate-200 font-bold text-lg bg-white min-h-[90px] focus:ring-primary/20"
                      dir="rtl"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {['A', 'B', 'C', 'D'].map((letter) => {
                        const field = `option_${letter.toLowerCase()}`;
                        const isCorrect = q.correct_option === letter;
                        if (!q[field] && letter !== 'A' && letter !== 'B') return null;
                        return (
                          <div key={letter} className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                              <Label className="text-[10px] font-black text-slate-400 tracking-widest">الخيار ({letter})</Label>
                              <button 
                                onClick={() => updatePreviewQuestion(q.id, 'correct_option', letter)}
                                className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg transition-all", isCorrect ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400 hover:bg-slate-300")}
                              >
                                {isCorrect ? 'الإجابة الصحيحة ✅' : 'تحديد كإجابة'}
                              </button>
                            </div>
                            <Input 
                              value={q[field]} 
                              onChange={(e) => updatePreviewQuestion(q.id, field, e.target.value)}
                              className={cn("rounded-xl border-slate-200 font-bold text-sm bg-white", isCorrect && "border-emerald-500 ring-2 ring-emerald-500/10")}
                              dir="rtl"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-32 text-center text-slate-400 flex flex-col items-center gap-4"><Search className="w-16 h-16 opacity-5" /><p className="font-bold">لم يتم العثور على أي سؤال يطابق بحثك</p></div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* --- حوار الرفع الرئيسي --- */}
      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-10 shadow-2xl border-none">
          <DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3"><FileUp className="text-primary" /> رفع ملف الاختبار الذكي</DialogTitle></DialogHeader>
          <div onClick={() => fileInputRef.current?.click()} className="mt-8 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 cursor-pointer group transition-all">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.html" />
            <div className="p-6 bg-slate-100 rounded-2xl group-hover:scale-110 group-hover:bg-white transition-all shadow-sm mx-auto w-fit mb-4 text-slate-400 group-hover:text-primary"><FileText className="w-10 h-10" /></div>
            <p className="font-black text-slate-700 text-lg">اختر ملف الأسئلة المجهز</p>
            <p className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-tighter">يدعم نمط النقطتين (:) وعلامة الزائد (+)</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- حوارات الإضافة اليدوية والحذف الاعتيادية --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-6 mt-6">
            <div className="space-y-2.5">
              <Label className="font-black text-slate-700">نص السؤال *</Label>
              <Textarea value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} required className="rounded-2xl border-slate-200 min-h-[120px] font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs font-bold text-slate-400">خيار (أ) *</Label><Input value={formData.option_a} onChange={(e) => setFormData({ ...formData, option_a: e.target.value })} required className="rounded-xl" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold text-slate-400">خيار (ب) *</Label><Input value={formData.option_b} onChange={(e) => setFormData({ ...formData, option_b: e.target.value })} required className="rounded-xl" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold text-slate-400">خيار (ج)</Label><Input value={formData.option_c} onChange={(e) => setFormData({ ...formData, option_c: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-2"><Label className="text-xs font-bold text-slate-400">خيار (د)</Label><Input value={formData.option_d} onChange={(e) => setFormData({ ...formData, option_d: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">الإجابة الصحيحة *</Label>
                <Select value={formData.correct_option} onValueChange={(v) => setFormData({ ...formData, correct_option: v as 'A'|'B'|'C'|'D' })}>
                  <SelectTrigger className="rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white z-[9999]"><SelectItem value="A">أ</SelectItem><SelectItem value="B">ب</SelectItem><SelectItem value="C">ج</SelectItem><SelectItem value="D">د</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">سنة النموذج</Label>
                <Select value={formData.exam_year} onValueChange={(v) => setFormData({ ...formData, exam_year: v })}>
                  <SelectTrigger className="rounded-xl font-bold"><SelectValue placeholder="اختر السنة" /></SelectTrigger>
                  <SelectContent className="bg-white z-[9999]">{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="ghost" onClick={handleCloseDialog} className="rounded-xl font-bold">إلغاء</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="gradient-primary text-white px-10 rounded-xl font-black shadow-lg">حفظ البيانات</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 bg-white">
          <AlertDialogHeader><AlertDialogTitle className="font-black text-2xl text-slate-900">تأكيد الحذف</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription className="font-bold text-slate-500 text-base mt-2">هل أنت متأكد من حذف هذا السؤال نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          <AlertDialogFooter className="gap-3 mt-8">
            <AlertDialogCancel className="rounded-xl font-bold">تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteQuestion && supabase.from('questions').update({ status: 'deleted' }).eq('id', deleteQuestion.id).then(() => queryClient.invalidateQueries({ queryKey: ['questions'] }))} className="bg-destructive text-white rounded-xl font-black px-8">حذف الآن</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExcelImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} subjectId={selectedSubject} />
      <HtmlImportDialog open={isHtmlImportDialogOpen} onOpenChange={setIsHtmlImportDialogOpen} subjectId={selectedSubject} />
    </AdminLayout>
  );
};

export default AdminQuestions;
