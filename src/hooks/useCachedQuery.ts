import { useQuery, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useRef, useCallback, useMemo } from 'react';

/**
 * إعدادات التخزين المؤقت العالمية
 * تم ضبطها لضمان أفضل أداء على هواتف المستخدمين
 */
const CACHE_PREFIX = 'alnaser_cache_v2_'; // بادئة فريدة لمنع تداخل البيانات
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // صلاحية 24 ساعة

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * وظيفة استعادة البيانات - تدعم التوافق مع SSR
 */
function getFromLocalStorage<T>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined; // أمان إضافي لبيئات السيرفر
  
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return undefined;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    
    // التحقق من صلاحية التخزين
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    
    return entry.data;
  } catch (error) {
    console.error('⚠️ Cache Recovery Error:', error);
    return undefined;
  }
}

/**
 * وظيفة تخزين البيانات - معالجة ذكية للأخطاء
 */
function setToLocalStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    // معالجة حالة امتلاء الذاكرة (QuotaExceededError)
    console.warn('⚠️ LocalStorage is full, skipping cache for:', key);
  }
}

/**
 * useCachedQuery Hook المطور
 * يجمع بين قوة React Query وسرعة التخزين المحلي
 */
export function useCachedQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryKey' | 'queryFn' | 'initialData'>
) {
  // توليد مفتاح فريد ومستقر للتخزين
  const cacheKey = useMemo(() => 
    Array.isArray(queryKey) ? queryKey.filter(k => typeof k !== 'object').join('_') : String(queryKey)
  , [queryKey]);
  
  // استعادة البيانات المخزنة قبل الرندرة الأولى لضمان UX فوري
  const cachedDataRef = useRef<T | undefined>(getFromLocalStorage<T>(cacheKey));
  
  const updateCache = useCallback((data: T) => {
    setToLocalStorage(cacheKey, data);
    cachedDataRef.current = data;
  }, [cacheKey]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await queryFn();
      updateCache(data);
      return data;
    },
    // عرض البيانات المخزنة فوراً لقتل حالة "التحميل" المملة
    initialData: cachedDataRef.current,
    initialDataUpdatedAt: cachedDataRef.current ? Date.now() - 1000 : undefined,
    staleTime: 5000, // اعتبار البيانات طازجة لـ 5 ثوانٍ لتقليل ضغط السيرفر
    ...options,
  });

  return {
    ...query,
    // احترافية عالمية: لا يظهر Loading إذا كانت البيانات موجودة في الكاش
    isLoading: !cachedDataRef.current && query.isLoading,
    data: query.data ?? cachedDataRef.current,
  };
}

/**
 * تنظيف شامل للذاكرة المؤقتة
 */
export function clearAppCache(): void {
  if (typeof window === 'undefined') return;
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}
