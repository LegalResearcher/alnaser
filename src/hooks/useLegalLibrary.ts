/**
 * useLegalLibrary.ts
 * Hooks بيانات قسم "المكتبة القانونية" الجديد (legal_documents / judicial_rules / legal_favorites)
 * يعيد استخدام نفس منطق getDeviceFingerprint() + review_passwords الموجود في DriveLibrary.tsx
 * دون تعديل ذلك المنطق نفسه — فقط يُطبَّق هنا على الجداول الجديدة.
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export async function getLibrarySubjectId(): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('platform_settings')
    .select('value')
    .eq('key', 'library_subject_id')
    .maybeSingle();
  return data?.value ?? null;
}

/** يتحقق إن كانت هناك جلسة اشتراك محفوظة وصالحة (نفس منطق DriveLibrary.tsx) */
export function useIsPremiumUnlocked() {
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
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
        .select('id, expires_at')
        .eq('password', pwd)
        .eq('is_active', true);
      if (savedSubjectId) query.eq('subject_id', savedSubjectId);
      query.maybeSingle().then(({ data }: any) => {
        if (data && !(data.expires_at && new Date(data.expires_at) < new Date())) {
          setIsPremiumUnlocked(true);
        } else {
          localStorage.removeItem(LIBRARY_PWD_KEY);
        }
        setChecked(true);
      });
    } catch {
      localStorage.removeItem(LIBRARY_PWD_KEY);
      setChecked(true);
    }
  }, []);

  return { isPremiumUnlocked, setIsPremiumUnlocked, checked };
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
export function useLegalDocumentContent(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['legal_document_content', id],
    queryFn: async () => {
      if (id == null) return [] as LegalContentItem[];
      const { data, error } = await (supabase as any)
        .from('legal_documents')
        .select('content')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data?.content || []) as LegalContentItem[];
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
export function useJudicialRuleContent(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['judicial_rule_content', id],
    queryFn: async () => {
      if (id == null) return '';
      const { data, error } = await (supabase as any)
        .from('judicial_rules')
        .select('content')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data?.content ?? '') as string;
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
}> = {
  law: {
    headerBg: 'bg-[#1a2744]',
    headerText: 'text-white',
    circleColor: 'bg-[#E8942A] text-white',
    articleNumColor: 'text-[#1565C0]',
    label: 'القوانين اليمنية',
    path: 'laws',
  },
  regulation: {
    headerBg: 'bg-[#4e342e]',
    headerText: 'text-white',
    circleColor: 'bg-[#6d4c41] text-white',
    articleNumColor: 'text-[#2e7d32]',
    label: 'اللوائح',
    path: 'regulations',
  },
  prosecution_instruction: {
    headerBg: 'bg-[#3949ab]',
    headerText: 'text-white',
    circleColor: 'bg-[#1a237e] text-white',
    articleNumColor: 'text-[#3949ab]',
    label: 'تعليمات النيابة العامة',
    path: 'prosecutions',
  },
};

export const JUDICIAL_HEADER_BG = 'bg-[#c8e6c9]';
export const JUDICIAL_ACCENT = '#2e7d32';
