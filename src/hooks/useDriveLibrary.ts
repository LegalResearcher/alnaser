/**
 * useDriveLibrary.ts
 * Hook لجلب مجلدات وملفات المكتبة من Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery } from '@/hooks/useCachedQuery';

export interface DriveFolder {
  id: number;
  drive_id: string;
  name: string;
  parent_id: string | null;
  depth: number;
  order_index: number;
  is_premium: boolean;
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
}

/** جلب كل المجلدات مرة واحدة — يُخزَّن في cache */
export function useAllFolders() {
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
