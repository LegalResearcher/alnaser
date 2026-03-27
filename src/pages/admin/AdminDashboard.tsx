import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  BookOpen, Users, Target, TrendingUp, Clock, CheckCircle2,
  XCircle, MessageSquare, Lightbulb, ArrowLeft, BarChart3,
  ChevronLeft, ChevronRight, Eye, Layers, AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSEO } from '@/components/seo/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const EXAM_FORM_LABELS: Record<string, { label: string; color: string }> = {
  General:  { label: 'عام',            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  Parallel: { label: 'موازي',          color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  Mixed:    { label: 'مختلط',          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  Trial:    { label: 'تجريبي',         color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  All:      { label: 'جميع الأسئلة',   color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

const REPORT_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'بانتظار المراجعة', color: 'bg-amber-100 text-amber-700' },
  reviewed: { label: 'تمت المراجعة',     color: 'bg-blue-100 text-blue-700' },
  applied:  { label: 'تم التطبيق',       color: 'bg-emerald-100 text-emerald-700' },
};

const SUGGESTION_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'بانتظار المراجعة', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'تمت الموافقة',     color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'مرفوض',            color: 'bg-red-100 text-red-700' },
};

const PIE_COLORS = ['#10b981', '#ef4444'];
const EXAMS_PAGE_SIZE = 8;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-SA');
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

/** بطاقة إحصاء مع trend indicator */
function StatCard({
  label, value, icon: Icon, color, trend, trendLabel,
}: {
  label: string; value: string | number; icon: any;
  color: string; trend?: number; trendLabel?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={cn(
            'text-xs font-bold px-2 py-1 rounded-full',
            trend >= 0
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
        {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
      </p>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</p>
      {trendLabel && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{trendLabel}</p>
      )}
    </div>
  );
}

/** قسم بعنوان وزر "عرض الكل" */
function SectionHeader({ title, icon: Icon, href, count }: {
  title: string; icon: any; href?: string; count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-black text-slate-800 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        {title}
        {count !== undefined && count > 0 && (
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </h2>
      {href && (
        <Link
          to={href}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
const AdminDashboard = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [examsPage, setExamsPage] = useState(0);

  // ── Core Stats ──────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats-v2'],
    queryFn: async () => {
      const [levels, subjects, questions, results] = await Promise.all([
        supabase.from('levels').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('questions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('exam_results').select('id, passed, created_at', { count: 'exact' }).limit(10000),
      ]);

      const passed  = results.data?.filter(r => r.passed).length ?? 0;
      const total   = results.count ?? 0;
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

      // آخر 7 أيام
      const dailyMap: Record<string, { label: string; count: number }> = {};
      results.data?.forEach((r: any) => {
        const d   = new Date(r.created_at);
        const key = d.toISOString().split('T')[0];
        if (!dailyMap[key]) dailyMap[key] = { label: d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }), count: 0 };
        dailyMap[key].count++;
      });
      const dailyData = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([, v]) => ({ date: v.label, count: v.count }));

      return {
        levels:   levels.count   ?? 0,
        subjects: subjects.count ?? 0,
        questions: questions.count ?? 0,
        exams:    total,
        passRate,
        passed,
        failed:   total - passed,
        dailyData,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  // ── Recent Exams ─────────────────────────────
  const { data: recentExams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['dashboard-recent-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_results')
        .select('id, student_name, score, total_questions, passed, created_at, exam_form, subjects(name)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Pending Reports ──────────────────────────
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['dashboard-reports'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('question_reports') as any)
        .select('id, error_type, status, created_at, questions(question_text, subjects(name))')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Pending Suggestions ──────────────────────
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['dashboard-suggestions'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('question_suggestions' as any) as any)
        .select('id, question_text, status, created_at, suggester_name, subjects(name)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Derived ──────────────────────────────────
  const pendingReports     = reports.filter((r: any) => r.status === 'pending');
  const pendingSuggestions = suggestions.filter((s: any) => s.status === 'pending');

  const totalExamsPages = Math.ceil(recentExams.length / EXAMS_PAGE_SIZE);
  const pagedExams      = recentExams.slice(
    examsPage * EXAMS_PAGE_SIZE,
    (examsPage + 1) * EXAMS_PAGE_SIZE
  );

  const pieData = [
    { name: 'ناجح', value: stats?.passed ?? 0 },
    { name: 'راسب', value: stats?.failed ?? 0 },
  ];

  // ── Render ────────────────────────────────────
  return (
    <AdminLayout>
      <AdminSEO pageName="لوحة التحكم" />
      <div className="space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
              لوحة التحكم
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin ? 'نظرة شاملة على منصة الباحث القانوني' : 'مرحباً — هذا ما يحتاج مراجعتك اليوم'}
            </p>
          </div>
          {/* Alerts badge للمحرر */}
          {!isAdmin && (pendingReports.length > 0 || pendingSuggestions.length > 0) && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {pendingReports.length + pendingSuggestions.length} بند يحتاج مراجعة
              </span>
            </div>
          )}
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {statsLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            : <>
                {isAdmin && (
                  <>
                    <StatCard label="المستويات"   value={stats?.levels   ?? 0} icon={Layers}     color="bg-blue-500"    />
                    <StatCard label="المواد"       value={stats?.subjects ?? 0} icon={BookOpen}   color="bg-emerald-500" />
                  </>
                )}
                <StatCard label="الأسئلة النشطة" value={stats?.questions ?? 0} icon={CheckCircle2} color="bg-amber-500"  />
                <StatCard label="الاختبارات"    value={stats?.exams    ?? 0} icon={Users}        color="bg-purple-500" />
                <StatCard
                  label="نسبة النجاح"
                  value={`${stats?.passRate ?? 0}%`}
                  icon={TrendingUp}
                  color={stats?.passRate && stats.passRate >= 60 ? 'bg-emerald-500' : 'bg-rose-500'}
                />
                {/* للمحرر فقط — بطاقة التعقيبات المعلقة */}
                {!isAdmin && (
                  <StatCard
                    label="تعقيبات معلقة"
                    value={pendingReports.length}
                    icon={MessageSquare}
                    color={pendingReports.length > 0 ? 'bg-rose-500' : 'bg-slate-400'}
                  />
                )}
                {/* للمحرر فقط — بطاقة الاقتراحات المعلقة */}
                {!isAdmin && (
                  <StatCard
                    label="اقتراحات معلقة"
                    value={pendingSuggestions.length}
                    icon={Lightbulb}
                    color={pendingSuggestions.length > 0 ? 'bg-amber-500' : 'bg-slate-400'}
                  />
                )}
              </>
          }
        </div>

        {/* ── Charts Row (للمدير فقط) ── */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Area Chart — اختبارات آخر 7 أيام */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">الاختبارات — آخر 7 أيام</h3>
              </div>
              {statsLoading ? (
                <Skeleton className="h-44 rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={176}>
                  <AreaChart data={stats?.dailyData ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
                      formatter={(v: any) => [v, 'اختبار']}
                    />
                    <Area
                      type="monotone" dataKey="count"
                      stroke="#6366f1" strokeWidth={2}
                      fill="url(#grad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Chart — نسبة النجاح/الرسوب */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">توزيع النتائج</h3>
              </div>
              {statsLoading ? (
                <Skeleton className="h-44 rounded-xl" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={64}
                        dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 12, fontSize: 12 }}
                        formatter={(v: any, n: any) => [v.toLocaleString('ar-SA'), n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-3">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {d.name} ({d.value.toLocaleString('ar-SA')})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── للمحرر: Charts مبسطة ── */}
        {!isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">نشاط الاختبارات — آخر 7 أيام</h3>
            </div>
            {statsLoading ? (
              <Skeleton className="h-44 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats?.dailyData ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
                    formatter={(v: any) => [v, 'اختبار']}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* ── Pending Reports ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700">
            <SectionHeader
              title="تعقيبات الأسئلة المعلقة"
              icon={MessageSquare}
              href="/admin/reports"
              count={pendingReports.length}
            />
          </div>

          {reportsLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد تعقيبات معلقة 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {pendingReports.slice(0, 5).map((r: any) => (
                <div key={r.id} className="p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {r.questions?.question_text ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {r.questions?.subjects?.name ?? '—'} · {fmtDate(r.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-1 rounded-full',
                      REPORT_STATUS[r.status]?.color ?? 'bg-slate-100 text-slate-600'
                    )}>
                      {REPORT_STATUS[r.status]?.label ?? r.status}
                    </span>
                    <Link to="/admin/reports">
                      <Eye className="w-4 h-4 text-slate-400 hover:text-primary transition-colors" />
                    </Link>
                  </div>
                </div>
              ))}
              {pendingReports.length > 5 && (
                <div className="p-4 text-center">
                  <Link to="/admin/reports" className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1">
                    عرض {pendingReports.length - 5} تعقيب إضافي <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Pending Suggestions ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700">
            <SectionHeader
              title="اقتراحات الأسئلة المعلقة"
              icon={Lightbulb}
              href="/admin/suggestions"
              count={pendingSuggestions.length}
            />
          </div>

          {suggestionsLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : pendingSuggestions.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد اقتراحات معلقة 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {pendingSuggestions.slice(0, 5).map((s: any) => (
                <div key={s.id} className="p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {s.question_text ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {s.subjects?.name ?? '—'}
                      {s.suggester_name ? ` · ${s.suggester_name}` : ''}
                      {' · '}{fmtDate(s.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-1 rounded-full',
                      SUGGESTION_STATUS[s.status]?.color ?? 'bg-slate-100 text-slate-600'
                    )}>
                      {SUGGESTION_STATUS[s.status]?.label ?? s.status}
                    </span>
                    <Link to="/admin/suggestions">
                      <Eye className="w-4 h-4 text-slate-400 hover:text-primary transition-colors" />
                    </Link>
                  </div>
                </div>
              ))}
              {pendingSuggestions.length > 5 && (
                <div className="p-4 text-center">
                  <Link to="/admin/suggestions" className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1">
                    عرض {pendingSuggestions.length - 5} اقتراح إضافي <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Recent Exams + Pagination ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              آخر الاختبارات
              <span className="text-xs font-medium text-slate-400">
                ({recentExams.length.toLocaleString('ar-SA')} سجل)
              </span>
            </h2>
            {/* Pagination Controls */}
            {totalExamsPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExamsPage(p => Math.max(0, p - 1))}
                  disabled={examsPage === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-500 px-2">
                  {examsPage + 1} / {totalExamsPages}
                </span>
                <button
                  onClick={() => setExamsPage(p => Math.min(totalExamsPages - 1, p + 1))}
                  disabled={examsPage === totalExamsPages - 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {examsLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : pagedExams.length === 0 ? (
            <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
              لا توجد اختبارات بعد
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {pagedExams.map((exam: any) => (
                <div key={exam.id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">
                      {exam.student_name}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <p className="text-xs text-slate-400 truncate">{exam.subjects?.name}</p>
                      {exam.exam_form && EXAM_FORM_LABELS[exam.exam_form] && (
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                          EXAM_FORM_LABELS[exam.exam_form].color
                        )}>
                          {EXAM_FORM_LABELS[exam.exam_form].label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left shrink-0 flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5">
                      {exam.passed
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        : <XCircle     className="w-3.5 h-3.5 text-red-500" />}
                      <p className={cn(
                        'font-black text-sm',
                        exam.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      )}>
                        {exam.score}/{exam.total_questions}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {fmtDate(exam.created_at)} · {fmtTime(exam.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
