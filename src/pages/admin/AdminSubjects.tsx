import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Edit2, Trash2, BookOpen, Clock, Target, Settings, User, Lock, Upload, Loader2, FileText, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Level, Subject, ReviewPassword } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { KeyRound, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AdminSEO } from '@/components/seo/SEOHead';
import * as XLSX from 'xlsx';
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

// ── مكوّن طلبات الاشتراك ──
const AdminSubjects = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);
  const [uploadingHtml, setUploadingHtml] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [formData, setFormData] = useState({
    name: '', description: '', default_time_minutes: 30, allow_time_modification: true,
    min_time_minutes: 10, max_time_minutes: 120, questions_per_exam: 20,
    passing_score: 60, password: '', author_name: '', summary_url: '', show_subscription: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
        const { error } = await supabase.from('subjects').update({ order_index: item.order_index }).eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); toast({ title: 'تم تحديث الترتيب' }); },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingSubject) {
        const { error } = await supabase.from('subjects').update({
          name: data.name, description: data.description || null,
          default_time_minutes: data.default_time_minutes, allow_time_modification: data.allow_time_modification,
          min_time_minutes: data.min_time_minutes, max_time_minutes: data.max_time_minutes,
          questions_per_exam: data.questions_per_exam, passing_score: data.passing_score,
          password: data.password || null, author_name: data.author_name || null, summary_url: data.summary_url || null,
          show_subscription: data.show_subscription ?? false,
        }).eq('id', editingSubject.id);
        if (error) throw error;
      } else {
        const maxOrder = Math.max(...subjects.map(s => s.order_index), 0);
        const { error } = await supabase.from('subjects').insert({
          level_id: selectedLevel, name: data.name, description: data.description || null,
          default_time_minutes: data.default_time_minutes, allow_time_modification: data.allow_time_modification,
          min_time_minutes: data.min_time_minutes, max_time_minutes: data.max_time_minutes,
          questions_per_exam: data.questions_per_exam, passing_score: data.passing_score,
          password: data.password || null, author_name: data.author_name || null,
          summary_url: data.summary_url || null, order_index: maxOrder + 1,
          show_subscription: data.show_subscription ?? false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: editingSubject ? 'تم تحديث المادة' : 'تم إضافة المادة بنجاح' });
      handleCloseDialog();
    },
    onError: () => { toast({ title: 'حدث خطأ', variant: 'destructive' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (subject: Subject) => {
      const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); toast({ title: 'تم حذف المادة' }); setDeleteSubject(null); },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = subjects.findIndex(s => s.id === active.id);
      const newIndex = subjects.findIndex(s => s.id === over.id);
      const newSubjects = arrayMove(subjects, oldIndex, newIndex);
      const newOrder = newSubjects.map((subject, index) => ({ id: subject.id, order_index: index + 1 }));
      queryClient.setQueryData(['subjects', selectedLevel], newSubjects);
      reorderMutation.mutate(newOrder);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false); setEditingSubject(null);
    setFormData({ name: '', description: '', default_time_minutes: 30, allow_time_modification: true, min_time_minutes: 10, max_time_minutes: 120, questions_per_exam: 20, passing_score: 60, password: '', author_name: '', summary_url: '', show_subscription: false });
    setUploadSuccess(false); setUploadError('');
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, description: subject.description || '', default_time_minutes: subject.default_time_minutes, allow_time_modification: subject.allow_time_modification, min_time_minutes: subject.min_time_minutes || 10, max_time_minutes: subject.max_time_minutes || 120, questions_per_exam: subject.questions_per_exam, passing_score: subject.passing_score, password: subject.password || '', author_name: subject.author_name || '', summary_url: subject.summary_url || '', show_subscription: subject.show_subscription ?? false });
    setIsDialogOpen(true);
  };

  const handleHtmlUpload = async (file: File) => {
    if (!file || !file.name.endsWith('.html')) { setUploadError('يرجى اختيار ملف HTML فقط'); return; }
    setUploadingHtml(true); setUploadError(''); setUploadSuccess(false);
    try {
      const fileName = `summaries/${editingSubject?.id || 'new'}_${Date.now()}.html`;
      const { error: upErr } = await supabase.storage.from('summaries').upload(fileName, file, { upsert: true, contentType: 'text/html' });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('summaries').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, summary_url: urlData.publicUrl }));
      setUploadSuccess(true);
    } catch (err: any) { setUploadError(err?.message || 'فشل رفع الملف'); }
    finally { setUploadingHtml(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { toast({ title: 'يرجى إدخال اسم المادة', variant: 'destructive' }); return; }
    saveMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <AdminSEO pageName="إدارة المواد" />
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">إدارة المواد</h1>
            <p className="text-sm text-muted-foreground">اسحب وأفلت لإعادة ترتيب المواد</p>
          </div>
          <Button size="sm" onClick={() => setIsDialogOpen(true)} disabled={!selectedLevel || role !== 'admin'} className="gradient-primary text-primary-foreground border-0 gap-1.5 w-fit text-xs sm:text-sm">
            <Plus className="w-4 h-4" /> إضافة مادة
          </Button>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <Label className="text-sm mb-2 block">اختر المستوى</Label>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="bg-background max-w-md"><SelectValue placeholder="اختر المستوى لعرض المواد" /></SelectTrigger>
            <SelectContent className="bg-popover">{levels.map((level) => (<SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border">
          {!selectedLevel ? (
            <div className="p-8 sm:p-12 text-center text-muted-foreground"><BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" /><p className="text-sm sm:text-base">اختر مستوى لعرض المواد</p></div>
          ) : isLoading ? (
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-28 sm:h-24 rounded-lg" />))}</div>
          ) : subjects.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-muted-foreground"><BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" /><p className="text-sm sm:text-base">لا توجد مواد في هذا المستوى</p></div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={subjects.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="divide-y">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                      <SortableItem id={subject.id}>
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-sm sm:text-base truncate">{subject.name}</h3>
                              {subject.password && <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />}
                            </div>
                            {subject.description && <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{subject.description}</p>}
                            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{subject.default_time_minutes} د</span>
                              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{subject.passing_score}%</span>
                              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{subject.questions_per_exam} سؤال</span>
                              {subject.author_name && <span className="flex items-center gap-1 hidden sm:flex"><User className="w-4 h-4" />{subject.author_name}</span>}
                              {subject.summary_url && <span className="flex items-center gap-1 text-emerald-600"><FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />ملخص</span>}
                            </div>
                          </div>
                          {role === 'admin' && (
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 shrink-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => handleEdit(subject)}><Edit2 className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 text-destructive hover:text-destructive" onClick={() => setDeleteSubject(subject)}><Trash2 className="w-4 h-4" /></Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />{editingSubject ? 'تعديل إعدادات المادة' : 'إضافة مادة جديدة'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground">المعلومات الأساسية</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label className="text-sm">اسم المادة *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-background" required />
                </div>
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label className="text-sm">الوصف</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-background" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">اسم مُعدّ الأسئلة</Label>
                  <Input value={formData.author_name} onChange={(e) => setFormData({ ...formData, author_name: e.target.value })} className="bg-background" placeholder="اختياري" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm"><Lock className="w-4 h-4 text-amber-500" />كلمة مرور الاختبار</Label>
                  <Input value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="bg-background" placeholder="اتركها فارغة للوصول المفتوح" />
                </div>
                {editingSubject && (
                  <div className="col-span-1 sm:col-span-2">
                    <ReviewPasswordsSection subjectId={editingSubject.id} levels={levels} />
                  </div>
                )}
                <div className="space-y-3 col-span-1 sm:col-span-2 p-4 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <Label className="flex items-center gap-2 text-sm font-black"><FileText className="w-4 h-4 text-emerald-600" /> ملخص المادة (ملف HTML)</Label>
                  <label className="flex items-center justify-center gap-2 w-full h-12 rounded-xl cursor-pointer transition-all font-black text-sm text-white" style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}>
                    {uploadingHtml ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الرفع...</> : <><Upload className="w-4 h-4" /> {formData.summary_url ? 'استبدال الملف' : 'رفع ملف HTML'}</>}
                    <input type="file" accept=".html,text/html" className="hidden" disabled={uploadingHtml} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHtmlUpload(f); e.target.value = ''; }} />
                  </label>
                  {uploadSuccess && <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg px-3 py-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> تم رفع الملف بنجاح!</div>}
                  {uploadError && <div className="flex items-center gap-2 text-xs font-black text-destructive bg-destructive/10 rounded-lg px-3 py-2"><XCircle className="w-4 h-4 shrink-0" /> {uploadError}</div>}
                  {formData.summary_url && (
                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-card rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 min-w-0"><FileText className="w-4 h-4 text-emerald-600 shrink-0" /><span className="text-xs font-bold text-muted-foreground truncate">ملف مرفوع</span></div>
                      <div className="flex items-center gap-3 shrink-0">
                        <a href={formData.summary_url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-emerald-600 hover:underline">معاينة</a>
                        <button type="button" onClick={() => { setFormData(prev => ({ ...prev, summary_url: '' })); setUploadSuccess(false); }} className="text-xs font-black text-destructive hover:underline">حذف</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── إظهار زر الاشتراك ── */}
            <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-blue-100 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20">
              <div>
                <p className="font-black text-sm text-slate-700 dark:text-slate-200">💳 إظهار زر الاشتراك للزوار</p>
                <p className="text-[11px] text-slate-400 mt-0.5">يظهر زر "اشترك للحصول على كلمة المرور — 1000 ريال"</p>
              </div>
              <button type="button"
                onClick={() => setFormData(prev => ({ ...prev, show_subscription: !prev.show_subscription }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${formData.show_subscription ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${formData.show_subscription ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground">إعدادات الاختبار</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">عدد الأسئلة لكل اختبار</Label>
                  <Input type="number" value={formData.questions_per_exam} onChange={(e) => setFormData({ ...formData, questions_per_exam: parseInt(e.target.value) || 20 })} className="bg-background" min={1} max={100} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">درجة النجاح (%)</Label>
                  <Input type="number" value={formData.passing_score} onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 60 })} className="bg-background" min={1} max={100} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground">إعدادات الوقت</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">الوقت الافتراضي (دقيقة)</Label>
                  <Input type="number" value={formData.default_time_minutes} onChange={(e) => setFormData({ ...formData, default_time_minutes: parseInt(e.target.value) || 30 })} className="bg-background" min={5} max={180} />
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg gap-3">
                  <div className="min-w-0">
                    <Label className="text-sm">السماح للطالب بتعديل الوقت</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">يمكن للطالب اختيار وقت مختلف</p>
                  </div>
                  <Switch checked={formData.allow_time_modification} onCheckedChange={(checked) => setFormData({ ...formData, allow_time_modification: checked })} />
                </div>
                {formData.allow_time_modification && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">الحد الأدنى (دقيقة)</Label>
                      <Input type="number" value={formData.min_time_minutes} onChange={(e) => setFormData({ ...formData, min_time_minutes: parseInt(e.target.value) || 10 })} className="bg-background" min={5} max={formData.max_time_minutes} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">الحد الأقصى (دقيقة)</Label>
                      <Input type="number" value={formData.max_time_minutes} onChange={(e) => setFormData({ ...formData, max_time_minutes: parseInt(e.target.value) || 120 })} className="bg-background" min={formData.min_time_minutes} max={180} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── طلبات الاشتراك — صفحة مستقلة ── */}
            {editingSubject && (
              <a
                href="/admin/payment-requests"
                className="flex items-center justify-between w-full p-3 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-right"
              >
                <span className="text-xs text-blue-500 dark:text-blue-400">↗ عرض الكل</span>
                <span className="text-sm font-black text-blue-700 dark:text-blue-300">💳 إدارة طلبات الاشتراك</span>
              </a>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">إلغاء</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="w-full sm:w-auto gradient-primary text-primary-foreground border-0">
                {saveMutation.isPending ? 'جاري الحفظ...' : editingSubject ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSubject} onOpenChange={() => setDeleteSubject(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-sm">هل أنت متأكد من حذف مادة &quot;{deleteSubject?.name}&quot;؟ سيتم حذف جميع الأسئلة المرتبطة بها.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row-reverse gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSubject && deleteMutation.mutate(deleteSubject)} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};


const ReviewPasswordsSection = ({ subjectId, levels }: { subjectId: string; levels: Level[] }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newContact, setNewContact] = useState('');
  const [newContactType, setNewContactType] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editDuration, setEditDuration] = useState<number>(30);
  const importRef = useRef<HTMLInputElement>(null);

  // ── مفتاح localStorage لبيانات التواصل ──
  const CONTACTS_KEY = 'review_pwd_contacts';
  const getContacts = (): Record<string, string> => {
    try { return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '{}'); } catch { return {}; }
  };
  const saveContact = (pwdId: string, contact: string) => {
    const all = getContacts();
    if (contact.trim()) { all[pwdId] = contact.trim(); } else { delete all[pwdId]; }
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(all));
  };

  const [extraLevelId, setExtraLevelId] = useState<string>('none');
  const [extraSubjectIds, setExtraSubjectIds] = useState<string[]>([]);

  type ImportRow = { id: string; label: string; password: string; duration: number; contact: string };
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importSelected, setImportSelected] = useState<Set<string>>(new Set());
  const [importPending, setImportPending] = useState(false);

  // ── توليد كلمة مرور عشوائية ──
  const [copiedPwd, setCopiedPwd] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setNewPassword(`${seg()}-${seg()}-${seg()}`);
  };

  const copyPassword = () => {
    if (!newPassword.trim()) return;
    navigator.clipboard.writeText(newPassword.trim());
    setCopiedPwd(true);
    setTimeout(() => setCopiedPwd(false), 2000);
  };

  const allImportChecked = importRows.length > 0 && importSelected.size === importRows.length;

  const toggleImportRow = (id: string) => {
    setImportSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleImportAll = () => {
    if (allImportChecked) { setImportSelected(new Set()); } else { setImportSelected(new Set(importRows.map(r => r.id))); }
  };

  const handleConfirmImport = async () => {
    const selected = importRows.filter(r => importSelected.has(r.id));
    if (selected.length === 0) { toast({ title: 'لم تحدد أي اسم', variant: 'destructive' }); return; }
    const allSubjectIds = [subjectId, ...extraSubjectIds.filter(id => id !== subjectId)];
    if (selected.length === 1) {
      setNewLabel(selected[0].label);
      setNewPassword(selected[0].password);
      setNewDuration(selected[0].duration);
      if (selected[0].contact) {
        setNewContact(selected[0].contact.replace(/^(whatsapp|telegram):/, ''));
        const raw = selected[0].contact;
        const autoType = raw.startsWith('telegram:') ? 'telegram'
          : raw.startsWith('whatsapp:') ? 'whatsapp'
          : (raw.startsWith('@') || /[a-zA-Z]/.test(raw.replace(/^\d+/, ''))) ? 'telegram' : 'whatsapp';
        setNewContactType(autoType);
      }
      setImportRows([]); setImportSelected(new Set());
      toast({ title: 'تم تعبئة البيانات', description: `${selected[0].label} — ${selected[0].password}` });
      return;
    }
    setImportPending(true);
    const records = selected.flatMap(r => allSubjectIds.map(sid => ({ subject_id: sid, password: r.password, label: r.label || null, duration_days: Number(newDuration) > 0 ? Number(newDuration) : r.duration, is_active: true })));
    const { error } = await (supabase as any).from('review_passwords').insert(records);
    setImportPending(false);
    if (error) { toast({ title: 'فشل الاستيراد', description: error.message, variant: 'destructive' }); return; }

    // حفظ contacts لكل سجل مضاف مع تحديد النوع تلقائياً
    for (const r of selected) {
      if (!r.contact) continue;
      // لو بصيغة whatsapp:xxx أو telegram:xxx → استخدمها مباشرة
      // وإلا حدد النوع تلقائياً
      const contactToSave = (r.contact.startsWith('whatsapp:') || r.contact.startsWith('telegram:'))
        ? r.contact
        : `${(r.contact.startsWith('@') || /[a-zA-Z]/.test(r.contact.replace(/^\d+/, ''))) ? 'telegram' : 'whatsapp'}:${r.contact}`;
      for (const sid of allSubjectIds) {
        const { data: latest } = await (supabase as any)
          .from('review_passwords').select('id')
          .eq('subject_id', sid).eq('password', r.password)
          .order('created_at', { ascending: false }).limit(1);
        if (latest?.[0]?.id) saveContact(latest[0].id, contactToSave);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['review_passwords', subjectId] });
    setImportRows([]); setImportSelected(new Set());
    toast({ title: allSubjectIds.length > 1 ? `تم استيراد ${selected.length} طالب × ${allSubjectIds.length} مواد = ${records.length} سجل` : `تم استيراد ${records.length} طالب بنجاح` });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
        const rows = data.filter((r: any[]) => r.length >= 2);
        if (rows.length === 0) { toast({ title: 'الملف فارغ أو غير صحيح', variant: 'destructive' }); return; }
        const startIdx = (typeof rows[0][1] === 'string' && isNaN(Number(rows[0][1]))) ? 1 : 0;
        const dataRows = rows.slice(startIdx);
        if (dataRows.length === 0) { toast({ title: 'لا توجد بيانات بعد الهيدر', variant: 'destructive' }); return; }
        const parsed: ImportRow[] = dataRows.map((r: any[], i: number) => {
          // تحديد نوع الملف:
          // مُصدَّر جديد (8 أعمدة):  الاسم | كلمة المرور | المادة | المدة | المعرف | الحالة | ...
          // مُصدَّر قديم (9 أعمدة):  الاسم | كلمة المرور | المادة | المدة | نوع التواصل | الرقم | الحالة | ...
          // يدوي (4 أعمدة):          الاسم | كلمة المرور | الأيام | المعرف

          const col3 = String(r[2] || '').trim();
          const col4 = String(r[3] || '').trim();
          const col5 = String(r[4] || '').trim();
          const col6 = String(r[5] || '').trim();

          // ملف مُصدَّر قديم: العمود 5 = واتساب/تيليجرام نصاً
          const isOldExport = col5 === 'واتساب' || col5 === 'تيليجرام' || col5 === 'whatsapp' || col5 === 'telegram';
          // ملف مُصدَّر جديد: العمود 5 يبدأ بـ whatsapp: أو telegram: أو فارغ، والعمود 3 نص (المادة)
          const isNewExport = (col5.startsWith('whatsapp:') || col5.startsWith('telegram:') || col5 === '') && isNaN(Number(col3)) && col3 !== '';
          // ملف يدوي: العمود 3 رقم (الأيام) أو فارغ
          const isManual = !isOldExport && !isNewExport;

          let duration = 30;
          let contact = '';

          if (isOldExport) {
            duration = Number(col4) > 0 ? Number(col4) : 30;
            if (col6) {
              const type = (col5 === 'تيليجرام' || col5 === 'telegram') ? 'telegram' : 'whatsapp';
              contact = `${type}:${col6.replace(/\s/g, '')}`;
            }
          } else if (isNewExport) {
            duration = Number(col4) > 0 ? Number(col4) : 30;
            if (col5.startsWith('whatsapp:') || col5.startsWith('telegram:')) {
              contact = col5.replace(/\s/g, '');
            }
          } else {
            // يدوي
            duration = Number(col3) > 0 ? Number(col3) : 30;
            if (col4) {
              if (col4.startsWith('whatsapp:') || col4.startsWith('telegram:')) {
                contact = col4.replace(/\s/g, '');
              } else {
                const autoType = (col4.startsWith('@') || /[a-zA-Z]/.test(col4.replace(/^\d+/, ''))) ? 'telegram' : 'whatsapp';
                contact = `${autoType}:${col4.replace(/\s/g, '')}`;
              }
            }
          }

          return {
            id: `import-${i}`,
            label: String(r[0] || '').trim(),
            password: String(r[1] || '').trim(),
            duration,
            contact,
          };
        }).filter(r => r.password);
        if (parsed.length === 0) { toast({ title: 'لا توجد كلمات مرور صالحة', variant: 'destructive' }); return; }
        setImportRows(parsed); setImportSelected(new Set(parsed.map(r => r.id)));
      } catch { toast({ title: 'تعذّر قراءة الملف', variant: 'destructive' }); }
      finally { if (importRef.current) importRef.current.value = ''; }
    };
    reader.readAsBinaryString(file);
  };

  const { data: passwords = [], isLoading } = useQuery({
    queryKey: ['review_passwords', subjectId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('review_passwords').select('*').eq('subject_id', subjectId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ReviewPassword[];
    },
  });

  const { data: levelSubjects = [] } = useQuery({
    queryKey: ['subjects-for-level', extraLevelId],
    queryFn: async () => {
      if (!extraLevelId || extraLevelId === 'none') return [];
      const { data, error } = await supabase.from('subjects').select('id, name').eq('level_id', extraLevelId).order('order_index');
      if (error) throw error;
      return (data || []) as Pick<Subject, 'id' | 'name'>[];
    },
    enabled: !!extraLevelId && extraLevelId !== 'none',
  });

  const handleExtraLevelChange = (val: string) => { setExtraLevelId(val); setExtraSubjectIds([]); };
  const toggleExtraSubject = (id: string) => { setExtraSubjectIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]); };
  const isExpired = (p: ReviewPassword) => !p.is_active || (p.expires_at && new Date(p.expires_at) < new Date());

  const addMutation = useMutation({
    mutationFn: async () => {
      const duration = Number(newDuration) > 0 ? Number(newDuration) : 30;
      const allSubjectIds = [subjectId, ...extraSubjectIds.filter(id => id !== subjectId)];
      const records = allSubjectIds.map(sid => ({ subject_id: sid, password: newPassword.trim(), label: newLabel.trim() || null, duration_days: duration, is_active: true }));
      const { error } = await (supabase as any).from('review_passwords').insert(records);
      if (error) throw error;
    },
    onSuccess: async () => {
      // جلب كل السجلات المضافة حديثاً لحفظ contact لكل منها
      if (newContact.trim()) {
        const allSubjectIds = [subjectId, ...extraSubjectIds.filter(id => id !== subjectId)];
        for (const sid of allSubjectIds) {
          const { data: latest } = await (supabase as any)
            .from('review_passwords')
            .select('id')
            .eq('subject_id', sid)
            .eq('password', newPassword.trim())
            .order('created_at', { ascending: false })
            .limit(1);
          if (latest?.[0]?.id) saveContact(latest[0].id, `${newContactType}:${newContact.trim()}`);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['review_passwords', subjectId] });
      setNewLabel(''); setNewPassword(''); setNewDuration(30); setNewContact(''); setNewContactType('whatsapp');
      setExtraLevelId('none'); setExtraSubjectIds([]);
      toast({ title: 'تمت إضافة كلمة المرور' });
    },
    onError: (e: any) => toast({ title: 'حدث خطأ', description: e?.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from('review_passwords').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['review_passwords', subjectId] }); toast({ title: 'تم الحذف' }); },
  });

  const renewMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from('review_passwords').update({ first_used_at: null, expires_at: null, device_fingerprint: null, is_active: true }).eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['review_passwords', subjectId] }); toast({ title: 'تم تجديد كلمة المرور' }); },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, password, duration_days, p }: { id: string; password: string; duration_days: number; p: ReviewPassword }) => {
      const updates: any = { password: password.trim(), duration_days };
      if (p.first_used_at) { const newExpiry = new Date(p.first_used_at); newExpiry.setDate(newExpiry.getDate() + duration_days); updates.expires_at = newExpiry.toISOString(); }
      const { error } = await (supabase as any).from('review_passwords').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['review_passwords', subjectId] }); setEditingId(null); toast({ title: 'تم التحديث' }); },
    onError: (e: any) => toast({ title: 'فشل التحديث', description: e?.message, variant: 'destructive' }),
  });

  const handleAdd = () => {
    if (!newPassword.trim()) { toast({ title: 'أدخل كلمة المرور', variant: 'destructive' }); return; }
    addMutation.mutate();
  };

  const startEdit = (p: ReviewPassword) => { setEditingId(p.id); setEditPassword(p.password); setEditDuration(p.duration_days || 30); };

  return (
    <div className="space-y-4 p-4 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-600" />
          <h3 className="font-black text-sm">كلمات مرور اختبار+ المراجعة</h3>
        </div>
        <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5 h-8" onClick={() => importRef.current?.click()}>
          <Upload className="w-3.5 h-3.5" /> استيراد Excel
        </Button>
        <input ref={importRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
      </div>
      <p className="text-[10px] text-muted-foreground -mt-2">
        صيغة الاستيراد: العمود الأول = الاسم، الثاني = كلمة المرور، الثالث = الأيام (اختياري).
      </p>

      {importRows.length > 0 && (
        <div className="rounded-lg border bg-background overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-b">
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
              <input type="checkbox" checked={allImportChecked} onChange={toggleImportAll} className="accent-emerald-600 w-3.5 h-3.5" />
              تحديد الكل ({importRows.length})
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{importSelected.size} محدد</span>
              <Button type="button" size="sm" className="h-7 text-xs gradient-primary text-primary-foreground border-0" disabled={importSelected.size === 0 || importPending} onClick={handleConfirmImport}>
                {importPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} إضافة المحدد
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => { setImportRows([]); setImportSelected(new Set()); }}>
                <XCircle className="w-3 h-3" /> إلغاء
              </Button>
            </div>
          </div>
          <div className="divide-y max-h-52 overflow-y-auto">
            {importRows.map(r => (
              <label key={r.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40 select-none">
                <input type="checkbox" checked={importSelected.has(r.id)} onChange={() => toggleImportRow(r.id)} className="accent-emerald-600 w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-semibold flex-1 truncate">{r.label || '—'}</span>
                <span className="text-xs font-mono text-muted-foreground">{r.password}</span>
                {r.contact && <span className="text-[11px] text-blue-500 font-mono shrink-0">{r.contact}</span>}
                <span className="text-[11px] text-muted-foreground shrink-0">{r.duration} يوم</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* نموذج الإضافة */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2">
        <Input placeholder="اسم الطالب (label)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="bg-background" />
        <div className="flex gap-1">
          <Input placeholder="كلمة المرور" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-background flex-1 min-w-0" />
          <Button type="button" variant="outline" size="sm" className="shrink-0 px-2 h-10 border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={generatePassword} title="توليد كلمة مرور عشوائية">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" variant="outline" size="sm" className="shrink-0 px-2 h-10 border-slate-200" onClick={copyPassword} disabled={!newPassword.trim()} title="نسخ كلمة المرور">
            {copiedPwd ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
        <Input type="number" min={1} placeholder="أيام" value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))} className="bg-background" title="مدة الصلاحية بالأيام" />
        <Button type="button" onClick={handleAdd} disabled={addMutation.isPending} className="gradient-primary text-primary-foreground border-0">
          <Plus className="w-4 h-4" /> إضافة
        </Button>
      </div>
      <div className="flex gap-1">
        <Select value={newContactType} onValueChange={(v) => setNewContactType(v as 'whatsapp' | 'telegram')}>
          <SelectTrigger className="bg-background h-10 w-32 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">واتساب</SelectItem>
            <SelectItem value="telegram">تيليجرام</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder={newContactType === 'whatsapp' ? 'رقم الواتساب مثال: 967700000000' : 'معرف أو رقم تيليجرام'}
          value={newContact}
          onChange={(e) => setNewContact(e.target.value)}
          className="bg-background text-xs flex-1"
          dir="ltr"
        />
      </div>

      {/* مواد إضافية */}
      <div className="space-y-2 pt-1">
        <p className="text-[11px] font-bold text-muted-foreground">صلاحية لمواد إضافية (اختياري)</p>
        <Select value={extraLevelId} onValueChange={handleExtraLevelChange}>
          <SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر المستوى لعرض موادّه..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— بدون مواد إضافية —</SelectItem>
            {levels.map(l => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
          </SelectContent>
        </Select>
        {extraLevelId !== 'none' && levelSubjects.length > 0 && (
          <div className="rounded-lg border bg-background p-3 grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-3">
            {levelSubjects.map(s => {
              const isCurrent = s.id === subjectId;
              const checked = isCurrent || extraSubjectIds.includes(s.id);
              return (
                <label key={s.id} className={`flex items-center gap-2 text-xs cursor-pointer select-none ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input type="checkbox" checked={checked} disabled={isCurrent} onChange={() => !isCurrent && toggleExtraSubject(s.id)} className="accent-emerald-600 w-3.5 h-3.5" />
                  <span className="truncate">{s.name}</span>
                  {isCurrent && <span className="text-[10px] text-emerald-600">(الحالية)</span>}
                </label>
              );
            })}
          </div>
        )}
        {extraSubjectIds.length > 0 && (
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
            ✓ ستُضاف كلمة المرور لـ {extraSubjectIds.length + 1} مادة (المادة الحالية + {extraSubjectIds.length} إضافية)
          </p>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">المدة الافتراضية 30 يومًا. يبدأ احتساب الصلاحية من أول استخدام.</p>

      {isLoading ? (
        <Skeleton className="h-24 rounded-lg" />
      ) : passwords.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">لا توجد كلمات مرور</p>
      ) : (
        <div className="rounded-lg border overflow-x-auto bg-background">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-muted/50">
              <tr className="text-right">
                <th className="p-2 font-bold">الاسم</th>
                <th className="p-2 font-bold">كلمة المرور</th>
                <th className="p-2 font-bold">المدة</th>
                <th className="p-2 font-bold">الحالة</th>
                <th className="p-2 font-bold hidden sm:table-cell">الانتهاء</th>
                <th className="p-2 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {passwords.map((p) => {
                const expired = isExpired(p);
                const editing = editingId === p.id;
                return (
                  <tr key={p.id} className={expired ? 'text-muted-foreground bg-muted/20' : ''}>
                    <td className="p-2">{p.label || '—'}</td>
                    <td className="p-2 font-mono">{editing ? <Input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="h-8 text-xs" /> : p.password}</td>
                    <td className="p-2">{editing ? <Input type="number" min={1} value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value))} className="h-8 w-20 text-xs" /> : `${p.duration_days || 30} يوم`}</td>
                    <td className="p-2">{expired ? <Badge variant="secondary" className="bg-muted text-muted-foreground">منتهية</Badge> : <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">نشطة</Badge>}</td>
                    <td className="p-2 hidden sm:table-cell whitespace-nowrap">{p.expires_at ? new Date(p.expires_at).toLocaleDateString('ar') : '—'}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        {editing ? (
                          <>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => editMutation.mutate({ id: p.id, password: editPassword, duration_days: editDuration, p })} disabled={editMutation.isPending || !editPassword.trim()} title="حفظ"><CheckCircle2 className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)} title="إلغاء"><XCircle className="w-4 h-4" /></Button>
                          </>
                        ) : (
                          <>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)} title="تعديل"><Edit2 className="w-4 h-4" /></Button>
                            {expired && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => renewMutation.mutate(p.id)} disabled={renewMutation.isPending} title="تجديد"><RefreshCw className="w-4 h-4" /></Button>}
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(p.id)} disabled={deleteMutation.isPending} title="حذف"><Trash2 className="w-4 h-4" /></Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSubjects;
