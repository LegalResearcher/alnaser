import { AdminLayout } from '@/components/admin/AdminLayout';
import { BarChart3, TrendingUp, Users, BookOpen, Calendar, Eye, Layers, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSEO } from '@/components/seo/SEOHead';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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
      const { data: savedStats } = await supabase
        .from('platform_stats' as any)
        .select('*')
        .eq('id', 1)
        .single();

      const archivedVisits      = (savedStats?.total_visits  ?? 0) as number;
      const archivedExams       = (savedStats?.total_exams   ?? 0) as number;
      const archivedPassed      = (savedStats?.total_passed  ?? 0) as number;
      const archivedFailed      = (savedStats?.total_failed  ?? 0) as number;
      const archivedBySubjectE  = (savedStats?.exams_by_subject   ?? {}) as Record<string, number>;
      const archivedBySubjectP  = (savedStats?.passed_by_subject  ?? {}) as Record<string, number>;
      const archivedBySubjectF  = (savedStats?.failed_by_subject  ?? {}) as Record<string, number>;

      // جلب البيانات الحالية (المتبقية في Supabase)
      const analyticsCount = await supabase
        .from('site_analytics')
        .select('id', { count: 'exact', head: true });

      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name, level_id, levels(name)')
        .limit(1000);

      let allResults: any[] = [];
      let from = 0;
      const PAGE_SIZE = 1000;
      while (true) {
        const { data: batch, error } = await supabase
          .from('exam_results')
          .select('id, passed, subject_id, created_at, exam_form')
          .range(from, from + PAGE_SIZE - 1);
        if (error || !batch || batch.length === 0) break;
        allResults = [...allResults, ...batch];
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      // دمج الأرقام الحالية مع المحفوظة
      const totalVisits = archivedVisits + (analyticsCount.count ?? 0);

      const subjectMap = new Map(subjectsData?.map(s => [s.id, s.name]) || []);
      const levelMap   = new Map(subjectsData?.map(s => [s.id, (s.levels as any)?.name || '']) || []);

      const examsBySubject:  Record<string, number> = { ...archivedBySubjectE };
      const passedBySubject: Record<string, number> = { ...archivedBySubjectP };
      const failedBySubject: Record<string, number> = { ...archivedBySubjectF };
      const subjectLevelMap: Record<string, string>  = {};

      allResults.forEach((r: any) => {
        const name  = subjectMap.get(r.subject_id) || 'غير معروف';
        const level = levelMap.get(r.subject_id)   || '';
        examsBySubject[name]  = (examsBySubject[name]  || 0) + 1;
        if (r.passed) {
          passedBySubject[name] = (passedBySubject[name] || 0) + 1;
        } else {
          failedBySubject[name] = (failedBySubject[name] || 0) + 1;
        }
        if (!subjectLevelMap[name]) subjectLevelMap[name] = level;
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

      const dailyExams: Record<string, { label: string; count: number }> = {};
      allResults.forEach((r: any) => {
        const d     = new Date(r.created_at);
        const key   = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('ar-SA');
        if (!dailyExams[key]) dailyExams[key] = { label, count: 0 };
        dailyExams[key].count += 1;
      });
      const dailyData = Object.entries(dailyExams)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([, val]) => ({ date: val.label, count: val.count }));

      const currentPassed = allResults.filter((r: any) => r.passed).length;
      const currentFailed = allResults.length - currentPassed;
      const totalPassed   = archivedPassed + currentPassed;
      const totalFailed   = archivedFailed + currentFailed;
      const totalExams    = archivedExams  + allResults.length;
      const passRate      = totalExams > 0 ? Math.round((totalPassed / totalExams) * 100) : 0;

      const recentExams = [...allResults]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((r: any) => ({
          name:      subjectMap.get(r.subject_id) || 'غير معروف',
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

  // جلب زيارات كل مستوى من site_analytics
  const { data: levelVisits, isLoading: levelsLoading } = useQuery({
    queryKey: ['level-visits-stats'],
    queryFn: async () => {
      const { data: levels } = await supabase
        .from('levels')
        .select('id, name')
        .order('order_index');

      // جلب الأرقام المحفوظة من platform_stats
      const { data: savedStats } = await supabase
        .from('platform_stats' as any)
        .select('level_visits')
        .eq('id', 1)
        .single();
      const archivedLevelVisits = (savedStats?.level_visits ?? {}) as Record<string, number>;

      // جلب الزيارات الحالية
      let allAnalytics: any[] = [];
      let from = 0;
      const PAGE_SIZE = 1000;
      while (true) {
        const { data: batch } = await supabase
          .from('site_analytics')
          .select('page_path')
          .like('page_path', '/levels/%')
          .range(from, from + PAGE_SIZE - 1);
        if (!batch || batch.length === 0) break;
        allAnalytics = [...allAnalytics, ...batch];
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      const currentVisitMap: Record<string, number> = {};
      allAnalytics.forEach((row) => {
        const parts   = row.page_path.split('/');
        const levelId = parts[2];
        if (levelId) currentVisitMap[levelId] = (currentVisitMap[levelId] || 0) + 1;
      });

      // دمج الأرشيف مع الحالي
      return (levels || []).map((level) => ({
        id:     level.id,
        name:   level.name,
        visits: (archivedLevelVisits[level.id] ?? 0) + (currentVisitMap[level.id] ?? 0),
      })).sort((a, b) => b.visits - a.visits);
    },
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
      </div>
    </AdminLayout>
  );
};

export default AdminStatistics;
