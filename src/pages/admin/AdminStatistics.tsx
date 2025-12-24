import { AdminLayout } from '@/components/admin/AdminLayout';
import { BarChart3, TrendingUp, Users, BookOpen, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const AdminStatistics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      const [analytics, results, subjects] = await Promise.all([
        supabase.from('site_analytics').select('id', { count: 'exact' }),
        supabase.from('exam_results').select('id, passed, subject_id, created_at'),
        supabase.from('subjects').select('id, name'),
      ]);

      // Calculate exams per subject
      const subjectMap = new Map(subjects.data?.map(s => [s.id, s.name]) || []);
      const examsBySubject: Record<string, number> = {};
      results.data?.forEach((r: any) => {
        const name = subjectMap.get(r.subject_id) || 'غير معروف';
        examsBySubject[name] = (examsBySubject[name] || 0) + 1;
      });

      const subjectData = Object.entries(examsBySubject)
        .map(([name, count]) => ({ name: name.substring(0, 15), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Calculate daily exams
      const dailyExams: Record<string, number> = {};
      results.data?.forEach((r: any) => {
        const date = new Date(r.created_at).toLocaleDateString('ar-SA');
        dailyExams[date] = (dailyExams[date] || 0) + 1;
      });

      const dailyData = Object.entries(dailyExams)
        .slice(-7)
        .map(([date, count]) => ({ date, count }));

      // Pass/Fail ratio
      const passed = results.data?.filter((r: any) => r.passed).length || 0;
      const failed = (results.data?.length || 0) - passed;

      return {
        totalVisits: analytics.count || 0,
        totalExams: results.data?.length || 0,
        passRate: results.data?.length ? Math.round((passed / results.data.length) * 100) : 0,
        subjectData,
        dailyData,
        passFailData: [
          { name: 'ناجح', value: passed },
          { name: 'راسب', value: failed },
        ],
      };
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">الإحصائيات</h1>
          <p className="text-muted-foreground">نظرة تفصيلية على أداء المنصة</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalVisits.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">إجمالي الزيارات</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalExams.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">إجمالي الاختبارات</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.passRate}%</p>
                <p className="text-sm text-muted-foreground">نسبة النجاح</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exams by Subject */}
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              الاختبارات حسب المادة
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pass/Fail Ratio */}
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              نسبة النجاح والرسوب
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.passFailData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
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
          <div className="bg-card rounded-xl border p-5 lg:col-span-2">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              الاختبارات خلال الأيام الأخيرة
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStatistics;
