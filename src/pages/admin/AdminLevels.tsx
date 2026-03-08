import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Edit2, Trash2, Layers, PowerOff, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Level } from '@/types/database';
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

const COLORS = [
  { name: 'أزرق', value: '#3B82F6' },
  { name: 'أخضر', value: '#10B981' },
  { name: 'برتقالي', value: '#F59E0B' },
  { name: 'أحمر', value: '#EF4444' },
  { name: 'بنفسجي', value: '#8B5CF6' },
  { name: 'وردي', value: '#EC4899' },
];

const AdminLevels = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [deleteLevel, setDeleteLevel] = useState<Level | null>(null);

  // ✅ حالة جديدة لنافذة التعطيل
  const [disableLevel, setDisableLevel] = useState<Level | null>(null);
  const [disableMessage, setDisableMessage] = useState('هذا القسم تحت الصيانة، يرجى المحاولة لاحقاً');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
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

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('levels').select('*').order('order_index');
      if (error) throw error;
      return data as Level[];
    },
  });

  const { data: subjectCounts = {} } = useQuery({
    queryKey: ['subject-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('level_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((s: any) => {
        counts[s.level_id] = (counts[s.level_id] || 0) + 1;
      });
      return counts;
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (newOrder: { id: string; order_index: number }[]) => {
      for (const item of newOrder) {
        const { error } = await supabase
          .from('levels')
          .update({ order_index: item.order_index })
          .eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast({ title: 'تم تحديث الترتيب' });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingLevel) {
        const { error } = await supabase
          .from('levels')
          .update({
            name: data.name,
            description: data.description || null,
            color: data.color,
          })
          .eq('id', editingLevel.id);
        if (error) throw error;
      } else {
        const maxOrder = Math.max(...levels.map(l => l.order_index), 0);
        const { error } = await supabase.from('levels').insert({
          name: data.name,
          description: data.description || null,
          color: data.color,
          order_index: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast({ title: editingLevel ? 'تم تحديث المستوى' : 'تم إضافة المستوى بنجاح' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (level: Level) => {
      const { error } = await supabase.from('levels').delete().eq('id', level.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast({ title: 'تم حذف المستوى' });
      setDeleteLevel(null);
    },
  });

  // ✅ Mutation لتعطيل أو تفعيل المستوى
  const toggleDisableMutation = useMutation({
    mutationFn: async ({
      level,
      disabled,
      message,
    }: {
      level: Level;
      disabled: boolean;
      message?: string;
    }) => {
      const { error } = await supabase
        .from('levels')
        .update({
          is_disabled: disabled,
          disabled_message: disabled ? message || 'هذا القسم غير متاح حالياً' : null,
        })
        .eq('id', level.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast({
        title: variables.disabled ? 'تم تعطيل المستوى' : 'تم تفعيل المستوى',
      });
      setDisableLevel(null);
    },
    onError: () => {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = levels.findIndex((l) => l.id === active.id);
      const newIndex = levels.findIndex((l) => l.id === over.id);

      const newLevels = arrayMove(levels, oldIndex, newIndex);
      const newOrder = newLevels.map((level, index) => ({
        id: level.id,
        order_index: index + 1,
      }));

      queryClient.setQueryData(['levels'], newLevels);
      reorderMutation.mutate(newOrder);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLevel(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
    });
  };

  const handleEdit = (level: Level) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      description: level.description || '',
      color: level.color || '#3B82F6',
    });
    setIsDialogOpen(true);
  };

  // ✅ فتح نافذة التعطيل
  const handleOpenDisable = (level: Level) => {
    setDisableLevel(level);
    setDisableMessage(level.disabled_message || 'هذا القسم تحت الصيانة، يرجى المحاولة لاحقاً');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: 'يرجى إدخال اسم المستوى', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(formData);
  };

  if (role !== 'admin') {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>ليس لديك صلاحية لإدارة المستويات</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">إدارة المستويات</h1>
            <p className="text-sm sm:text-base text-muted-foreground">اسحب وأفلت لإعادة ترتيب المستويات</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="gradient-primary text-primary-foreground border-0 gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            إضافة مستوى
          </Button>
        </div>

        {/* Levels List */}
        <div className="bg-card rounded-xl border">
          {isLoading ? (
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 sm:h-20 rounded-lg" />
              ))}
            </div>
          ) : levels.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-muted-foreground">
              <Layers className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm sm:text-base">لا توجد مستويات</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={levels.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y">
                  {levels.map((level, index) => (
                    <div
                      key={level.id}
                      className={`p-3 sm:p-4 hover:bg-muted/50 transition-colors ${
                        level.is_disabled ? 'opacity-60 bg-muted/30' : ''
                      }`}
                    >
                      <SortableItem id={level.id}>
                        <div className="flex items-center justify-between gap-2 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                            <div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold shrink-0 text-sm sm:text-base relative"
                              style={{
                                backgroundColor: level.is_disabled
                                  ? '#9CA3AF'
                                  : level.color || '#3B82F6',
                              }}
                            >
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm sm:text-base truncate">{level.name}</h3>
                                {/* ✅ شارة "معطّل" */}
                                {level.is_disabled && (
                                  <span className="text-[10px] sm:text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                    معطّل
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {subjectCounts[level.id] || 0} مادة
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            {/* ✅ زر تعطيل / تفعيل */}
                            {level.is_disabled ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9 text-green-600 hover:text-green-700"
                                title="تفعيل المستوى"
                                onClick={() =>
                                  toggleDisableMutation.mutate({
                                    level,
                                    disabled: false,
                                  })
                                }
                              >
                                <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9 text-orange-500 hover:text-orange-600"
                                title="تعطيل المستوى"
                                onClick={() => handleOpenDisable(level)}
                              >
                                <PowerOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                            )}

                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => handleEdit(level)}>
                              <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:text-destructive"
                              onClick={() => setDeleteLevel(level)}
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
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
        <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingLevel ? 'تعديل المستوى' : 'إضافة مستوى جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">اسم المستوى *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background text-sm sm:text-base"
                placeholder="مثال: المستوى الأول"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background text-sm sm:text-base"
                rows={2}
                placeholder="وصف اختياري للمستوى"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">اللون</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all ${
                      formData.color === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="gradient-primary text-primary-foreground border-0 w-full sm:w-auto"
              >
                {saveMutation.isPending ? 'جاري الحفظ...' : editingLevel ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ✅ نافذة تعطيل المستوى مع رسالة مخصصة */}
      <Dialog open={!!disableLevel} onOpenChange={() => setDisableLevel(null)}>
        <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <PowerOff className="w-5 h-5 text-orange-500" />
              تعطيل المستوى
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              سيظهر للزوار رسالة عند محاولة الدخول إلى{' '}
              <span className="font-semibold text-foreground">{disableLevel?.name}</span>.
            </p>
            <div className="space-y-2">
              <Label className="text-sm">رسالة التعطيل</Label>
              <Textarea
                value={disableMessage}
                onChange={(e) => setDisableMessage(e.target.value)}
                className="bg-background text-sm sm:text-base"
                rows={3}
                placeholder="مثال: هذا القسم تحت الصيانة، يرجى المحاولة لاحقاً"
              />
            </div>
            {/* معاينة الرسالة */}
            <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 p-3 sm:p-4 text-center space-y-1">
              <PowerOff className="w-6 h-6 text-orange-400 mx-auto" />
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                {disableMessage || 'هذا القسم غير متاح حالياً'}
              </p>
              <p className="text-xs text-orange-500 dark:text-orange-400">معاينة ما سيراه الزائر</p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
              <Button variant="outline" onClick={() => setDisableLevel(null)} className="w-full sm:w-auto">
                إلغاء
              </Button>
              <Button
                disabled={toggleDisableMutation.isPending}
                onClick={() =>
                  disableLevel &&
                  toggleDisableMutation.mutate({
                    level: disableLevel,
                    disabled: true,
                    message: disableMessage,
                  })
                }
                className="bg-orange-500 hover:bg-orange-600 text-white border-0 w-full sm:w-auto gap-2"
              >
                <PowerOff className="w-4 h-4" />
                {toggleDisableMutation.isPending ? 'جاري التعطيل...' : 'تعطيل المستوى'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLevel} onOpenChange={() => setDeleteLevel(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-sm sm:text-base">
              هل أنت متأكد من حذف "{deleteLevel?.name}"؟ سيتم حذف جميع المواد والأسئلة المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row-reverse gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLevel && deleteMutation.mutate(deleteLevel)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminLevels;
