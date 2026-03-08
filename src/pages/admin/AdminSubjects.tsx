import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Edit2, Trash2, BookOpen, Clock, Target, Settings, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Level, Subject } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AdminSEO } from '@/components/seo/SEOHead';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '@/components/admin/SortableItem';

const AdminSubjects = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_time_minutes: 30,
    allow_time_modification: true,
    min_time_minutes: 10,
    max_time_minutes: 120,
    questions_per_exam: 20,
    passing_score: 60,
    password: '',
    author_name: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('levels').select('*').order('order_index');
      if (error) throw error;
      return data as Level[];
    },
  });

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects', selectedLevel],
    queryFn: async () => {
      let query = supabase.from('subjects').select('*').order('order_index');
      if (selectedLevel) query = query.eq('level_id', selectedLevel);
      const { data, error } = await query;
      if (error) throw error;
      return data as Subject[];
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (newOrder: { id: string; order_index: number }[]) => {
      for (const item of newOrder) {
        const { error } = await supabase
          .from('subjects')
          .update({ order_index: item.order_index })
          .eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: 'تم تحديث الترتيب' });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update({
            name: data.name,
            description: data.description || null,
            default_time_minutes: data.default_time_minutes,
            allow_time_modification: data.allow_time_modification,
            min_time_minutes: data.min_time_minutes,
            max_time_minutes: data.max_time_minutes,
            questions_per_exam: data.questions_per_exam,
            passing_score: data.passing_score,
            password: data.password || null,
            author_name: data.author_name || null,
          })
          .eq('id', editingSubject.id);
        if (error) throw error;
      } else {
        const maxOrder = Math.max(...subjects.map(s => s.order_index), 0);
        const { error } = await supabase.from('subjects').insert({
          level_id: selectedLevel,
          name: data.name,
          description: data.description || null,
          default_time_minutes: data.default_time_minutes,
          allow_time_modification: data.allow_time_modification,
          min_time_minutes: data.min_time_minutes,
          max_time_minutes: data.max_time_minutes,
          questions_per_exam: data.questions_per_exam,
          passing_score: data.passing_score,
          password: data.password || null,
          author_name: data.author_name || null,
          order_index: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: editingSubject ? 'تم تحديث المادة' : 'تم إضافة المادة بنجاح' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (subject: Subject) => {
      const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: 'تم حذف المادة' });
      setDeleteSubject(null);
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subjects.findIndex((s) => s.id === active.id);
      const newIndex = subjects.findIndex((s) => s.id === over.id);

      const newSubjects = arrayMove(subjects, oldIndex, newIndex);
      const newOrder = newSubjects.map((subject, index) => ({
        id: subject.id,
        order_index: index + 1,
      }));

      // Optimistic update
      queryClient.setQueryData(['subjects', selectedLevel], newSubjects);
      reorderMutation.mutate(newOrder);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      description: '',
      default_time_minutes: 30,
      allow_time_modification: true,
      min_time_minutes: 10,
      max_time_minutes: 120,
      questions_per_exam: 20,
      passing_score: 60,
      password: '',
      author_name: '',
    });
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      default_time_minutes: subject.default_time_minutes,
      allow_time_modification: subject.allow_time_modification,
      min_time_minutes: subject.min_time_minutes || 10,
      max_time_minutes: subject.max_time_minutes || 120,
      questions_per_exam: subject.questions_per_exam,
      passing_score: subject.passing_score,
      password: subject.password || '',
      author_name: subject.author_name || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: 'يرجى إدخال اسم المادة', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <AdminSEO pageName="إدارة المواد" />
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">إدارة المواد</h1>
            <p className="text-sm text-muted-foreground">اسحب وأفلت لإعادة ترتيب المواد</p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            disabled={!selectedLevel || role !== 'admin'}
            className="gradient-primary text-primary-foreground border-0 gap-1.5 w-fit text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            إضافة مادة
          </Button>
        </div>

        {/* Level Filter */}
        <div className="bg-card rounded-xl border p-4">
          <Label className="text-sm mb-2 block">اختر المستوى</Label>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="bg-background max-w-md">
              <SelectValue placeholder="اختر المستوى لعرض المواد" />
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

        {/* Subjects List */}
        <div className="bg-card rounded-xl border">
          {!selectedLevel ? (
            <div className="p-8 sm:p-12 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">اختر مستوى لعرض المواد</p>
            </div>
          ) : isLoading ? (
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 sm:h-24 rounded-lg" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">لا توجد مواد في هذا المستوى</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subjects.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                      <SortableItem id={subject.id}>
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-sm sm:text-base truncate">{subject.name}</h3>
                              {subject.password && (
                                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                              )}
                            </div>
                            {subject.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{subject.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {subject.default_time_minutes} د
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {subject.passing_score}%
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {subject.questions_per_exam} سؤال
                              </span>
                              {subject.author_name && (
                                <span className="flex items-center gap-1 hidden sm:flex">
                                  <User className="w-4 h-4" />
                                  {subject.author_name}
                                </span>
                              )}
                            </div>
                          </div>
                          {role === 'admin' && (
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 shrink-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => handleEdit(subject)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 sm:h-10 sm:w-10 text-destructive hover:text-destructive"
                                onClick={() => setDeleteSubject(subject)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </SortableItem>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {editingSubject ? 'تعديل إعدادات المادة' : 'إضافة مادة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground">المعلومات الأساسية</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label className="text-sm">اسم المادة *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background"
                    required
                  />
                </div>
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label className="text-sm">الوصف</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">اسم مُعدّ الأسئلة</Label>
                  <Input
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    className="bg-background"
                    placeholder="اختياري"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Lock className="w-4 h-4 text-amber-500" />
                    كلمة مرور الاختبار
                  </Label>
                  <Input
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-background"
                    placeholder="اتركها فارغة للوصول المفتوح"
                  />
                </div>
              </div>
            </div>

            {/* Exam Settings */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground">إعدادات الاختبار</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">عدد الأسئلة لكل اختبار</Label>
                  <Input
                    type="number"
                    value={formData.questions_per_exam}
                    onChange={(e) => setFormData({ ...formData, questions_per_exam: parseInt(e.target.value) || 20 })}
                    className="bg-background"
                    min={1}
                    max={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">درجة النجاح (%)</Label>
                  <Input
                    type="number"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 60 })}
                    className="bg-background"
                    min={1}
                    max={100}
                  />
                </div>
              </div>
            </div>

            {/* Time Settings */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground">إعدادات الوقت</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">الوقت الافتراضي (دقيقة)</Label>
                  <Input
                    type="number"
                    value={formData.default_time_minutes}
                    onChange={(e) => setFormData({ ...formData, default_time_minutes: parseInt(e.target.value) || 30 })}
                    className="bg-background"
                    min={5}
                    max={180}
                  />
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg gap-3">
                  <div className="min-w-0">
                    <Label className="text-sm">السماح للطالب بتعديل الوقت</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">يمكن للطالب اختيار وقت مختلف</p>
                  </div>
                  <Switch
                    checked={formData.allow_time_modification}
                    onCheckedChange={(checked) => setFormData({ ...formData, allow_time_modification: checked })}
                  />
                </div>
                {formData.allow_time_modification && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">الحد الأدنى (دقيقة)</Label>
                      <Input
                        type="number"
                        value={formData.min_time_minutes}
                        onChange={(e) => setFormData({ ...formData, min_time_minutes: parseInt(e.target.value) || 10 })}
                        className="bg-background"
                        min={5}
                        max={formData.max_time_minutes}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">الحد الأقصى (دقيقة)</Label>
                      <Input
                        type="number"
                        value={formData.max_time_minutes}
                        onChange={(e) => setFormData({ ...formData, max_time_minutes: parseInt(e.target.value) || 120 })}
                        className="bg-background"
                        min={formData.min_time_minutes}
                        max={180}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full sm:w-auto gradient-primary text-primary-foreground border-0"
              >
                {saveMutation.isPending ? 'جاري الحفظ...' : editingSubject ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSubject} onOpenChange={() => setDeleteSubject(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-sm">
              هل أنت متأكد من حذف مادة "{deleteSubject?.name}"؟ سيتم حذف جميع الأسئلة المرتبطة بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row-reverse gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSubject && deleteMutation.mutate(deleteSubject)}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSubjects;
