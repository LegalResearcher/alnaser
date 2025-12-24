import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Level, Subject } from '@/types/database';

// استخدام بادئة موحدة للتوافق مع نظام التخزين في useCachedQuery
const CACHE_PREFIX = 'alnaser_cache_v2_';

/**
 * وظيفة التخزين الآمنة - تتعامل مع حالات امتلاء الذاكرة وأمان المتصفح
 */
function setToLocalStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const entry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    console.warn(`⚠️ Preloader Cache Error [${key}]:`, error);
  }
}

export function useDataPreloader() {
  const queryClient = useQueryClient();

  /**
   * 1. تحميل المستويات الدراسية مسبقاً
   */
  const prefetchLevels = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: ['levels'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('levels')
          .select('*')
          .order('order_index');
        if (error) throw error;
        
        const levels = data as Level[];
        setToLocalStorage('levels', levels);
        return levels;
      },
      staleTime: 1000 * 60 * 5, // 5 دقائق
    });
  }, [queryClient]);

  /**
   * 2. تحميل إحصائيات المواد لكل مستوى
   */
  const prefetchSubjectCounts = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: ['subject-counts'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('subjects')
          .select('level_id');
        if (error) throw error;
        
        const counts: Record<string, number> = {};
        data.forEach((s: { level_id: string }) => {
          counts[s.level_id] = (counts[s.level_id] || 0) + 1;
        });
        setToLocalStorage('subject-counts', counts);
        return counts;
      },
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  /**
   * 3. تحميل تفاصيل المواد والمستويات (بشكل متوازٍ واحترافي)
   */
  const prefetchAllSubjects = useCallback(async () => {
    const { data: levels } = await supabase
      .from('levels')
      .select('id')
      .order('order_index');

    if (!levels) return;

    // تنفيذ عمليات التحميل المسبق بالتوازي لضمان أقصى سرعة
    await Promise.all(
      levels.map(async (level) => {
        // تحميل المواد التابعة للمستوى
        const subjectsPromise = queryClient.prefetchQuery({
          queryKey: ['subjects', level.id],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('subjects')
              .select('*')
              .eq('level_id', level.id)
              .order('order_index');
            if (error) throw error;
            
            const subjects = data as Subject[];
            setToLocalStorage(`subjects_${level.id}`, subjects);
            return subjects;
          },
          staleTime: 1000 * 60 * 5,
        });

        // تحميل بيانات المستوى الفردية
        const levelDetailsPromise = queryClient.prefetchQuery({
          queryKey: ['level', level.id],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('levels')
              .select('*')
              .eq('id', level.id)
              .maybeSingle();
            if (error) throw error;
            
            setToLocalStorage(`level_${level.id}`, data);
            return data as Level | null;
          },
          staleTime: 1000 * 60 * 5,
        });

        return Promise.all([subjectsPromise, levelDetailsPromise]);
      })
    );
  }, [queryClient]);

  /**
   * 4. تحميل إحصائيات الموقع العامة مسبقاً
   */
  const prefetchStats = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: ['site-stats'],
      queryFn: async () => {
        const [questionsRes, subjectsRes, examsRes] = await Promise.all([
          supabase.from('questions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('subjects').select('id', { count: 'exact', head: true }),
          supabase.from('exam_results').select('id, passed', { count: 'exact' }),
        ]);

        const examsData = examsRes.data || [];
        const examsCount = examsRes.count || 0;
        const passedCount = examsData.filter(e => e.passed).length;
        const passRate = examsCount > 0 ? Math.round((passedCount / examsCount) * 100) : 85;

        const stats = { 
          questionsCount: questionsRes.count || 0, 
          subjectsCount: subjectsRes.count || 0, 
          examsCount, 
          passRate 
        };
        
        setToLocalStorage('site-stats', stats);
        return stats;
      },
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  /**
   * الوظيفة الشاملة: تشغيل جميع عمليات التحميل المسبق
   */
  const prefetchAll = useCallback(async () => {
    try {
      // المرحلة الأولى: البيانات الأساسية
      await Promise.all([
        prefetchLevels(),
        prefetchSubjectCounts(),
        prefetchStats(),
      ]);
      
      // المرحلة الثانية: البيانات التفصيلية (تعتمد منطقياً على وجود المستويات)
      await prefetchAllSubjects();
    } catch (error) {
      console.error('⚠️ Global Preload Failed:', error);
    }
  }, [prefetchLevels, prefetchSubjectCounts, prefetchStats, prefetchAllSubjects]);

  return {
    prefetchLevels,
    prefetchSubjectCounts,
    prefetchAllSubjects,
    prefetchStats,
    prefetchAll,
  };
}

/**
 * Hook التشغيل التلقائي - يبدأ العمل بمجرد تشغيل المنصة
 */
export function useAutoPreload() {
  const { prefetchAll } = useDataPreloader();

  useEffect(() => {
    // تشغيل التحميل المسبق بعد فترة وجيزة لضمان عدم إعاقة الرندرة الأولى
    const timer = setTimeout(() => {
      prefetchAll();
    }, 200);

    return () => clearTimeout(timer);
  }, [prefetchAll]);
}
