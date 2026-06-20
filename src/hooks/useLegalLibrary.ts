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

/** مستند واحد كامل مع عمود content (للعرض داخل القانون) */
export function useLegalDocument(id: number | null) {
  return useQuery({
    queryKey: ['legal_document', id],
    queryFn: async () => {
      if (id == null) return null;
      const { data, error } = await (supabase as any)
        .from('legal_documents')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as LegalDocument | null;
    },
    enabled: id != null,
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

/** كل قواعد دائرة معيّنة */
export function useJudicialRulesByCircuit(circuit: string | null) {
  return useQuery({
    queryKey: ['judicial_rules_circuit', circuit],
    queryFn: async () => {
      if (!circuit) return [];
      const { data, error } = await (supabase as any)
        .from('judicial_rules')
        .select('*')
        .eq('circuit', circuit)
        .order('id', { ascending: true });
      if (error) throw error;
      return (data || []) as JudicialRule[];
    },
    enabled: !!circuit,
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
