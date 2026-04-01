/**
 * Alnasser Tech — BattleCreate
 * صفحة إنشاء غرفة المنافسة الجماعية
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Users, BookOpen, Hash, Clock, ChevronLeft, Loader2, Copy, Check, Play } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const BattleCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [creatorName, setCreatorName] = useState(() => localStorage.getItem('alnaseer_student_name') || '');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questionsCount, setQuestionsCount] = useState(20);
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [creating, setCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ code: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => (await supabase.from('levels').select('*').order('order_index')).data || [],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', selectedLevel],
    queryFn: async () => {
      let q = supabase.from('subjects').select('*').order('order_index');
      if (selectedLevel) q = q.eq('level_id', selectedLevel);
      return (await q).data || [];
    },
  });

  const { data: availableCount = 0 } = useQuery({
    queryKey: ['battle-q-count', selectedSubject],
    queryFn: async () => {
      const { count } = await supabase
        .from('questions').select('*', { count: 'exact', head: true })
        .eq('subject_id', selectedSubject).eq('status', 'active');
      return count || 0;
    },
    enabled: !!selectedSubject,
  });

  const maxQ = Math.min(availableCount, 50);

  const handleCreate = async () => {
    if (!creatorName.trim()) { toast({ title: 'أدخل اسمك', variant: 'destructive' }); return; }
    if (!selectedSubject) { toast({ title: 'اختر المادة', variant: 'destructive' }); return; }
    if (availableCount < 5) { toast({ title: 'لا توجد أسئلة كافية في هذه المادة', variant: 'destructive' }); return; }

    setCreating(true);
    try {
      // جلب الأسئلة عشوائياً
      const { data: questions } = await supabase
        .from('questions').select('id')
        .eq('subject_id', selectedSubject).eq('status', 'active');

      const shuffled = (questions || []).sort(() => Math.random() - 0.5).slice(0, questionsCount);
      const questionIds = shuffled.map(q => q.id);

      const code = generateCode();
      const { data: room, error } = await (supabase.from('battle_rooms' as any) as any).insert({
        code,
        subject_id: selectedSubject,
        creator_name: creatorName.trim(),
        status: 'waiting',
        max_players: maxPlayers,
        questions_count: questionsCount,
        time_minutes: timeMinutes,
        question_ids: questionIds,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }).select().single();

      if (error) throw error;

      // إضافة المنشئ كأول لاعب
      await (supabase.from('battle_players' as any) as any).insert({
        room_id: room.id,
        player_name: creatorName.trim(),
        is_creator: true,
        status: 'waiting',
      });

      localStorage.setItem('alnaseer_student_name', creatorName.trim());
      setCreatedRoom({ code: room.code, id: room.id });

    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/battle/${createdRoom?.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterRoom = () => {
    navigate(`/battle/${createdRoom?.code}`, {
      state: { playerName: creatorName, isCreator: true },
    });
  };

  if (createdRoom) {
    return (
      <MainLayout>
        <section className="py-8 min-h-[calc(100vh-80px)] flex items-center" dir="rtl">
          <div className="container mx-auto px-4 max-w-sm">
            <div className="bg-white dark:bg-card rounded-[2rem] border border-slate-100 dark:border-border shadow-xl p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-200">
                <Swords className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">كود الغرفة</p>
                <div className="text-6xl font-black text-slate-900 dark:text-white tracking-[0.2em] font-mono">
                  {createdRoom.code}
                </div>
                <p className="text-sm text-slate-500 mt-2">شارك هذا الكود مع أصدقائك</p>
              </div>

              <div className="space-y-3">
                <Button onClick={handleCopy} variant="outline" className="w-full h-12 rounded-2xl font-black gap-2">
                  {copied ? <><Check className="w-4 h-4 text-emerald-500" /> تم النسخ!</> : <><Copy className="w-4 h-4" /> نسخ رابط الغرفة</>}
                </Button>
                <Button onClick={handleEnterRoom} className="w-full h-12 rounded-2xl font-black gap-2 bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-lg">
                  <Play className="w-4 h-4" /> دخول الغرفة
                </Button>
              </div>

              <p className="text-[10px] text-slate-400 font-bold">
                الغرفة صالحة لمدة ساعتين · حد أقصى {maxPlayers} لاعبين
              </p>
            </div>
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="py-8 min-h-[calc(100vh-80px)]" dir="rtl">
        <div className="container mx-auto px-4 max-w-lg">

          <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-primary transition-colors bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl px-4 py-2">
            <ChevronLeft className="w-4 h-4" /> رجوع
          </button>

          <div className="bg-white dark:bg-card rounded-[2rem] border border-slate-100 dark:border-border shadow-xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-10 text-center">
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-amber-500/30 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-2xl">
                  <Swords className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-white">إنشاء غرفة منافسة</h1>
                <p className="text-blue-300 text-sm font-bold mt-1">تحدَّ أصدقاءك في نفس الوقت</p>
              </div>
            </div>

            {/* Form */}
            <div className="px-8 py-6 space-y-5">
              {/* اسمك */}
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">اسمك (منشئ الغرفة)</Label>
                <Input
                  placeholder="أدخل اسمك الكامل"
                  value={creatorName}
                  onChange={e => { setCreatorName(e.target.value); localStorage.setItem('alnaseer_student_name', e.target.value); }}
                  className="h-13 rounded-[1rem] bg-slate-50 dark:bg-muted border-slate-200 dark:border-border font-bold text-right"
                />
              </div>

              {/* المستوى */}
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> المستوى</Label>
                <Select value={selectedLevel} onValueChange={v => { setSelectedLevel(v); setSelectedSubject(''); }}>
                  <SelectTrigger className="h-13 rounded-[1rem] bg-slate-50 dark:bg-muted border-slate-200 font-bold"><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
                  <SelectContent className="z-[9999] bg-white dark:bg-card rounded-2xl shadow-2xl">
                    {levels.map((l: any) => <SelectItem key={l.id} value={l.id} className="font-bold rounded-xl">{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* المادة */}
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">المادة</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedLevel}>
                  <SelectTrigger className="h-13 rounded-[1rem] bg-slate-50 dark:bg-muted border-slate-200 font-bold"><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent className="z-[9999] bg-white dark:bg-card rounded-2xl shadow-2xl max-h-[260px]">
                    {subjects.map((s: any) => <SelectItem key={s.id} value={s.id} className="font-bold rounded-xl">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedSubject && (
                  <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Hash className="w-3 h-3" /> {availableCount} سؤال متاح
                  </p>
                )}
              </div>

              {/* عدد الأسئلة */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-[1.25rem] border border-slate-100 dark:border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">عدد الأسئلة</Label>
                  <span className="text-primary font-black text-sm bg-primary/10 px-3 py-1 rounded-xl">{questionsCount} سؤال</span>
                </div>
                <Slider
                  value={[questionsCount]} onValueChange={([v]) => setQuestionsCount(v)}
                  min={5} max={Math.max(maxQ, 5)} step={5}
                  disabled={!selectedSubject}
                  className="py-1"
                />
              </div>

              {/* الوقت */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-[1.25rem] border border-slate-100 dark:border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> وقت الاختبار</Label>
                  <span className="text-primary font-black text-sm bg-primary/10 px-3 py-1 rounded-xl">{timeMinutes} دقيقة</span>
                </div>
                <Slider value={[timeMinutes]} onValueChange={([v]) => setTimeMinutes(v)} min={10} max={90} step={5} className="py-1" />
              </div>

              {/* الحد الأقصى للاعبين */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-muted rounded-[1.25rem] border border-slate-100 dark:border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> الحد الأقصى</Label>
                  <span className="text-primary font-black text-sm bg-primary/10 px-3 py-1 rounded-xl">{maxPlayers} لاعبين</span>
                </div>
                <Slider value={[maxPlayers]} onValueChange={([v]) => setMaxPlayers(v)} min={2} max={10} step={1} className="py-1" />
              </div>

              <Button
                onClick={handleCreate}
                disabled={creating || !creatorName.trim() || !selectedSubject}
                className="w-full h-14 rounded-[1.25rem] font-black text-white text-base gap-2 bg-gradient-to-l from-amber-500 to-orange-600 shadow-lg shadow-amber-200 hover:-translate-y-0.5 transition-all"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Swords className="w-5 h-5" /> إنشاء الغرفة</>}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default BattleCreate;
