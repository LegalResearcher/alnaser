/**
 * useLegalLibrary.ts
 * Hooks بيانات قسم "المكتبة القانونية" الجديد (legal_documents / judicial_rules / legal_favorites)
 * يعيد استخدام نفس منطق getDeviceFingerprint() + review_passwords الموجود في DriveLibrary.tsx
 * دون تعديل ذلك المنطق نفسه — فقط يُطبَّق هنا على الجداول الجديدة.
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LEGAL_TRIAL_START_KEY, TRIAL_DAYS_DEFAULT } from '@/lib/legalLibraryKeys';

// ─────────────────────────────────────────────────────────────
// إعدادات التجربة المجانية — تُقرأ من platform_settings
// ─────────────────────────────────────────────────────────────

export interface LibraryTrialSettings {
  /** مدة التجربة بالأيام */
  trialDays: number;
  /** هل التجربة المجانية مفعّلة؟ إذا false: لا تجربة، يُطلب الاشتراك فوراً */
  trialEnabled: boolean;
  /** هل المكتبة مفتوحة مجاناً للجميع؟ إذا true: لا قيود على الوصول */
  libraryFree: boolean;
}

const TRIAL_SETTINGS_DEFAULT: LibraryTrialSettings = {
  trialDays: TRIAL_DAYS_DEFAULT,
  trialEnabled: true,
  libraryFree: false,
};

/**
 * يجلب إعدادات التجربة المجانية من platform_settings.
 * يُستخدم في useLegalAccessMode() وفي المكونات التي تحتاج معرفة الحالة.
 */
export function useLibraryTrialSettings() {
  return useQuery<LibraryTrialSettings>({
    queryKey: ['library_trial_settings'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('value')
        .eq('key', 'library_trial_settings')
        .maybeSingle();
      if (!data?.value) return TRIAL_SETTINGS_DEFAULT;
      try {
        const parsed = JSON.parse(data.value);
        return {
          trialDays: typeof parsed.trialDays === 'number' && parsed.trialDays > 0
            ? parsed.trialDays
            : TRIAL_DAYS_DEFAULT,
          trialEnabled: parsed.trialEnabled !== false,
          libraryFree: parsed.libraryFree === true,
        };
      } catch {
        return TRIAL_SETTINGS_DEFAULT;
      }
    },
    staleTime: 1000 * 30, // 30 ثانية — لضمان انعكاس التغييرات من لوحة الإدارة بسرعة
  });
}

// ─────────────────────────────────────────────────────────────
// أنواع البيانات
// ─────────────────────────────────────────────────────────────
export type LegalCategory = 'law' | 'regulation' | 'prosecution_instruction';

export interface LegalContentItem {
  type: 'preamble' | 'section' | 'side_title' | 'article' | 'conclusion';
  text?: string;
  level?: string;
  title?: string;
  article_number?: number;
  num?: string;
}

export interface LegalDocument {
  id: number;
  category: LegalCategory;
  file_name: string;
  display_order: number;
  is_featured: boolean;
  is_premium: boolean;
  content: LegalContentItem[];
  created_at: string;
}

export interface JudicialRule {
  id: number;
  circuit: string;
  issue_number: string | null;
  rule_number: string;
  case_number: string | null;
  page: string | null;
  subject: string;
  content: string;
  is_premium: boolean;
  source_file: string | null;
  created_at: string;
}

export type FavoriteItemType = 'document' | 'article' | 'rule';

// ─────────────────────────────────────────────────────────────
// device fingerprint — نفس منطق DriveLibrary.tsx حرفياً
// ─────────────────────────────────────────────────────────────
export function getDeviceFingerprint(): string {
  try {
    let canvasHash = '';
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top'; ctx.font = '14px Arial';
        ctx.fillStyle = '#f60'; ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069'; ctx.fillText('alnaseer🔑', 2, 15);
        ctx.fillStyle = 'rgba(102,204,0,0.7)'; ctx.fillText('alnaseer🔑', 4, 17);
        canvasHash = canvas.toDataURL().slice(-40);
      }
    } catch { /* ignore */ }
    const nav = window.navigator;
    const raw = [nav.userAgent, nav.language, nav.platform, screen.width, screen.height, screen.colorDepth, new Date().getTimezoneOffset(), canvasHash].join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
    return `fp_${Math.abs(hash).toString(36)}`;
  } catch { return `fp_${Date.now().toString(36)}`; }
}

const LIBRARY_PWD_KEY = 'library_review_pwd_v2'; // نفس المفتاح المستخدم في DriveLibrary.tsx لإعادة استخدام نفس الجلسة المُتحقَّقة

/**
 * يقرأ كلمة مرور المكتبة المحفوظة محلياً (إن وُجدت وتطابق بصمة الجهاز الحالية)
 * لإرسالها إلى RPC الآمنة عند جلب محتوى مدفوع — التحقق الفعلي يتم على
 * الخادم (get_legal_document_content / get_judicial_rule_content)،
 * هذا فقط لتمرير القيمة المحفوظة دون إعادة فتح مودال كلمة المرور.
 */
function getSavedLibraryPassword(): string | null {
  try {
    const saved = localStorage.getItem(LIBRARY_PWD_KEY);
    if (!saved) return null;
    const { pwd, fp } = JSON.parse(saved);
    if (!pwd || fp !== getDeviceFingerprint()) return null;
    return pwd as string;
  } catch {
    return null;
  }
}

export async function getLibrarySubjectId(): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('platform_settings')
    .select('value')
    .eq('key', 'library_subject_id')
    .maybeSingle();
  return data?.value ?? null;
}

/** يتحقق إن كانت هناك جلسة اشتراك محفوظة وصالحة (نفس منطق DriveLibrary.tsx)
 *  ويعيد أيضاً تاريخي بداية/انتهاء الاشتراك الفعلي (first_used_at / expires_at)
 *  لعرضهما بنفس منطق بطاقة التجربة المجانية. */
export function useIsPremiumUnlocked() {
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [subscriptionDates, setSubscriptionDates] = useState<{ start: Date; end: Date | null } | null>(null);
  const { data: trialSettings, isLoading: trialSettingsLoading } = useLibraryTrialSettings();

  useEffect(() => {
    // إذا المكتبة مفتوحة مجاناً → أطلق القفل مباشرةً بدون التحقق من كلمة المرور
    if (trialSettingsLoading) return;
    if (trialSettings?.libraryFree) {
      setIsPremiumUnlocked(true);
      setChecked(true);
      return;
    }

    const saved = localStorage.getItem(LIBRARY_PWD_KEY);
    if (!saved) { setChecked(true); return; }
    try {
      const { pwd, fp, subjectId: savedSubjectId } = JSON.parse(saved);
      if (fp !== getDeviceFingerprint()) {
        localStorage.removeItem(LIBRARY_PWD_KEY);
        setChecked(true);
        return;
      }
      const query = (supabase as any).from('review_passwords')
        .select('id, expires_at, first_used_at, created_at')
        .eq('password', pwd)
        .eq('is_active', true);
      if (savedSubjectId) query.eq('subject_id', savedSubjectId);
      query.maybeSingle().then(({ data }: any) => {
        if (data && !(data.expires_at && new Date(data.expires_at) < new Date())) {
          setIsPremiumUnlocked(true);
          setSubscriptionDates({
            start: new Date(data.first_used_at ?? data.created_at ?? Date.now()),
            end: data.expires_at ? new Date(data.expires_at) : null,
          });
        } else {
          localStorage.removeItem(LIBRARY_PWD_KEY);
        }
        setChecked(true);
      });
    } catch {
      localStorage.removeItem(LIBRARY_PWD_KEY);
      setChecked(true);
    }
  }, [trialSettingsLoading, trialSettings?.libraryFree]);

  return { isPremiumUnlocked, setIsPremiumUnlocked, checked, subscriptionDates };
}

// ─────────────────────────────────────────────────────────────
// وضع الاستخدام المجاني المحدود
// (يُفعَّل تلقائياً بعد انتهاء التجربة المجانية لمن لم يشترك، حال
// اختياره الاستمرار "مجاناً" بمزايا محدودة من شاشة انتهاء التجربة)
// ─────────────────────────────────────────────────────────────
const LIMITED_MODE_KEY = 'legal_library_limited_mode_v1';

/** يُفعَّل عند ضغط المستخدم "الدخول للتطبيق" في مودال "الاستخدام المجاني المحدود" */
export function activateLimitedMode() {
  try { localStorage.setItem(LIMITED_MODE_KEY, '1'); } catch { /* ignore */ }
}

function readLimitedModeFlag(): boolean {
  try { return localStorage.getItem(LIMITED_MODE_KEY) === '1'; } catch { return false; }
}

/**
 * يجمع حالة "إمكانية الوصول" الكاملة للمكتبة في مكان واحد:
 * - trialActive: التجربة المجانية بدأت ولم تنتهِ بعد.
 * - trialExpired: التجربة بدأت فعلاً وانتهت (تحتاج قرار: اشتراك أو وضع محدود).
 * - isLimitedMode: المستخدم اختار صريحاً الاستمرار بمزايا محدودة بعد
 *   انتهاء التجربة، ولم يشترك بعد. في هذا الوضع: القراءة الكاملة لكل
 *   المستندات متاحة (حتى المدفوعة)، لكن البحث/النسخ/المفضلة محجوبة.
 * - shouldShowTrialEndedScreen: يجب إظهار شاشة "انتهت التجربة" (صورة 1)
 *   لأن التجربة انتهت، ولا اشتراك فعّال، ولم يختر المستخدم الوضع المحدود بعد.
 */
export function useLegalAccessMode() {
  const { isPremiumUnlocked, checked } = useIsPremiumUnlocked();
  const [isLimitedMode, setIsLimitedModeState] = useState(readLimitedModeFlag());
  const { data: trialSettings, isLoading: trialSettingsLoading } = useLibraryTrialSettings();

  // إن تحقق الاشتراك لاحقاً (مثلاً بعد إدخال رمز تفعيل) نُسقط الوضع المحدود تلقائياً
  useEffect(() => {
    if (isPremiumUnlocked && isLimitedMode) {
      try { localStorage.removeItem(LIMITED_MODE_KEY); } catch { /* ignore */ }
      setIsLimitedModeState(false);
    }
  }, [isPremiumUnlocked, isLimitedMode]);

  const effectiveTrialDays = trialSettings?.trialDays ?? TRIAL_DAYS_DEFAULT;
  const trialEnabled = trialSettings?.trialEnabled !== false;
  const libraryFree = trialSettings?.libraryFree === true;

  const trialDates = (() => {
    // إذا المكتبة مفتوحة مجاناً أو التجربة مُوقفة → لا تواريخ تجربة
    if (libraryFree || !trialEnabled) return null;
    try {
      const startIso = localStorage.getItem(LEGAL_TRIAL_START_KEY);
      if (!startIso) return null;
      const start = new Date(startIso);
      const end = new Date(start);
      end.setDate(end.getDate() + effectiveTrialDays);
      return { start, end };
    } catch { return null; }
  })();

  const trialExpired = !!trialDates && trialDates.end.getTime() < Date.now();
  // إذا المكتبة مفتوحة مجاناً → لا نُظهر شاشة الانتهاء أبداً
  const shouldShowTrialEndedScreen = !libraryFree && checked && !isPremiumUnlocked && trialExpired && !isLimitedMode;

  const enterLimitedMode = () => {
    activateLimitedMode();
    setIsLimitedModeState(true);
  };

  return {
    checked,
    isPremiumUnlocked,
    trialDates,
    trialExpired,
    isLimitedMode,
    shouldShowTrialEndedScreen,
    enterLimitedMode,
    // إعدادات التجربة (لاستخدامها في المكونات الأخرى)
    libraryFree,
    trialEnabled,
    effectiveTrialDays,
    trialSettingsLoading,
  };
}

// ─────────────────────────────────────────────────────────────
// legal_documents
// ─────────────────────────────────────────────────────────────

/** كل المستندات لقسم معيّن (law / regulation / prosecution_instruction) — قائمة خفيفة بدون عمود content الثقيل */
export function useLegalDocumentsList(category: LegalCategory) {
  return useQuery({
    queryKey: ['legal_documents_list', category],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('legal_documents')
        .select('id, category, file_name, display_order, is_featured, is_premium, created_at')
        .eq('category', category)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as Omit<LegalDocument, 'content'>[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * بيانات المستند الخفيفة (بدون عمود content) — تُجلب أولاً ودائماً لمعرفة
 * is_premium قبل أي قرار بجلب النص الكامل.
 */
export type LegalDocumentMeta = Omit<LegalDocument, 'content'>;

export function useLegalDocumentMeta(id: number | null) {
  return useQuery({
    queryKey: ['legal_document_meta', id],
    queryFn: async () => {
      if (id == null) return null;
      const { data, error } = await (supabase as any)
        .from('legal_documents')
        .select('id, category, file_name, display_order, is_featured, is_premium, created_at')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as LegalDocumentMeta | null;
    },
    enabled: id != null,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * ⚠️ إصلاح أمني: نص المستند الكامل (عمود content فقط) — لا يُفعَّل (enabled)
 * إلا بعد التأكد في الصفحة المستدعية أن المستند غير مدفوع أو أن المستخدم
 * تحقّق فعلاً من كلمة المرور. بهذا لا يُرسَل نص القانون المدفوع كاملاً عبر
 * الشبكة إطلاقاً لزائر لم يُفتح له — بخلاف السابق الذي كان يجلب * (كل
 * الأعمدة بما فيها content) فوراً عند فتح أي رابط /library/doc/:id مباشرة،
 * بصرف النظر عن حالة الاشتراك.
 */
export function useLegalDocumentContent(id: number | null, enabled: boolean, limitedMode: boolean = false) {
  const { data: trialSettings } = useLibraryTrialSettings();
  const libraryFree = trialSettings?.libraryFree === true;

  return useQuery({
    queryKey: ['legal_document_content', id, limitedMode, libraryFree],
    queryFn: async () => {
      if (id == null) return [] as LegalContentItem[];

      // إذا المكتبة مفتوحة مجاناً → اجلب مباشرة من الجدول بدون RPC
      if (libraryFree) {
        const { data, error } = await (supabase as any)
          .from('legal_documents')
          .select('content')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return (data?.content || []) as LegalContentItem[];
      }

      const { data, error } = await (supabase as any).rpc('get_legal_document_content', {
        p_id: id,
        p_password: getSavedLibraryPassword(),
        p_fingerprint: getDeviceFingerprint(),
        p_limited_mode: limitedMode,
      });
      if (error) throw error;
      if (!data || data.status !== 'ok') return [] as LegalContentItem[];
      return (data.content || []) as LegalContentItem[];
    },
    enabled: enabled && id != null,
    staleTime: 1000 * 60 * 10,
  });
}

// ─────────────────────────────────────────────────────────────
// judicial_rules
// ─────────────────────────────────────────────────────────────

/**
 * توزيع القواعد القضائية حسب الدائرة (للصفحة الجذرية لقسم القواعد القضائية)
 *
 * ⚠️ لا تُبدّل هذا الاستعلام بـ `.from('judicial_rules').select('circuit')` بدون
 * `.range()` — Supabase يُرجع 1000 صف كحد أقصى افتراضياً لكل استجابة API، وعدد
 * القواعد القضائية الكلي (1997) يتجاوز هذا الحد، فسينتج عدّاً ناقصاً صامتاً
 * (دوائر كاملة قد تختفي من النتيجة). الحل: دالة RPC تُجري GROUP BY على الخادم
 * نفسه (انظر create_judicial_circuit_counts_rpc.sql) وتُرجع صفاً واحداً لكل
 * دائرة فقط، بمنأى تام عن حد الـ1000 صف.
 */
export function useJudicialCircuits() {
  return useQuery({
    queryKey: ['judicial_circuits'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_judicial_circuit_counts');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: { circuit: string; count: number }) => {
        counts[r.circuit] = Number(r.count);
      });
      return counts;
    },
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * بيانات قواعد دائرة معيّنة الخفيفة (بدون عمود content) — نفس مبدأ
 * legal_documents أعلاه: لا نجلب النص الكامل لقاعدة مدفوعة إلا بعد التحقق.
 */
export type JudicialRuleMeta = Omit<JudicialRule, 'content'>;

export function useJudicialRulesByCircuit(circuit: string | null) {
  return useQuery({
    queryKey: ['judicial_rules_circuit', circuit],
    queryFn: async () => {
      if (!circuit) return [];
      const { data, error } = await (supabase as any)
        .from('judicial_rules')
        .select('id, circuit, issue_number, rule_number, case_number, page, subject, is_premium, source_file, created_at')
        .eq('circuit', circuit)
        .order('id', { ascending: true });
      if (error) throw error;
      return (data || []) as JudicialRuleMeta[];
    },
    enabled: !!circuit,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * ⚠️ إصلاح أمني: نص القاعدة القضائية الكامل — يُجلب فقط عند توسعة البطاقة
 * (Accordion) ولا يُفعَّل إن كانت القاعدة مدفوعة ولم يتحقق المستخدم بعد.
 */
export function useJudicialRuleContent(id: number | null, enabled: boolean, limitedMode: boolean = false) {
  const { data: trialSettings } = useLibraryTrialSettings();
  const libraryFree = trialSettings?.libraryFree === true;

  return useQuery({
    queryKey: ['judicial_rule_content', id, limitedMode, libraryFree],
    queryFn: async () => {
      if (id == null) return '';

      // إذا المكتبة مفتوحة مجاناً → اجلب مباشرة من الجدول بدون RPC
      if (libraryFree) {
        const { data, error } = await (supabase as any)
          .from('judicial_rules')
          .select('content')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return (data?.content ?? '') as string;
      }

      const { data, error } = await (supabase as any).rpc('get_judicial_rule_content', {
        p_id: id,
        p_password: getSavedLibraryPassword(),
        p_fingerprint: getDeviceFingerprint(),
        p_limited_mode: limitedMode,
      });
      if (error) throw error;
      if (!data || data.status !== 'ok') return '';
      return (data.content ?? '') as string;
    },
    enabled: enabled && id != null,
    staleTime: 1000 * 60 * 10,
  });
}

// ─────────────────────────────────────────────────────────────
// legal_favorites — مفتاحة بـ device_fingerprint (لا يوجد auth.uid في هذا النظام)
// ─────────────────────────────────────────────────────────────

export function useLegalFavorites() {
  const fingerprint = useMemo(() => getDeviceFingerprint(), []);
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['legal_favorites', fingerprint],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('legal_favorites')
        .select('*')
        .eq('device_fingerprint', fingerprint);
      if (error) throw error;
      return (data || []) as { id: number; item_type: FavoriteItemType; item_ref: string }[];
    },
    staleTime: 1000 * 60,
  });

  const favoriteRefs = useMemo(() => {
    const set = new Set<string>();
    favorites.forEach(f => set.add(`${f.item_type}:${f.item_ref}`));
    return set;
  }, [favorites]);

  const isFavorite = (itemType: FavoriteItemType, itemRef: string) =>
    favoriteRefs.has(`${itemType}:${itemRef}`);

  const toggleFavorite = async (itemType: FavoriteItemType, itemRef: string) => {
    const key = `${itemType}:${itemRef}`;
    const existing = favorites.find(f => `${f.item_type}:${f.item_ref}` === key);
    if (existing) {
      await (supabase as any).from('legal_favorites').delete().eq('id', existing.id);
    } else {
      await (supabase as any).from('legal_favorites').insert({
        device_fingerprint: fingerprint,
        item_type: itemType,
        item_ref: itemRef,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['legal_favorites', fingerprint] });
  };

  return { favorites, isLoading, isFavorite, toggleFavorite, fingerprint };
}

/**
 * يحلّ عناصر المفضلة (document / article / rule) إلى بيانات كاملة قابلة للعرض
 * في صفحة "المفضلة" — استعلامان مجمَّعان فقط (IN) بدل استعلام لكل عنصر.
 */
export function useResolvedLegalFavorites() {
  const { favorites, isLoading: favLoading, isFavorite, toggleFavorite } = useLegalFavorites();

  const documentFavRefs = useMemo(
    () => favorites.filter(f => f.item_type === 'document').map(f => f.item_ref),
    [favorites]
  );
  const ruleFavRefs = useMemo(
    () => favorites.filter(f => f.item_type === 'rule').map(f => f.item_ref),
    [favorites]
  );
  const articleFavRefs = useMemo(
    () => favorites.filter(f => f.item_type === 'article').map(f => f.item_ref),
    [favorites]
  );
  // مرجع المادة المفضلة بصيغة "docId:contentIdx" — نحتاج مستندات هذه المعرّفات كاملة (مع content)
  const articleDocIds = useMemo(
    () => Array.from(new Set(articleFavRefs.map(r => Number(r.split(':')[0])))).filter(n => !Number.isNaN(n)),
    [articleFavRefs]
  );

  const { data: favoriteDocuments = [], isLoading: docsLoading } = useQuery({
    queryKey: ['legal_favorite_documents', documentFavRefs],
    queryFn: async () => {
      if (documentFavRefs.length === 0) return [];
      const ids = documentFavRefs.map(r => Number(r));
      const { data, error } = await (supabase as any)
        .from('legal_documents')
        .select('id, category, file_name, is_premium')
        .in('id', ids);
      if (error) throw error;
      return (data || []) as Pick<LegalDocument, 'id' | 'category' | 'file_name' | 'is_premium'>[];
    },
    enabled: documentFavRefs.length > 0,
    staleTime: 1000 * 60,
  });

  const { data: favoriteRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['legal_favorite_rules', ruleFavRefs],
    queryFn: async () => {
      if (ruleFavRefs.length === 0) return [];
      const ids = ruleFavRefs.map(r => Number(r));
      const { data, error } = await (supabase as any)
        .from('judicial_rules')
        .select('id, circuit, subject, content, rule_number')
        .in('id', ids);
      if (error) throw error;
      return (data || []) as JudicialRule[];
    },
    enabled: ruleFavRefs.length > 0,
    staleTime: 1000 * 60,
  });

  const { data: articleSourceDocs = [], isLoading: articleDocsLoading } = useQuery({
    queryKey: ['legal_favorite_article_docs', articleDocIds],
    queryFn: async () => {
      if (articleDocIds.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from('legal_documents')
        .select('id, category, file_name, content')
        .in('id', articleDocIds);
      if (error) throw error;
      return (data || []) as LegalDocument[];
    },
    enabled: articleDocIds.length > 0,
    staleTime: 1000 * 60,
  });

  const favoriteArticles = useMemo(() => {
    const byId = new Map(articleSourceDocs.map(d => [d.id, d]));
    return articleFavRefs
      .map(ref => {
        const [docIdStr, idxStr] = ref.split(':');
        const docId = Number(docIdStr);
        const idx = Number(idxStr);
        const doc = byId.get(docId);
        const item = doc?.content?.[idx];
        if (!doc || !item) return null;
        return {
          ref,
          docId,
          idx,
          fileName: doc.file_name,
          category: doc.category,
          num: item.num ?? '',
          text: item.text ?? '',
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [articleFavRefs, articleSourceDocs]);

  const isLoading = favLoading || docsLoading || rulesLoading || articleDocsLoading;
  const isEmpty = favorites.length === 0;

  return {
    isLoading,
    isEmpty,
    favoriteDocuments,
    favoriteRules,
    favoriteArticles,
    isFavorite,
    toggleFavorite,
  };
}

// ─────────────────────────────────────────────────────────────
// ثيم الألوان حسب القسم — مطابق للقطات الشاشة المرجعية
// ─────────────────────────────────────────────────────────────
export const CATEGORY_THEME: Record<LegalCategory, {
  headerBg: string; headerText: string; circleColor: string; articleNumColor: string; label: string; path: string;
  /** حدود/خلفية فاتحة بلون التصنيف — تُستخدم في شرائح فهرس أرقام المواد (LegalDocumentViewer) */
  accentBorder: string; accentBg: string;
}> = {
  law: {
    headerBg: 'bg-[#1a2744]',
    headerText: 'text-white',
    circleColor: 'bg-[#E8942A] text-white',
    articleNumColor: 'text-[#1565C0]',
    label: 'القوانين اليمنية',
    path: 'laws',
    accentBorder: 'border-[#1565C0]/30',
    accentBg: 'bg-[#1565C0]/5 dark:bg-[#1565C0]/10',
  },
  regulation: {
    headerBg: 'bg-[#4e342e]',
    headerText: 'text-white',
    circleColor: 'bg-[#6d4c41] text-white',
    articleNumColor: 'text-[#2e7d32]',
    label: 'اللوائح',
    path: 'regulations',
    accentBorder: 'border-[#2e7d32]/30',
    accentBg: 'bg-[#2e7d32]/5 dark:bg-[#2e7d32]/10',
  },
  prosecution_instruction: {
    headerBg: 'bg-[#3949ab]',
    headerText: 'text-white',
    circleColor: 'bg-[#1a237e] text-white',
    articleNumColor: 'text-[#3949ab]',
    label: 'تعليمات النيابة العامة',
    path: 'prosecutions',
    accentBorder: 'border-[#3949ab]/30',
    accentBg: 'bg-[#3949ab]/5 dark:bg-[#3949ab]/10',
  },
};

export const JUDICIAL_HEADER_BG = 'bg-[#c8e6c9]';
export const JUDICIAL_ACCENT = '#2e7d32';

// ─────────────────────────────────────────────────────────────
// فهارس الأحكام (خدمة "أحكام المحكمة العليا" — خدماتنا الأخرى)
// جدول judicial_index_topics: دائرة + موضوع، يُستخدم فقط لتوجيه
// طلب المستخدم عبر تيليجرام (لا يعرض نص الحكم نفسه)
// ─────────────────────────────────────────────────────────────
export interface JudicialIndexTopic {
  id: number;
  circuit: string;
  topic: string;
  circuit_order: number;
  topic_order: number;
}

/** الترتيب الثابت لأسماء الدوائر كما تظهر في تطبيق "القوانين اليمنية" المرجعي */
export const JUDICIAL_INDEX_CIRCUITS = [
  'الدائرة الادارية',
  'الدائرة الشخصية',
  'الدائرة التجارية',
  'الدائرة المدنية',
  'الدائرة الجزائية',
  'الدائرة العسكرية',
  'دائرة فحص الطعون',
] as const;

/** كل مواضيع فهرس الأحكام مجمّعة — تُجلب مرة واحدة ثم تُفلتر بالدائرة في الواجهة */
export function useJudicialIndexTopics() {
  return useQuery({
    queryKey: ['judicial_index_topics'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('judicial_index_topics')
        .select('id, circuit, topic, circuit_order, topic_order')
        .order('circuit_order', { ascending: true })
        .order('topic_order', { ascending: true })
        .range(0, 999);
      if (error) throw error;
      return (data || []) as JudicialIndexTopic[];
    },
    staleTime: 1000 * 60 * 30,
  });
}
