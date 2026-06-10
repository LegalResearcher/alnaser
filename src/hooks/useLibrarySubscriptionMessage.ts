import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEFAULTS = {
  fee: '500 ريال',
  feeLabel: 'الرسوم',
  note: 'يرجى تحويل المبلغ إلى الحساب الموضح، ثم رفع صورة الإيصال وتعبئة البيانات لتأكيد الاشتراك.',
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
