import { useQuery, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';

const CACHE_PREFIX = 'app_cache_';
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getFromLocalStorage<T>(key: string): T | undefined {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return undefined;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    
    return entry.data;
  } catch {
    return undefined;
  }
}

function setToLocalStorage<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage might be full, silently fail
  }
}

export function useCachedQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryKey' | 'queryFn' | 'initialData'>
) {
  const cacheKey = Array.isArray(queryKey) ? queryKey.join('_') : String(queryKey);
  
  // Synchronously get cached data - this happens before first render
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
    // Use cached data as initial data - renders instantly without loading state
    initialData: cachedDataRef.current,
    // If we have cached data, consider it fresh enough to skip initial loading
    initialDataUpdatedAt: cachedDataRef.current ? Date.now() - 1000 : undefined,
    // Always refetch in background to get fresh data
    staleTime: 0,
    ...options,
  });

  return {
    ...query,
    // Never show loading if we have cached data
    isLoading: cachedDataRef.current ? false : query.isLoading,
    // Show data from cache or query
    data: query.data ?? cachedDataRef.current,
  };
}

// Clear all app caches
export function clearAppCache(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

// Force clear cache on first load if needed (run once)
export function initializeCache(): void {
  const cacheVersion = 'v2'; // Increment this to force cache clear
  const storedVersion = localStorage.getItem('app_cache_version');
  
  if (storedVersion !== cacheVersion) {
    clearAppCache();
    localStorage.setItem('app_cache_version', cacheVersion);
    console.log('Cache cleared and updated to', cacheVersion);
  }
}
