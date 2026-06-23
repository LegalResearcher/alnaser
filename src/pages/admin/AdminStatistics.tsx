import { AdminLayout } from '@/components/admin/AdminLayout';
import { BarChart3, TrendingUp, Users, BookOpen, Calendar, Eye, Layers, XCircle, CheckCircle2, Clock, Smartphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSEO } from '@/components/seo/SEOHead';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// تسميات أقسام المكتبة (مفتاح القسم المستخرج من page_path → اسم عربي للعرض)
const LIBRARY_SECTION_LABELS: Record<string, string> = {
  home: 'الرئيسية',
  laws: 'القوانين اليمنية',
  regulations: 'اللوائح',
  prosecutions: 'تعليمات النيابة',
  judicial: 'القواعد القضائية',
  favorites: 'المفضلة',
  search: 'البحث الشامل',
  subscription: 'الاشتراك',
  'other-services': 'خدماتنا الأخرى',
  files: 'مكتبة الملفات',
  doc: 'عرض المستندات',
};

const libraryLabel = (key: string) => LIBRARY_SECTION_LABELS[key] || key;

const EXAM_FORM_LABELS: Record<string, { label: string; color: string }> = {
  General:  { label: 'عام',            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  Parallel: { label: 'موازي',          color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  Mixed:    { label: 'مختلط',          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  Trial:    { label: 'تجريبي',         color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  All:      { label: 'جميع الأسئلة',   color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

const AdminStatistics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      // جلب الإحصائيات التراكمية المحفوظة
      const { data: savedStatsRaw } = await supabase
        .from('platform_stats')
        .select('*')
        .eq('id', 1)
        .single();
      const savedStats = savedStatsRaw as Record<string, any> | null;

      const archivedVisits      = (savedStats?.total_visits  ?? 0) as number;
      const archivedExams       = (savedStats?.total_exams   ?? 0) as number;
      const archivedPassed      = (savedStats?.total_passed  ?? 0) as number;
      const archivedFailed      = (savedStats?.total_failed  ?? 0) as number;
      const archivedBySubjectE  = (savedStats?.exams_by_subject   ?? {}) as Record<string, number>;
      const archivedBySubjectP  = (savedStats?.passed_by_subject  ?? {}) as Record<string, number>;
      const archivedBySubjectF  = (savedStats?.failed_by_subject  ?? {}) as Record<string, number>;

      // جلب البيانات الحالية — الجمع/العدّ يتم داخل قاعدة البيانات عبر RPC
      // (get_exam_results_summary) بدل سحب آلاف صفوف exam_results للمتصفح؛
      // فقط آخر 10 اختبارات تُجلب كصفوف فعلية (للعرض في "آخر الاختبارات")
      const [analyticsCount, examSummaryRes, recentExamsRes] = await Promise.all([
        supabase.from('site_analytics').select('id', { count: 'exact', head: true }),
        (supabase as any).rpc('get_exam_results_summary'),
        supabase
          .from('exam_results')
          .select('id, passed, created_at, exam_form, subjects(name)')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const summary = (examSummaryRes.data ?? {}) as {
        total?: number; passed?: number; failed?: number;
        by_subject?: { subject_name: string; level_name: string; total: number; passed: number; failed: number }[];
        daily?: { date: string; count: number }[];
      };

      // دمج الأرقام الحالية مع المحفوظة
      const totalVisits = archivedVisits + (analyticsCount.count ?? 0);

      const examsBySubject:  Record<string, number> = { ...archivedBySubjectE };
      const passedBySubject: Record<string, number> = { ...archivedBySubjectP };
      const failedBySubject: Record<string, number> = { ...archivedBySubjectF };
      const subjectLevelMap: Record<string, string>  = {};

      (summary.by_subject || []).forEach((row) => {
        const name = row.subject_name || 'غير معروف';
        examsBySubject[name]  = (examsBySubject[name]  || 0) + (row.total  || 0);
        passedBySubject[name] = (passedBySubject[name] || 0) + (row.passed || 0);
        failedBySubject[name] = (failedBySubject[name] || 0) + (row.failed || 0);
        if (!subjectLevelMap[name]) subjectLevelMap[name] = row.level_name || '';
      });

      const subjectData = Object.entries(examsBySubject)
        .map(([name, count]) => ({ name: name.substring(0, 15), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      const topFailed = Object.entries(failedBySubject)
        .map(([name, count]) => ({ name, count, level: subjectLevelMap[name] || '' }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const topPassed = Object.entries(passedBySubject)
        .map(([name, count]) => ({ name, count, level: subjectLevelMap[name] || '' }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const dailyData = (summary.daily || [])
        .slice(-7)
        .map((d) => ({
          date:  new Date(`${d.date}T00:00:00Z`).toLocaleDateString('ar-SA'),
          count: d.count,
        }));

      const currentPassed = summary.passed ?? 0;
      const currentFailed = summary.failed ?? 0;
      const currentTotal  = summary.total  ?? 0;
      const totalPassed   = archivedPassed + currentPassed;
      const totalFailed   = archivedFailed + currentFailed;
      const totalExams    = archivedExams  + currentTotal;
      const passRate      = totalExams > 0 ? Math.round((totalPassed / totalExams) * 100) : 0;

      const recentExams = (recentExamsRes.data || []).map((r: any) => ({
        name:      r.subjects?.name || 'غير معروف',
        passed:    r.passed,
        date:      new Date(r.created_at).toLocaleDateString('ar-SA'),
        time:      new Date(r.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        exam_form: r.exam_form || null,
      }));

      return {
        totalVisits,
        totalExams,
        passRate,
        subjectData,
        dailyData,
        topFailed,
        topPassed,
        recentExams,
        passFailData: [
          { name: 'ناجح', value: totalPassed },
          { name: 'راسب', value: totalFailed },
        ],
      };
    },
  });

  // جلب زيارات كل مستوى — العدّ يتم داخل قاعدة البيانات عبر RPC بدل حلقة صفحات
  const { data: levelVisits, isLoading: levelsLoading } = useQuery({
    queryKey: ['level-visits-stats'],
    queryFn: async () => {
      const [levelsRes, savedStatsRes, countsRes] = await Promise.all([
        supabase.from('levels').select('id, name').order('order_index'),
        supabase.from('platform_stats').select('level_visits').eq('id', 1).single(),
        (supabase as any).rpc('get_level_visit_counts'),
      ]);

      const archivedLevelVisits = ((savedStatsRes.data as Record<string, any> | null)?.level_visits ?? {}) as Record<string, number>;

      const currentVisitMap: Record<string, number> = {};
      (countsRes.data || []).forEach((row: { level_id: string; visits: number }) => {
        currentVisitMap[row.level_id] = Number(row.visits) || 0;
      });

      // دمج الأرشيف مع الحالي
      return (levelsRes.data || []).map((level) => ({
        id:     level.id,
        name:   level.name,
        visits: (archivedLevelVisits[level.id] ?? 0) + (currentVisitMap[level.id] ?? 0),
      })).sort((a, b) => b.visits - a.visits);
    },
  });

  // جلب زيارات كل قسم من المكتبة — العدّ يتم داخل قاعدة البيانات عبر RPC
  // (بنفس منطق المستويات تماماً، بدل سحب آلاف صفوف site_analytics للمتصفح)
  const { data: libraryVisits, isLoading: libraryLoading } = useQuery({
    queryKey: ['library-visits-stats'],
    queryFn: async () => {
      const [savedStatsRes, countsRes, uniqueVisitorsRes] = await Promise.all([
        supabase.from('platform_stats').select('library_visits').eq('id', 1).single(),
        (supabase as any).rpc('get_library_section_visit_counts'),
        // عدد الزوّار الفريدين (distinct visitor_id) لكل قسم — مقياس تكميلي بجانب الزيارات الخام
        (supabase as any).rpc('get_library_section_unique_visitor_counts'),
      ]);

      const archivedLibraryVisits = ((savedStatsRes.data as Record<string, any> | null)?.library_visits ?? {}) as Record<string, number>;

      const currentVisitMap: Record<string, number> = {};
      (countsRes.data || []).forEach((row: { section_key: string; visits: number }) => {
        currentVisitMap[row.section_key] = Number(row.visits) || 0;
      });

      const uniqueVisitorMap: Record<string, number> = {};
      (uniqueVisitorsRes.data || []).forEach((row: { section_key: string; unique_visitors: number }) => {
        uniqueVisitorMap[row.section_key] = Number(row.unique_visitors) || 0;
      });

      // دمج الأرشيف مع الحالي لكل المفاتيح الظاهرة في كليهما
      const allKeys = new Set([...Object.keys(archivedLibraryVisits), ...Object.keys(currentVisitMap)]);
      return Array.from(allKeys)
        .map((key) => ({
          id: key,
          name: libraryLabel(key),
          visits: (archivedLibraryVisits[key] ?? 0) + (currentVisitMap[key] ?? 0),
          // ملاحظة: لا يوجد أرشيف تاريخي لعدد الزوّار الفريدين (هذا مقياس جديد)، فهو يعكس فقط البيانات الحالية في site_analytics
          uniqueVisitors: uniqueVisitorMap[key] ?? 0,
        }))
        .sort((a, b) => b.visits - a.visits);
    },
  });


  // عدد المستخدمين (الأجهزة) الذين بدأوا التجربة المجانية للمكتبة
  const { data: libraryTrialCount, isLoading: trialCountLoading } = useQuery({
    queryKey: ['library-trial-users-count'],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from('legal_trial_starts')
        .select('id', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: appStats } = useQuery({
    queryKey: ['app-stats'],
    queryFn: async () => {
      const [installs, todaySessions, monthSessions] = await Promise.all([
        (supabase as any).from('app_installs').select('id', { count: 'exact', head: true }),
        (supabase as any)
          .from('app_sessions')
          .select('device_id', { count: 'exact', head: true })
          .gte('opened_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
        (supabase as any)
          .from('app_sessions')
          .select('device_id', { count: 'exact', head: true })
          .gte('opened_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);
      return {
        totalInstalls:   installs.count      ?? 0,
        activeToday:     todaySessions.count  ?? 0,
        activeThisMonth: monthSessions.count  ?? 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          <Skeleton className="h-8 sm:h-10 w-32 sm:w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 sm:h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Skeleton className="h-64 sm:h-80 rounded-xl" />
            <Skeleton className="h-64 sm:h-80 rounded-xl" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminSEO pageName="الإحصائيات" />
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">الإحصائيات</h1>
          <p className="text-sm sm:text-base text-muted-foreground">نظرة تفصيلية على أداء المنصة</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-card rounded-xl border p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{stats?.totalVisits.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">إجمالي الزيارات</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{stats?.totalExams.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">إجمالي الاختبارات</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4 sm:p-5 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{stats?.passRate}%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">نسبة النجاح</p>
              </div>
            </div>
          </div>
        </div>

        {/* إحصائيات التطبيق */}
        <div className="bg-card rounded-xl border p-4 sm:p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            إحصائيات تطبيق الموبايل
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-900/30">
              <p className="text-2xl font-black text-blue-600">
                {(appStats?.totalInstalls ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">إجمالي التحميلات</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-2xl font-black text-emerald-600">
                {(appStats?.activeToday ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">نشطون اليوم</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-900/30">
              <p className="text-2xl font-black text-amber-600">
                {(appStats?.activeThisMonth ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">نشطون الشهر</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Exams by Subject */}
          <div className="bg-card rounded-xl border p-4 sm:p-5">
            <h3 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              الاختبارات حسب المادة
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pass/Fail Ratio */}
          <div className="bg-card rounded-xl border p-4 sm:p-5">
            <h3 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              نسبة النجاح والرسوب
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.passFailData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats?.passFailData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Exams */}
          <div className="bg-card rounded-xl border p-4 sm:p-5 lg:col-span-2">
            <h3 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              الاختبارات خلال الأيام الأخيرة
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* أكثر المواد رسوباً ونجاحاً */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* أكثر المواد رسوباً */}
          <div className="bg-card rounded-xl border p-4 sm:p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              أكثر المواد رسوباً
            </h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats?.topFailed && stats.topFailed.length > 0 ? stats.topFailed.map((item, index) => {
                  const maxCount = Math.max(...stats.topFailed.map(x => x.count), 1);
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={item.name} className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-sm truncate">{item.name}</span>
                          {item.level && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                              {item.level}
                            </span>
                          )}
                        </div>
                        <span className="font-black text-sm text-red-600 shrink-0 mr-2">
                          {item.count} راسب
                        </span>
                      </div>
                      <div className="w-full bg-red-100 dark:bg-red-900/30 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-red-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center text-muted-foreground text-sm py-6">لا توجد بيانات رسوب بعد</p>
                )}
              </div>
            )}
          </div>

          {/* أكثر المواد نجاحاً */}
          <div className="bg-card rounded-xl border p-4 sm:p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              أكثر المواد نجاحاً
            </h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats?.topPassed && stats.topPassed.length > 0 ? stats.topPassed.map((item, index) => {
                  const maxCount = Math.max(...stats.topPassed.map(x => x.count), 1);
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={item.name} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-sm truncate">{item.name}</span>
                          {item.level && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                              {item.level}
                            </span>
                          )}
                        </div>
                        <span className="font-black text-sm text-emerald-600 shrink-0 mr-2">
                          {item.count} ناجح
                        </span>
                      </div>
                      <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center text-muted-foreground text-sm py-6">لا توجد بيانات نجاح بعد</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* آخر الاختبارات */}
        <div className="bg-card rounded-xl border p-4 sm:p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            آخر الاختبارات
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.recentExams && stats.recentExams.length > 0 ? stats.recentExams.map((exam, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${exam.passed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="font-semibold text-sm truncate">{exam.name}</span>
                    {exam.exam_form && EXAM_FORM_LABELS[exam.exam_form] && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${EXAM_FORM_LABELS[exam.exam_form].color}`}>
                        {EXAM_FORM_LABELS[exam.exam_form].label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${exam.passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                      {exam.passed ? 'ناجح' : 'راسب'}
                    </span>
                    <span className="text-xs text-muted-foreground">{exam.date} {exam.time}</span>
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground text-sm py-6">لا توجد اختبارات بعد</p>
              )}
            </div>
          )}
        </div>

        {/* زيارات المستويات */}
        <div className="bg-card rounded-xl border p-4 sm:p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            الزيارات الفعلية حسب المستوى
          </h3>
          {levelsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {levelVisits?.map((level, index) => {
                const maxVisits = Math.max(...(levelVisits.map(l => l.visits)), 1);
                const percentage = Math.round((level.visits / maxVisits) * 100);
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
                const color = colors[index % colors.length];
                return (
                  <div key={level.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                      <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm truncate">{level.name}</span>
                        <span className="font-bold text-sm shrink-0 mr-2">
                          {level.visits.toLocaleString('ar-SA')} زيارة
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${color} transition-all duration-700`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!levelVisits || levelVisits.length === 0) && (
                <p className="text-center text-muted-foreground text-sm py-8">لا توجد بيانات زيارات بعد</p>
              )}
            </div>
          )}
        </div>

        {/* زيارات المكتبة */}
        <div className="bg-card rounded-xl border p-4 sm:p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            إحصائيات المكتبة القانونية
          </h3>

          {/* عدد المستخدمين بالتجربة المجانية */}
          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">عدد المستخدمين بالتجربة المجانية</p>
              {trialCountLoading ? (
                <Skeleton className="h-6 w-16 mt-1 rounded" />
              ) : (
                <p className="font-bold text-lg sm:text-xl">{(libraryTrialCount ?? 0).toLocaleString('ar-SA')}</p>
              )}
            </div>
          </div>

          <h4 className="font-bold mb-3 text-sm">الزيارات الفعلية حسب أقسام المكتبة</h4>
          {libraryLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {libraryVisits?.map((section, index) => {
                const maxVisits = Math.max(...(libraryVisits.map(l => l.visits)), 1);
                const percentage = Math.round((section.visits / maxVisits) * 100);
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
                const color = colors[index % colors.length];
                return (
                  <div key={section.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm truncate">{section.name}</span>
                        <div className="flex flex-col items-end shrink-0 mr-2">
                          <span className="font-bold text-sm">
                            {section.visits.toLocaleString('ar-SA')} زيارة
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {section.uniqueVisitors.toLocaleString('ar-SA')} زائر فريد
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${color} transition-all duration-700`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!libraryVisits || libraryVisits.length === 0) && (
                <p className="text-center text-muted-foreground text-sm py-8">لا توجد بيانات زيارات للمكتبة بعد</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStatistics;