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

// ─────────────────────────────────────────────────────────────
// باقتا اشتراك المكتبة (شهري / سنوي) — أسعار فعلية قابلة للتعديل
// من لوحة التحكم (platform_settings.library_subscription_plans).
// مستقلة تماماً عن "رسوم" نموذج الاشتراك العام أعلاه؛ تُستخدم فقط
// لعرض بطاقتي الباقات في شاشة "اشتراكي" (LegalSubscription.tsx).
// ─────────────────────────────────────────────────────────────
export interface LibrarySubscriptionPlans {
  currency: string;
  monthlyPrice: string;
  annualPrice: string;
  monthlyLabel: string;
  annualLabel: string;
}

export const LIBRARY_PLANS_DEFAULTS: LibrarySubscriptionPlans = {
  currency: '$',
  monthlyPrice: '4',
  annualPrice: '19',
  monthlyLabel: 'اشتراك شهري',
  annualLabel: 'اشتراك سنوي',
};

export function useLibrarySubscriptionPlans() {
  const { data } = useQuery({
    queryKey: ['library_subscription_plans'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('value')
        .eq('key', 'library_subscription_plans')
        .maybeSingle();
      if (data?.value) {
        try { return { ...LIBRARY_PLANS_DEFAULTS, ...JSON.parse(data.value) }; } catch {}
      }
      return LIBRARY_PLANS_DEFAULTS;
    },
    staleTime: 0,
    gcTime: 0,
  });
  return (data || LIBRARY_PLANS_DEFAULTS) as LibrarySubscriptionPlans;
}
