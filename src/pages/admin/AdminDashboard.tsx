import { AdminLayout } from '@/components/admin/AdminLayout';
import { BookOpen, Users, Target, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [levels, subjects, questions, results] = await Promise.all([
        supabase.from('levels').select('id', { count: 'exact' }),
        supabase.from('subjects').select('id', { count: 'exact' }),
        supabase.from('questions').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('exam_results').select('id, passed', { count: 'exact' }),
      ]);

      const passedCount = results.data?.filter(r => r.passed).length || 0;
      const totalExams = results.count || 0;
      const passRate = totalExams > 0 ? Math.round((passedCount / totalExams) * 100) : 0;

      return {
        levels: levels.count || 0,
        subjects: subjects.count || 0,
        questions: questions.count || 0,
        exams: totalExams,
        passRate,
      };
    },
  });

  const { data: recentExams = [] } = useQuery({
    queryKey: ['recent-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_results')
        .select('*, subjects(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const statCards = [
    { label: 'المستويات', value: stats?.levels || 0, icon: Target, color: 'bg-blue-500' },
    { label: 'المواد', value: stats?.subjects || 0, icon: BookOpen, color: 'bg-emerald-500' },
    { label: 'الأسئلة', value: stats?.questions || 0, icon: CheckCircle, color: 'bg-amber-500' },
    { label: 'الاختبارات', value: stats?.exams || 0, icon: Users, color: 'bg-purple-500' },
    { label: 'نسبة النجاح', value: `${stats?.passRate || 0}%`, icon: TrendingUp, color: 'bg-rose-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">نظرة عامة على منصة الباحث القانوني</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : (
            statCards.map((stat, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border p-5 card-hover"
              >
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))
          )}
        </div>

        {/* Recent Exams */}
        <div className="bg-card rounded-xl border">
          <div className="p-5 border-b">
            <h2 className="font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              آخر الاختبارات
            </h2>
          </div>
          <div className="divide-y">
            {recentExams.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                لا توجد اختبارات بعد
              </div>
            ) : (
              recentExams.map((exam: any) => (
                <div key={exam.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{exam.student_name}</p>
                    <p className="text-sm text-muted-foreground">{exam.subjects?.name}</p>
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${exam.passed ? 'text-success' : 'text-destructive'}`}>
                      {exam.score}/{exam.total_questions}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(exam.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
