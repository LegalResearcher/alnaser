import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEFAULTS = {
  fee: '1000 ريال',
  note: 'اشترك للوصول الكامل لملفات المكتبة المدفوعة وتحميلها.',
};

export function useLibrarySubscriptionMessage() {
  const { data } = useQuery({
    queryKey: ['library_subscription_message'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('value')
        .eq('key', 'library_subscription_message')
        .maybeSingle();
      if (data?.value) {
        try { return { ...DEFAULTS, ...JSON.parse(data.value) }; } catch {}
      }
      return DEFAULTS;
    },
    staleTime: 0,
    gcTime: 0,
  });
  return data || DEFAULTS;
}
