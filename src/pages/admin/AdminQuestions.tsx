// Admin Questions Page
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Search, Edit2, Trash2, Calendar, BookOpen, Filter, FileSpreadsheet } from 'lucide-react';
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
import { ExcelImportDialog } from '@/components/admin/ExcelImportDialog';

const AdminQuestions = () => {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D',
    hint: '',
    exam_year: '',
  });

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
      if (searchQuery) {
        filtered = filtered.filter(q => q.question_text.includes(searchQuery));
      }
      return filtered;
    },
    enabled: !!selectedSubject,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { subject_id?: string; id?: string }) => {
      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update({
            question_text: data.question_text,
            option_a: data.option_a,
            option_b: data.option_b,
            option_c: data.option_c,
            option_d: data.option_d,
            correct_option: data.correct_option,
            hint: data.hint || null,
            exam_year: data.exam_year ? parseInt(data.exam_year) : null,
          })
          .eq('id', editingQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').insert({
          subject_id: selectedSubject,
          question_text: data.question_text,
          option_a: data.option_a,
          option_b: data.option_b,
          option_c: data.option_c,
          option_d: data.option_d,
          correct_option: data.correct_option,
          hint: data.hint || null,
          exam_year: data.exam_year ? parseInt(data.exam_year) : null,
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({ title: editingQuestion ? 'تم تحديث السؤال' : 'تم إضافة السؤال بنجاح' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (question: Question) => {
      if (role === 'admin') {
        const { error } = await supabase.from('questions').delete().eq('id', question.id);
        if (error) throw error;
      } else {
        // Editor creates deletion request
        const { error } = await supabase.from('deletion_requests').insert({
          question_id: question.id,
          requested_by: user?.id,
        });
        if (error) throw error;
        
        // Mark as pending deletion
        await supabase.from('questions').update({ status: 'pending_deletion' }).eq('id', question.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({
        title: role === 'admin' ? 'تم حذف السؤال' : 'تم إرسال طلب الحذف للمسؤول',
      });
      setDeleteQuestion(null);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      hint: '',
      exam_year: '',
    });
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
      hint: question.hint || '',
      exam_year: question.exam_year?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question_text || !formData.option_a || !formData.option_b || !formData.option_c || !formData.option_d) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">إدارة الأسئلة</h1>
            <p className="text-muted-foreground">إضافة وتعديل وحذف الأسئلة</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
              disabled={!selectedSubject}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              استيراد من Excel
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              disabled={!selectedSubject}
              className="gradient-primary text-primary-foreground border-0 gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة سؤال
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Level Filter */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" />
                المستوى
              </Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر المستوى" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Filter */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                المادة
              </Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                نموذج الاختبار
              </Label>
              <Select value={selectedYear || "all"} onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="كل السنوات" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">كل السنوات</SelectItem>
                  {EXAM_YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      نموذج {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Search className="w-4 h-4" />
                البحث
              </Label>
              <Input
                placeholder="ابحث في الأسئلة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-card rounded-xl border">
          {!selectedSubject ? (
            <div className="p-12 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>اختر مادة لعرض الأسئلة</p>
            </div>
          ) : isLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد أسئلة</p>
            </div>
          ) : (
            <div className="divide-y">
              {questions.map((question, index) => (
                <div key={question.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        {question.exam_year && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            نموذج {question.exam_year}
                          </span>
                        )}
                      </div>
                      <p className="font-medium mb-2 line-clamp-2">{question.question_text}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <span className={cn(question.correct_option === 'A' && 'text-success font-medium')}>
                          أ. {question.option_a}
                        </span>
                        <span className={cn(question.correct_option === 'B' && 'text-success font-medium')}>
                          ب. {question.option_b}
                        </span>
                        <span className={cn(question.correct_option === 'C' && 'text-success font-medium')}>
                          ج. {question.option_c}
                        </span>
                        <span className={cn(question.correct_option === 'D' && 'text-success font-medium')}>
                          د. {question.option_d}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(question)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteQuestion(question)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>نص السؤال *</Label>
              <Textarea
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                rows={3}
                className="bg-background"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(formData.correct_option === 'A' && 'text-success')}>
                  الخيار أ *
                </Label>
                <Input
                  value={formData.option_a}
                  onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                  className="bg-background"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(formData.correct_option === 'B' && 'text-success')}>
                  الخيار ب *
                </Label>
                <Input
                  value={formData.option_b}
                  onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                  className="bg-background"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(formData.correct_option === 'C' && 'text-success')}>
                  الخيار ج *
                </Label>
                <Input
                  value={formData.option_c}
                  onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                  className="bg-background"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(formData.correct_option === 'D' && 'text-success')}>
                  الخيار د *
                </Label>
                <Input
                  value={formData.option_d}
                  onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                  className="bg-background"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الإجابة الصحيحة *</Label>
                <Select
                  value={formData.correct_option}
                  onValueChange={(v) => setFormData({ ...formData, correct_option: v as 'A' | 'B' | 'C' | 'D' })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="A">الخيار أ</SelectItem>
                    <SelectItem value="B">الخيار ب</SelectItem>
                    <SelectItem value="C">الخيار ج</SelectItem>
                    <SelectItem value="D">الخيار د</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نموذج سنة الاختبار</Label>
                <Select
                  value={formData.exam_year}
                  onValueChange={(v) => setFormData({ ...formData, exam_year: v })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {EXAM_YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        نموذج {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظة إرشادية (اختياري)</Label>
              <Textarea
                value={formData.hint}
                onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                rows={2}
                className="bg-background"
                placeholder="تظهر للطالب بعد انتهاء الاختبار"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="gradient-primary text-primary-foreground border-0"
              >
                {saveMutation.isPending ? 'جاري الحفظ...' : editingQuestion ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {role === 'admin' ? 'تأكيد الحذف' : 'طلب حذف'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {role === 'admin'
                ? 'هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'سيتم إرسال طلب حذف هذا السؤال للمسؤول للموافقة عليه.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuestion && deleteMutation.mutate(deleteQuestion)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {role === 'admin' ? 'حذف' : 'إرسال الطلب'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        subjectId={selectedSubject}
      />
    </AdminLayout>
  );
};

export default AdminQuestions;
