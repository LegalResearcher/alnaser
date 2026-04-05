/**
 * AdminBattleRooms — لوحة تحكم غرف التحدي
 * - التحكم بغرف التحدي (تشغيل/إيقاف) حسب المستوى والمادة
 * - وضع كلمة مرور عامة تُطبَّق على جميع الغرف
 * - إحصائيات شاملة لجميع غرف التحدي
 */

import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Swords, Play, Pause, Lock, Unlock, Users, Trophy,
  Filter, RefreshCw, ChevronDown, ChevronUp,
  Shield, TrendingUp, Hash, Calendar, BookOpen,
  CheckCircle2, XCircle, Clock, Eye, EyeOff,
  Layers, AlertCircle, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AdminSEO } from '@/components/seo/SEOHead';

// ─── نوع النموذج ───────────────────────────────────────────
const EXAM_FORM_LABELS: Record<string, string> = {
  General:  'عام',
  Parallel: 'موازي',
  Mixed:    'مختلط',
  Trial:    'تجريبي',
  All:      'جميع الأسئلة',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  waiting:  { label: 'انتظار', color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
  active:   { label: 'نشطة',   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  finished: { label: 'منتهية', color: 'text-slate-500',  bg: 'bg-slate-100 dark:bg-slate-800' },
  locked:   { label: 'موقوفة', color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20' },
};

// ─── مكوّن بطاقة إحصاء ────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      </div>
      <p className="text-3xl font-black text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}

// ─── مكوّن صف غرفة التحدي ──────────────────────────────────
function RoomRow({
  room, levels, subjects, isExpanded, onToggle,
}: {
  room: any;
  levels: any[];
  subjects: any[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const level = levels.find(l => l.id === subjects.find((s: any) => s.id === room.subject_id)?.level_id);
  const subject = subjects.find((s: any) => s.id === room.subject_id);
  const status = STATUS_CONFIG[room.status] || STATUS_CONFIG['waiting'];

  const players: any[] = room.battle_players || [];
  const finishedPlayers = players.filter((p: any) => p.status === 'finished');
  const avgScore = finishedPlayers.length > 0
    ? Math.round(finishedPlayers.reduce((acc: number, p: any) => acc + (p.percentage || 0), 0) / finishedPlayers.length)
    : 0;

  const formLabel = room.question_type === 'trial'
    ? `تجريبي — ${room.exam_form_name || room.exam_form || ''}`
    : (room.exam_form_name || EXAM_FORM_LABELS[room.exam_form] || room.exam_form || '—');

  return (
    <div className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
      {/* Row Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={onToggle}
      >
        {/* Code */}
        <div className="w-20 shrink-0">
          <span className="font-mono font-black text-primary text-sm">{room.code}</span>
        </div>

        {/* Creator */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{room.creator_name}</p>
          <p className="text-xs text-slate-400 truncate">{subject?.name || '—'}</p>
        </div>

        {/* Level */}
        <div className="hidden sm:block w-24 shrink-0">
          <span className="text-xs font-medium text-slate-500">{level?.name || '—'}</span>
        </div>

        {/* Form */}
        <div className="hidden md:block w-28 shrink-0">
          <span className="text-xs text-slate-500 truncate">{formLabel}</span>
        </div>

        {/* Year */}
        <div className="hidden lg:block w-16 shrink-0 text-center">
          <span className="text-xs text-slate-500">{room.exam_year || '—'}</span>
        </div>

        {/* Players */}
        <div className="w-16 shrink-0 flex items-center gap-1">
          <Users className="w-3 h-3 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{players.length}/{room.max_players}</span>
        </div>

        {/* Success Rate */}
        <div className="w-20 shrink-0">
          {finishedPlayers.length > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', avgScore >= 50 ? 'bg-emerald-500' : 'bg-red-500')}
                  style={{ width: `${avgScore}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600">{avgScore}%</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>

        {/* Status */}
        <div className={cn('px-2 py-1 rounded-full text-xs font-bold', status.bg, status.color)}>
          {status.label}
        </div>

        {/* Expand */}
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Players */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/30">
          <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">المتسابقون ({players.length})</p>
          {players.length === 0 ? (
            <p className="text-sm text-slate-400">لا يوجد متسابقون حتى الآن</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {players.map((player: any) => (
                <div key={player.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                    style={{ backgroundColor: player.avatar_color || '#6366f1' }}
                  >
                    {player.player_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{player.player_name}</p>
                    <p className="text-xs text-slate-400">
                      {player.status === 'finished'
                        ? `${player.correct_count || 0}/${player.total_answered || 0} — ${player.percentage || 0}%`
                        : 'لم ينته بعد'}
                    </p>
                  </div>
                  {player.status === 'finished' && (
                    <div className={cn(
                      'text-xs font-black px-2 py-1 rounded-full',
                      (player.percentage || 0) >= 50
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    )}>
                      {player.percentage || 0}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Room Details */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500">
            <div><span className="font-bold block">نوع الأسئلة</span>{formLabel}</div>
            <div><span className="font-bold block">سنة الاختبار</span>{room.exam_year || '—'}</div>
            <div><span className="font-bold block">عدد الأسئلة</span>{room.questions_count}</div>
            <div><span className="font-bold block">الوقت</span>{room.time_minutes} دقيقة</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── الصفحة الرئيسية ────────────────────────────────────────
const AdminBattleRooms = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // فلاتر التحكم
  const [controlLevel, setControlLevel] = useState('');
  const [controlSubject, setControlSubject] = useState('');
  const [globalPassword, setGlobalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isApplyingPassword, setIsApplyingPassword] = useState(false);

  // فلاتر الإحصائيات
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  // ─── البيانات ──────────────────────────────────────────────
  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => (await supabase.from('levels').select('*').order('order_index')).data || [],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-all'],
    queryFn: async () => (await supabase.from('subjects').select('*').order('order_index')).data || [],
  });

  const { data: rooms = [], isLoading: roomsLoading, refetch } = useQuery({
    queryKey: ['admin-battle-rooms'],
    queryFn: async () => {
      const { data } = await supabase
        .from('battle_rooms')
        .select('*, battle_players(*)')
        .order('created_at', { ascending: false });
      return data || [];
    },
    refetchInterval: 30000,
  });

  // فلتر المواد حسب المستوى المختار في التحكم
  const controlSubjects = useMemo(() =>
    controlLevel ? subjects.filter((s: any) => s.level_id === controlLevel) : subjects,
  [subjects, controlLevel]);

  // فلتر المواد حسب المستوى في الإحصائيات
  const filterSubjects = useMemo(() =>
    filterLevel ? subjects.filter((s: any) => s.level_id === filterLevel) : subjects,
  [subjects, filterLevel]);

  // غرف مفلترة
  const filteredRooms = useMemo(() => {
    return rooms.filter((room: any) => {
      const subject = subjects.find((s: any) => s.id === room.subject_id);
      if (filterLevel && subject?.level_id !== filterLevel) return false;
      if (filterSubject && room.subject_id !== filterSubject) return false;
      if (filterStatus && room.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          room.creator_name?.toLowerCase().includes(q) ||
          room.code?.includes(q) ||
          subject?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rooms, filterLevel, filterSubject, filterStatus, searchQuery, subjects]);

  // ─── إحصائيات سريعة ────────────────────────────────────────
  const { data: savedBattleStats } = useQuery({
    queryKey: ['platform-battle-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_stats' as any)
        .select('total_battle_rooms, total_battle_finished, total_battle_players')
        .eq('id', 1)
        .single();
      return data as {
        total_battle_rooms:    number;
        total_battle_finished: number;
        total_battle_players:  number;
      } | null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const stats = useMemo(() => {
    const archivedRooms    = savedBattleStats?.total_battle_rooms    ?? 0;
    const archivedFinished = savedBattleStats?.total_battle_finished ?? 0;
    const archivedPlayers  = savedBattleStats?.total_battle_players  ?? 0;

    const currentTotal    = rooms.length;
    const currentActive   = rooms.filter((r: any) => r.status === 'active').length;
    const currentFinished = rooms.filter((r: any) => r.status === 'finished').length;
    const allPlayers      = rooms.flatMap((r: any) => r.battle_players || []);
    const finishedPlayers = allPlayers.filter((p: any) => p.status === 'finished');
    const avgSuccess      = finishedPlayers.length > 0
      ? Math.round(finishedPlayers.reduce((acc: number, p: any) => acc + (p.percentage || 0), 0) / finishedPlayers.length)
      : 0;

    return {
      total:        archivedRooms    + currentTotal,
      active:       currentActive,
      finished:     archivedFinished + currentFinished,
      totalPlayers: archivedPlayers  + allPlayers.length,
      avgSuccess,
    };
  }, [rooms, savedBattleStats]);

  // ─── بناء شرط الفلتر المشترك ─────────────────────────────
  const buildSubjectIds = (): string[] | 'all' | null => {
    if (controlSubject) return [controlSubject];
    if (controlLevel) {
      const ids = subjects
        .filter((s: any) => s.level_id === controlLevel)
        .map((s: any) => s.id);
      if (ids.length === 0) return null;
      return ids;
    }
    return 'all';
  };

  // ─── وظيفة تشغيل/إيقاف ──────────────────────────────────
  const toggleRooms = async (action: 'start' | 'stop') => {
    const ids = buildSubjectIds();
    if (ids === null) {
      toast({ title: 'تنبيه', description: 'لا توجد مواد لهذا المستوى', variant: 'destructive' });
      return;
    }

    // نحدّث حقل battle_disabled في جدول subjects
    let query = supabase.from('subjects').update({ battle_disabled: action === 'stop' } as any);
    if (ids === 'all') {
      query = query.gte('created_at', '2000-01-01');
    } else {
      query = query.in('id', ids);
    }

    const { error } = await query;
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: action === 'start' ? 'تم التشغيل ✅' : 'تم الإيقاف ⏸',
        description: action === 'start'
          ? 'تم السماح بإنشاء غرف التحدي'
          : 'تم منع إنشاء غرف تحدي جديدة',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-battle-rooms'] });
    }
  };

  // ─── وظيفة تطبيق كلمة المرور ────────────────────────────
  const applyGlobalPassword = async () => {
    setIsApplyingPassword(true);

    const ids = buildSubjectIds();
    if (ids === null) {
      toast({ title: 'تنبيه', description: 'لا توجد مواد لهذا المستوى', variant: 'destructive' });
      setIsApplyingPassword(false);
      return;
    }

    // 1) حفظ كلمة المرور في subjects (للغرف الجديدة)
    let subjectsQuery = supabase.from('subjects').update({ battle_password: globalPassword || null } as any);
    if (ids === 'all') {
      subjectsQuery = subjectsQuery.gte('created_at', '2000-01-01');
    } else {
      subjectsQuery = subjectsQuery.in('id', ids);
    }
    await subjectsQuery;

    // 2) تطبيق كلمة المرور على الغرف الموجودة في battle_rooms
    let roomsQuery = supabase.from('battle_rooms').update({
      password: globalPassword || null,
      is_private: !!globalPassword,
    });
    if (ids === 'all') {
      roomsQuery = roomsQuery.gte('created_at', '2000-01-01');
    } else if (ids.length === 1) {
      roomsQuery = roomsQuery.eq('subject_id', ids[0]);
    } else {
      roomsQuery = roomsQuery.in('subject_id', ids);
    }
    const { error } = await roomsQuery;

    setIsApplyingPassword(false);

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'تم التطبيق ✅',
        description: globalPassword
          ? 'تم تعيين كلمة المرور على الغرف الحالية والجديدة'
          : 'تم إزالة كلمة المرور من جميع الغرف',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-battle-rooms'] });
    }
  };

  return (
    <AdminLayout>
      <AdminSEO pageName="غرف التحدي" />

      <div className="space-y-8">
        {/* ── العنوان ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Swords className="w-5 h-5 text-white" />
              </div>
              إدارة غرف التحدي
            </h1>
            <p className="text-sm text-slate-500 mt-1">تحكم بغرف التحدي وراقب إحصائياتها</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </div>

        {/* ── بطاقات الإحصائيات السريعة ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="إجمالي الغرف"    value={stats.total}        icon={Swords}      color="bg-violet-500" />
          <StatCard label="غرف نشطة"         value={stats.active}       icon={Play}        color="bg-emerald-500" />
          <StatCard label="غرف منتهية"       value={stats.finished}     icon={CheckCircle2} color="bg-blue-500" />
          <StatCard label="إجمالي المتسابقين" value={stats.totalPlayers} icon={Users}       color="bg-amber-500" />
          <StatCard label="متوسط النجاح"     value={`${stats.avgSuccess}%`} icon={TrendingUp} color="bg-pink-500" />
        </div>

        {/* ── لوحة التحكم ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 dark:text-white">لوحة التحكم</h2>
              <p className="text-xs text-slate-500">تشغيل وإيقاف الغرف وضبط كلمة المرور</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* فلتر المستوى والمادة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> المستوى
                </Label>
                <Select value={controlLevel} onValueChange={v => { setControlLevel(v === 'all' ? '' : v); setControlSubject(''); }}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="جميع المستويات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستويات</SelectItem>
                    {levels.map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> المادة
                </Label>
                <Select value={controlSubject} onValueChange={v => setControlSubject(v === 'all' ? '' : v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="جميع المواد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المواد</SelectItem>
                    {controlSubjects.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* مؤشر النطاق المحدد */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-primary" />
              <span>
                سيتم تطبيق الإجراءات على:{' '}
                <span className="font-bold text-slate-800 dark:text-white">
                  {controlSubject
                    ? subjects.find((s: any) => s.id === controlSubject)?.name
                    : controlLevel
                    ? `جميع مواد ${levels.find((l: any) => l.id === controlLevel)?.name}`
                    : 'جميع غرف التحدي في المنصة'}
                </span>
              </span>
            </div>

            {/* أزرار التشغيل والإيقاف */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => toggleRooms('start')}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-bold text-base"
              >
                <Play className="w-5 h-5" />
                تشغيل الغرف
              </Button>
              <Button
                onClick={() => toggleRooms('stop')}
                className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-bold text-base"
              >
                <Pause className="w-5 h-5" />
                إيقاف الغرف
              </Button>
            </div>

            {/* فاصل */}
            <div className="border-t border-dashed border-slate-200 dark:border-slate-700" />

            {/* كلمة المرور العامة */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                كلمة مرور غرف التحدي
                <span className="text-xs font-normal text-slate-400">(اتركها فارغة لإزالة كلمة المرور)</span>
              </Label>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={globalPassword}
                    onChange={e => setGlobalPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور..."
                    className="rounded-xl h-11 pl-10"
                    dir="ltr"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Button
                  onClick={applyGlobalPassword}
                  disabled={isApplyingPassword}
                  className="gap-2 rounded-xl h-11 px-6 font-bold bg-primary hover:bg-primary/90"
                >
                  {globalPassword ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {isApplyingPassword ? 'جاري التطبيق...' : 'تطبيق'}
                </Button>
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                ستُطبَّق كلمة المرور على جميع الغرف ضمن النطاق المحدد أعلاه
              </p>
            </div>
          </div>
        </div>

        {/* ── قسم الإحصائيات ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-black text-slate-800 dark:text-white">إحصائيات الغرف</h2>
                <p className="text-xs text-slate-500">عرض {filteredRooms.length} من {rooms.length} غرفة</p>
              </div>
            </div>
          </div>

          {/* فلاتر الإحصائيات */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* بحث */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="بحث بالاسم أو الكود..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="rounded-xl pr-9 text-sm"
                />
              </div>

              {/* فلتر المستوى */}
              <Select value={filterLevel} onValueChange={v => { setFilterLevel(v === 'all' ? '' : v); setFilterSubject(''); }}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue placeholder="كل المستويات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المستويات</SelectItem>
                  {levels.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* فلتر المادة */}
              <Select value={filterSubject} onValueChange={v => setFilterSubject(v === 'all' ? '' : v)}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue placeholder="كل المواد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المواد</SelectItem>
                  {filterSubjects.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* فلتر الحالة */}
              <Select value={filterStatus} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue placeholder="كل الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="waiting">انتظار</SelectItem>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="finished">منتهية</SelectItem>
                  <SelectItem value="locked">موقوفة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* رؤوس الأعمدة */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="w-20 shrink-0">الكود</div>
            <div className="flex-1">المنشئ / المادة</div>
            <div className="hidden sm:block w-24 shrink-0">المستوى</div>
            <div className="hidden md:block w-28 shrink-0">النموذج</div>
            <div className="hidden lg:block w-16 shrink-0 text-center">السنة</div>
            <div className="w-16 shrink-0">اللاعبون</div>
            <div className="w-20 shrink-0">النجاح</div>
            <div className="w-20 shrink-0">الحالة</div>
            <div className="w-6 shrink-0" />
          </div>

          {/* قائمة الغرف */}
          <div className="p-4 space-y-3">
            {roomsLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin ml-2" />
                جاري التحميل...
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-16">
                <Swords className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">لا توجد غرف تحدي تطابق الفلتر</p>
              </div>
            ) : (
              filteredRooms.map((room: any) => (
                <RoomRow
                  key={room.id}
                  room={room}
                  levels={levels}
                  subjects={subjects}
                  isExpanded={expandedRoom === room.id}
                  onToggle={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBattleRooms;
