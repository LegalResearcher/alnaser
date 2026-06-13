/**
 * useDriveLibrary.ts
 * Hook لجلب مجلدات وملفات المكتبة من Supabase
 * 
 * ✅ v4.1 — Realtime sync: أي تغيير من الأدمن (is_premium / download_locked)
 *           يُطبَّق فوراً على الزائر بدون إعادة تحميل الصفحة
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery, clearAppCache } from '@/hooks/useCachedQuery';
import { useQueryClient } from '@tanstack/react-query';

export interface DriveFolder {
  id: number;
  drive_id: string;
  name: string;
  parent_id: string | null;
  depth: number;
  order_index: number;
  is_premium: boolean;
  free_download: boolean;
}

export interface DriveFile {
  id: number;
  drive_id: string;
  name: string;
  folder_id: string;
  mime_type: string | null;
  view_url: string | null;
  embed_url: string | null;
  download_url: string | null;
  order_index: number;
  is_premium: boolean;
  view_count: number;
  download_count: number;
  download_locked: boolean;
  free_download: boolean;
}

/** جلب كل المجلدات مرة واحدة — يُخزَّن في cache */
export function useAllFolders() {
  const queryClient = useQueryClient();

  // ── Realtime: استمع لأي تغيير في drive_folders ──
  useEffect(() => {
    const channel = supabase
      .channel('drive-folders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drive_folders' },
        () => {
          // امسح localStorage فوراً ثم أعد الجلب
          clearAppCache();
          queryClient.invalidateQueries({ queryKey: ['drive-folders-all'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useCachedQuery<DriveFolder[]>(
    ['drive-folders-all'],
    async () => {
      const { data, error } = await supabase
        .from('drive_folders')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data as DriveFolder[];
    },
    { staleTime: 1000 * 60 * 10 }
  );
}

/** جلب ملفات مجلد بعينه */
export function useFolderFiles(folderId: string | null) {
  const queryClient = useQueryClient();

  // ── Realtime: استمع لأي تغيير في drive_files ──
  useEffect(() => {
    if (!folderId) return;

    const channel = supabase
      .channel(`drive-files-realtime-${folderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drive_files',
          filter: `folder_id=eq.${folderId}`,
        },
        () => {
          // امسح localStorage فوراً ثم أعد الجلب
          clearAppCache();
          queryClient.invalidateQueries({ queryKey: ['drive-files', folderId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [folderId, queryClient]);

  return useCachedQuery<DriveFile[]>(
    ['drive-files', folderId ?? ''],
    async () => {
      if (!folderId) return [];
      const { data, error } = await supabase
        .from('drive_files')
        .select('*')
        .eq('folder_id', folderId)
        .order('order_index');
      if (error) throw error;
      return data as DriveFile[];
    },
    { staleTime: 1000 * 60 * 10, enabled: !!folderId }
  );
}
