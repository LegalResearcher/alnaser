/**
 * LegalGlobalSearch.tsx
 * البحث الشامل في جميع الأقسام (البند 9 من المواصفة)
 *
 * مطابق للقطة الشاشة المرجعية: شريط فلترة + بحث، صف أدوات (الخط/ليلي/تطابق/بحث
 * برقم المادة)، رسالة نتائج خضراء بإحصائيات دقيقة (كلمة/مادة/قانون)، وبطاقات
 * نتائج بعنوان أزرق + أيقونة نسخ + تظليل أصفر للكلمات المطابقة + "عرض المزيد".
 *
 * البحث يغطي الآن نص المواد الكامل (لا عناوين الملفات فقط) عبر دالة RPC
 * `search_legal_articles` التي تُجري jsonb_array_elements داخل Postgres نفسه
 * (راجع supabase/sql/search_legal_articles.sql — يجب تنفيذها مرة واحدة في
 * محرر SQL بمشروع Supabase قبل أن يعمل هذا البحث). في حال عدم تنفيذها بعد،
 * يتم تجاهل الخطأ بصمت وعرض نتائج العناوين والقواعد القضائية فقط (Graceful
 * degradation) دون كسر الصفحة.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  ChevronRight, Search, X, Copy, Check, SlidersHorizontal, Type, Moon, Sun, Hash, Equal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_THEME, LegalCategory, useLegalAccessMode } from '@/hooks/useLegalLibrary';
import { useReaderPreferences } from '@/hooks/useReaderPreferences';
import { FeatureLockedModal } from '@/components/legal-library/LegalLimitedAccessModals';

const CATEGORY_FILTERS: { value: LegalCategory; label: string }[] = [
  { value: 'law', label: 'القوانين' },
  { value: 'regulation', label: 'اللوائح' },
  { value: 'prosecution_instruction', label: 'تعليمات النيابة' },
];

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${escapeRegex(query.trim())})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) && part.toLowerCase() === query.trim().toLowerCase()
          ? <mark key={i} className="bg-yellow-300 text-slate-900 rounded px-0.5">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

/** يحسب عدد مرات تكرار الاستعلام داخل نص — لإحصائية "كلمة" الإجمالية */
function countOccurrences(text: string, query: string) {
  if (!query.trim()) return 0;
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  let count = 0;
  let pos = 0;
  while (true) {
    const idx = t.indexOf(q, pos);
    if (idx === -1) break;
    count++;
    pos = idx + q.length;
  }
  return count;
}

interface ArticleResult {
  document_id: number;
  file_name: string;
  category: LegalCategory;
  content_idx: number;
  article_num: string | null;
  article_text: string;
}

function ArticleResultCard({
  result, query, fontSize, nightMode, copy, copiedKey,
}: {
  result: ArticleResult; query: string; fontSize: number; nightMode: boolean;
  copy: (text: string, key: string) => void; copiedKey: string | null;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const theme = CATEGORY_THEME[result.category];
  const key = `art-${result.document_id}-${result.content_idx}`;
  const LONG_THRESHOLD = 420;
  const isLong = result.article_text.length > LONG_THRESHOLD;
  const displayText = isLong && !expanded ? result.article_text.slice(0, LONG_THRESHOLD) + '…' : result.article_text;

  return (
    <div className={cn('rounded-2xl border p-4', nightMode ? 'bg-slate-900 border-slate-800' : 'bg-card border-border')}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <button
          onClick={() => navigate(`/library/doc/${result.document_id}`)}
          className={cn('text-sm font-black text-right flex-1', theme.articleNumColor)}
        >
          مادة ({result.article_num ?? '—'}): {result.file_name}
        </button>
        <button onClick={() => copy(result.article_text, key)} className="shrink-0" aria-label="نسخ">
          {copiedKey === key ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground/50" />}
        </button>
      </div>
      <p className="leading-loose whitespace-pre-line" style={{ fontSize: `${fontSize}px` }}>
        <Highlight text={displayText} query={query} />
      </p>
      {isLong && (
        <button onClick={() => setExpanded(e => !e)} className={cn('mt-2 text-xs font-black', theme.articleNumColor)}>
          {expanded ? 'عرض أقل' : 'عرض المزيد'}
        </button>
      )}
    </div>
  );
}

export default function LegalGlobalSearch() {
  const navigate = useNavigate();
  const { isLimitedMode } = useLegalAccessMode();
  const [showLockedModal, setShowLockedModal] = useState(isLimitedMode);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showFilter, setShowFilter] = useState(false);
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [activeCategories, setActiveCategories] = useState<LegalCategory[]>(
    CATEGORY_FILTERS.map(c => c.value)
  );
  const [exactMatch, setExactMatch] = useState(false);
  const [byNumber, setByNumber] = useState(false);

  const { fontSize, increaseFont, decreaseFont, nightMode, toggleNightMode } = useReaderPreferences();

  const toggleCategory = (cat: LegalCategory) => {
    setActiveCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // ── بحث نص المواد الكامل عبر RPC (يتدهور بصمت إن لم تُنفَّذ الدالة بعد) ──
  const { data: articleResults = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['global_search_articles', submittedQuery, exactMatch, byNumber, activeCategories],
    queryFn: async () => {
      if (!submittedQuery.trim()) return [];
      try {
        const { data, error } = await (supabase as any).rpc('search_legal_articles', {
          p_query: submittedQuery.trim(),
          p_exact: exactMatch,
          p_by_number: byNumber,
          p_categories: activeCategories.length === CATEGORY_FILTERS.length ? null : activeCategories,
        });
        if (error) throw error;
        return (data || []) as ArticleResult[];
      } catch {
        // دالة RPC لم تُنفَّذ بعد على قاعدة البيانات — لا نكسر الصفحة، فقط لا نتائج من هذا المصدر
        return [];
      }
    },
    enabled: !!submittedQuery.trim(),
  });

  // ── مطابقة عناوين الملفات (احتياطي يعمل دائماً، مفيد عند تعطّل RPC) ──
  const { data: docResults = [], isLoading: docsLoading } = useQuery({
    queryKey: ['global_search_docs', submittedQuery, activeCategories],
    queryFn: async () => {
      if (!submittedQuery.trim()) return [];
      let q = (supabase as any)
        .from('legal_documents')
        .select('id, category, file_name')
        .ilike('file_name', `%${submittedQuery.trim()}%`)
        .limit(20);
      if (activeCategories.length < CATEGORY_FILTERS.length) {
        q = q.in('category', activeCategories);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!submittedQuery.trim(),
  });

  // ── القواعد القضائية ──
  const { data: ruleResults = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['global_search_rules', submittedQuery, exactMatch],
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

  const isLoading = articlesLoading || docsLoading || rulesLoading;

  const articleStats = useMemo(() => {
    const articleCount = articleResults.length;
    const lawCount = new Set(articleResults.map(r => r.document_id)).size;
    const wordCount = articleResults.reduce(
      (sum, r) => sum + countOccurrences(r.article_text, submittedQuery), 0
    );
    return { articleCount, lawCount, wordCount };
  }, [articleResults, submittedQuery]);

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch { /* ignore */ }
  };

  const handleSubmit = () => setSubmittedQuery(query);

  // ── البحث الشامل محجوب بالكامل في وضع الاستخدام المجاني المحدود ──
  if (isLimitedMode) {
    return (
      <MainLayout>
        <div className="bg-[#1a2744] sticky top-0 z-30">
          <div className="container max-w-3xl flex items-center gap-3 py-4">
            <button onClick={() => navigate(-1)} className="text-white p-1 -m-1">
              <ChevronRight className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black text-white">بحث شامل في القوانين</h1>
          </div>
        </div>
        <div className="min-h-[calc(100vh-64px)]" />
        {showLockedModal && (
          <FeatureLockedModal onClose={() => { setShowLockedModal(false); navigate(-1); }} />
        )}
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-[#1a2744] sticky top-0 z-30">
        <div className="container max-w-3xl flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-white p-1 -m-1">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-white">بحث شامل في القوانين</h1>
        </div>

        {/* صف الفلترة + البحث */}
        <div className="container max-w-3xl pb-3 flex items-center gap-2">
          <button
            onClick={() => setShowFilter(f => !f)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 h-11 px-3 rounded-2xl text-xs font-black transition-colors',
              showFilter || activeCategories.length < CATEGORY_FILTERS.length
                ? 'bg-amber-400 text-slate-900'
                : 'bg-white/15 text-white'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            فلترة النتائج
          </button>
          <div className="relative flex-1 border-2 border-violet-400 rounded-2xl">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="اكتب كلمة للبحث..."
              className="w-full h-11 pr-10 pl-9 rounded-2xl bg-white text-sm text-right outline-none"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={handleSubmit} />
            {query && (
              <button onClick={() => { setQuery(''); setSubmittedQuery(''); }} className="absolute left-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* لوحة الفلترة بالأقسام */}
        {showFilter && (
          <div className="container max-w-3xl pb-3 flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleCategory(value)}
                className={cn(
                  'text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors',
                  activeCategories.includes(value) ? 'bg-amber-400 text-slate-900' : 'bg-white/15 text-white/80'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* صف الأدوات: الخط / ليلي / تطابق / بحث برقم المادة */}
        <div className="container max-w-3xl pb-4 grid grid-cols-4 gap-1">
          <button
            onClick={() => setShowFontPanel(p => !p)}
            className={cn('flex flex-col items-center gap-1 py-1.5 rounded-xl', showFontPanel ? 'bg-white/15' : '')}
          >
            <Type className="w-4 h-4 text-white" />
            <span className="text-[10px] font-bold text-white/90">الخط</span>
          </button>
          <button
            onClick={toggleNightMode}
            className={cn('flex flex-col items-center gap-1 py-1.5 rounded-xl', nightMode ? 'bg-white/15' : '')}
          >
            {nightMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
            <span className="text-[10px] font-bold text-white/90">ليلي</span>
          </button>
          <button
            onClick={() => setExactMatch(v => !v)}
            className={cn('flex flex-col items-center gap-1 py-1.5 rounded-xl', exactMatch ? 'bg-white/15' : '')}
          >
            <Equal className={cn('w-4 h-4', exactMatch ? 'text-amber-300' : 'text-white')} />
            <span className="text-[10px] font-bold text-white/90">تطابق</span>
          </button>
          <button
            onClick={() => setByNumber(v => !v)}
            className={cn('flex flex-col items-center gap-1 py-1.5 rounded-xl', byNumber ? 'bg-white/15' : '')}
          >
            <Hash className={cn('w-4 h-4', byNumber ? 'text-amber-300' : 'text-white')} />
            <span className="text-[10px] font-bold text-white/90 text-center leading-tight">بحث برقم المادة</span>
          </button>
        </div>

        {showFontPanel && (
          <div className="container max-w-3xl pb-4 flex items-center justify-center gap-4">
            <button onClick={decreaseFont} className="w-8 h-8 rounded-full bg-white/15 text-white font-black">-</button>
            <span className="text-xs font-bold text-white/90 w-10 text-center">{fontSize}px</span>
            <button onClick={increaseFont} className="w-8 h-8 rounded-full bg-white/15 text-white font-black">+</button>
          </div>
        )}
      </div>

      <div className={cn('container max-w-3xl py-5 space-y-4 pb-16', nightMode ? 'bg-slate-950 text-slate-100' : '')}>
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
            {articleStats.articleCount > 0 && (
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                تم العثور على {articleStats.wordCount} كلمة في {articleStats.articleCount} مادة ضمن {articleStats.lawCount} قانون
              </p>
            )}

            {articleStats.articleCount === 0 && docResults.length === 0 && ruleResults.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-10">لا توجد نتائج</p>
            )}

            {articleResults.length > 0 && (
              <section className="space-y-2.5">
                {articleResults.map((r) => (
                  <ArticleResultCard
                    key={`art-${r.document_id}-${r.content_idx}`}
                    result={r}
                    query={byNumber ? '' : submittedQuery}
                    fontSize={fontSize}
                    nightMode={nightMode}
                    copy={copy}
                    copiedKey={copiedId}
                  />
                ))}
              </section>
            )}

            {docResults.length > 0 && (
              <section className="space-y-2">
                <p className="text-xs font-black text-muted-foreground">عناوين مطابقة</p>
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
                <p className="text-xs font-black text-muted-foreground">القواعد القضائية ({ruleResults.length})</p>
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
