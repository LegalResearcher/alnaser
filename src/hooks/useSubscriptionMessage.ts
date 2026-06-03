import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEFAULTS = {
  fee: '1000 ريال',
  note: 'يرجى تحويل المبلغ إلى الحساب الموضح، ثم رفع صورة الإيصال وتعبئة البيانات لتأكيد الاشتراك.',
};

export function useSubscriptionMessage() {
  const { data } = useQuery({
    queryKey: ['subscription_message'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('value')
        .eq('key', 'subscription_message')
        .maybeSingle();
      if (data?.value) {
        try { return { ...DEFAULTS, ...JSON.parse(data.value) }; } catch {}
      }
      return DEFAULTS;
    },
    staleTime: 0,        // لا cache — يجلب دائماً من Supabase
    gcTime: 0,           // لا يحتفظ بالبيانات القديمة
  });
  return data || DEFAULTS;
}
