import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Level, Subject } from '@/types/database';

const CACHE_PREFIX = 'app_cache_';

function setToLocalStorage<T>(key: string, data: T): void {
  try {
    const entry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage might be full, silently fail
  }
}

export function useDataPreloader() {
  const queryClient = useQueryClient();

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
        // Also cache to localStorage
        setToLocalStorage('levels', levels);
        return levels;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  }, [queryClient]);

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

  const prefetchAllSubjects = useCallback(async () => {
    // Fetch all subjects grouped by level
    const { data: levels } = await supabase
      .from('levels')
      .select('id')
      .order('order_index');

    if (!levels) return;

    // Prefetch subjects for each level in parallel
    await Promise.all(
      levels.map(async (level) => {
        await queryClient.prefetchQuery({
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

        // Also prefetch level details
        await queryClient.prefetchQuery({
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
      })
    );
  }, [queryClient]);

  const prefetchStats = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: ['site-stats'],
      queryFn: async () => {
        const [questionsRes, subjectsRes, examsRes] = await Promise.all([
          supabase.from('questions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('subjects').select('id', { count: 'exact', head: true }),
          supabase.from('exam_results').select('id, passed', { count: 'exact' }),
        ]);

        const questionsCount = questionsRes.count || 0;
        const subjectsCount = subjectsRes.count || 0;
        const examsData = examsRes.data || [];
        const examsCount = examsRes.count || 0;
        
        const passedCount = examsData.filter(e => e.passed).length;
        const passRate = examsCount > 0 ? Math.round((passedCount / examsCount) * 100) : 85;

        const stats = { questionsCount, subjectsCount, examsCount, passRate };
        setToLocalStorage('site-stats', stats);
        return stats;
      },
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  // Prefetch all data needed for navigation
  const prefetchAll = useCallback(async () => {
    // Run all prefetches in parallel
    await Promise.all([
      prefetchLevels(),
      prefetchSubjectCounts(),
      prefetchStats(),
    ]);
    
    // Then prefetch subjects (depends on levels being loaded)
    await prefetchAllSubjects();
  }, [prefetchLevels, prefetchSubjectCounts, prefetchStats, prefetchAllSubjects]);

  return {
    prefetchLevels,
    prefetchSubjectCounts,
    prefetchAllSubjects,
    prefetchStats,
    prefetchAll,
  };
}

// Hook to automatically preload data on mount
export function useAutoPreload() {
  const { prefetchAll } = useDataPreloader();

  useEffect(() => {
    // Start preloading after a short delay to not block initial render
    const timer = setTimeout(() => {
      prefetchAll();
    }, 100);

    return () => clearTimeout(timer);
  }, [prefetchAll]);
}
