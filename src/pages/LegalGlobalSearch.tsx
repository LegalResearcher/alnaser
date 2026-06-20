/**
 * LegalGlobalSearch.tsx
 * البحث الشامل في جميع الأقسام (البند 9 من المواصفة)
 *
 * ملاحظة نطاق صادقة: البحث في judicial_rules يبحث في النص الكامل (subject + content)
 * لأنهما أعمدة نصية حقيقية. أما legal_documents فالبحث حالياً على عنوان الملف (file_name)
 * فقط، لأن البحث العميق داخل عمود content (JSONB) يتطلب دالة Postgres مخصصة
 * (jsonb_array_elements + ILIKE) لم تُختبر على قاعدة بيانات حقيقية متصلة هنا.
 * عند ربط Supabase الفعلي يمكن إضافة هذه الدالة لاحقاً لتغطية نصوص المواد كاملة أيضاً.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, Search, X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_THEME } from '@/hooks/useLegalLibrary';

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-yellow-300 text-slate-900 rounded px-0.5">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export default function LegalGlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: docResults = [], isLoading: docsLoading } = useQuery({
    queryKey: ['global_search_docs', submittedQuery],
    queryFn: async () => {
      if (!submittedQuery.trim()) return [];
      const { data, error } = await (supabase as any)
        .from('legal_documents')
        .select('id, category, file_name')
        .ilike('file_name', `%${submittedQuery.trim()}%`)
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: !!submittedQuery.trim(),
  });

  const { data: ruleResults = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['global_search_rules', submittedQuery],
    queryFn: async () => {
      if (!submittedQuery.trim()) return [];
      const q = submittedQuery.trim();
      const { data, error } = await (supabase as any)
        .from('judicial_rules')
        .select('id, circuit, subject, content, rule_number')
        .or(`subject.ilike.%${q}%,content.ilike.%${q}%`)
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: !!submittedQuery.trim(),
  });

  const isLoading = docsLoading || rulesLoading;
  const totalCount = docResults.length + ruleResults.length;

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch { /* ignore */ }
  };

  const handleSubmit = () => setSubmittedQuery(query);

  return (
    <MainLayout>
      <div className="bg-[#1a2744] sticky top-0 z-30">
        <div className="container max-w-3xl flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-white p-1 -m-1">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-white">البحث الشامل</h1>
        </div>
        <div className="container max-w-3xl pb-4">
          <div className="relative border-2 border-violet-400 rounded-2xl">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="اكتب كلمة للبحث..."
              className="w-full h-11 pr-10 pl-10 rounded-2xl bg-white text-sm text-right outline-none"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" onClick={handleSubmit} />
            {query && (
              <button onClick={() => { setQuery(''); setSubmittedQuery(''); }} className="absolute left-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-3xl py-5 space-y-4 pb-16">
        {!submittedQuery.trim() && (
          <p className="text-center text-muted-foreground text-sm py-16">
            أكتب كلمة للبحث في الشريط أعلاه أولاً
          </p>
        )}

        {submittedQuery.trim() && isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {submittedQuery.trim() && !isLoading && (
          <>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              تم العثور على {totalCount} {totalCount === 1 ? 'نتيجة' : 'نتيجة'} ({docResults.length} مستند، {ruleResults.length} قاعدة قضائية)
            </p>

            {totalCount === 0 && (
              <p className="text-center text-muted-foreground text-sm py-10">لا توجد نتائج</p>
            )}

            {docResults.length > 0 && (
              <section className="space-y-2">
                <p className="text-xs font-black text-muted-foreground">المستندات (عناوين مطابقة)</p>
                {docResults.map((d: any) => {
                  const theme = CATEGORY_THEME[d.category as keyof typeof CATEGORY_THEME];
                  return (
                    <button
                      key={`doc-${d.id}`}
                      onClick={() => navigate(`/library/doc/${d.id}`)}
                      className="w-full text-right p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between"
                    >
                      <span className="text-sm font-bold">
                        <Highlight text={d.file_name} query={submittedQuery} />
                      </span>
                      <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 mr-2', theme?.circleColor)}>
                        {theme?.label}
                      </span>
                    </button>
                  );
                })}
              </section>
            )}

            {ruleResults.length > 0 && (
              <section className="space-y-2">
                <p className="text-xs font-black text-muted-foreground">القواعد القضائية</p>
                {ruleResults.map((r: any) => (
                  <div key={`rule-${r.id}`} className="p-3.5 rounded-2xl border border-border bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed flex-1">
                        <Highlight text={r.content} query={submittedQuery} />
                      </p>
                      <button onClick={() => copy(r.content, `rule-${r.id}`)} className="shrink-0">
                        {copiedId === `rule-${r.id}` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground/50" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">{r.circuit} — القاعدة {r.rule_number}</p>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
