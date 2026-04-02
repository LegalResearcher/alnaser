import { useQuery, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useRef, useCallback, useMemo } from 'react';

// المحافظة على البادئة الأصلية لضمان عدم ضياع بيانات المستخدمين الحاليين
const CACHE_PREFIX = 'alnaser_cache_v2_';
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24 ساعة

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * وظيفة استعادة البيانات - تم إضافة فحص الـ window لضمان قبول Vercel للكود (SSR Safety)
 */
function getFromLocalStorage<T>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined;
  
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return undefined;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    
    // التحقق من انتهاء الصلاحية (نفس منطقك الأصلي)
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    
    return entry.data;
  } catch (error) {
    return undefined;
  }
}

/**
 * وظيفة تخزين البيانات في الذاكرة المحلية
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
    // في حال امتلاء الذاكرة، يتم التجاهل بصمت كما في كودك الأصلي
  }
}

/**
 * Hook الاستعلام المخبأ المطور
 */
export function useCachedQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryKey' | 'queryFn' | 'initialData'>
) {
  // تحسين: توليد مفتاح الكاش باستخدام useMemo لزيادة الأداء
  const cacheKey = useMemo(() => 
    Array.isArray(queryKey) ? queryKey.join('_') : String(queryKey)
  , [queryKey]);
  
  // الحصول على البيانات قبل أول رندرة (Synchronously) لسرعة العرض
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
    // استخدام البيانات المخزنة كبيانات أولية (Instant UI)
    initialData: cachedDataRef.current,
    initialDataUpdatedAt: cachedDataRef.current ? Date.now() - 1000 : undefined,
    staleTime: 0, // إعادة الجلب في الخلفية دائماً لضمان حداثة البيانات
    ...options,
  });

  return {
    ...query,
    // احترافية: لا تظهر حالة التحميل إذا كانت البيانات موجودة في الكاش
    isLoading: cachedDataRef.current ? false : query.isLoading,
    data: query.data ?? cachedDataRef.current,
  };
}

/**
 * وظيفة تنظيف الكاش (Exported)
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

/**
 * الوظيفة التي سببت الخطأ في Vercel (تم التأكد من عمل Export لها)
 * تقوم بتنظيف الكاش عند تحديث إصدار المنصة
 */
export function initializeCache(): void {
  if (typeof window === 'undefined') return;

  const cacheVersion = 'v2'; // نفس إصدارك الأصلي
  const storedVersion = localStorage.getItem('app_cache_version');
  
  if (storedVersion !== cacheVersion) {
    clearAppCache();
    localStorage.setItem('app_cache_version', cacheVersion);
    console.log('🚀 Alnaser Cache Initialized:', cacheVersion);
  }
}
