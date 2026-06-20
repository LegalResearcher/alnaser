/**
 * LegalDocumentViewer.tsx
 * عارض نص القانون/اللائحة/تعليمات النيابة (البند 4 — الأهم في المواصفة)
 * يقرأ من عمود content (JSONB) كاملاً ويعرض كل عنصر حسب type.
 * البحث الداخلي وبناء الفهرس يتمّان بالكامل على جانب العميل بعد الجلب مرة واحدة.
 */
import { useEffect, useMemo, useRef, useState, MutableRefObject } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  ChevronRight, Menu, Moon, Sun, Type, Search, X, Heart, Copy, Check, Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CATEGORY_THEME, LegalContentItem, useLegalDocument, useLegalFavorites,
} from '@/hooks/useLegalLibrary';
import { useReaderPreferences, saveReadingPosition, getReadingPosition } from '@/hooks/useReaderPreferences';

type Theme = typeof CATEGORY_THEME['law'];

function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch { /* ignore */ }
  };
  return { copy, copiedKey };
}

export default function LegalDocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const docId = id ? parseInt(id, 10) : null;

  const { data: document, isLoading } = useLegalDocument(docId);
  const { isFavorite, toggleFavorite } = useLegalFavorites();
  const { fontSize, increaseFont, decreaseFont, nightMode, toggleNightMode } = useReaderPreferences();
  const { copy, copiedKey } = useCopyToClipboard();

  const [showIndex, setShowIndex] = useState(false);
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchByNumber, setSearchByNumber] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);

  const articleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  const category = document?.category ?? 'law';
  const theme = CATEGORY_THEME[category];

  // ── بناء الفهرس من كل عناصر section (client-side) ──
  const indexItems = useMemo(() => {
    if (!document) return [];
    return document.content
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.type === 'section');
  }, [document]);

  // ── البحث الداخلي (client-side بالكامل فوق المصفوفة المجلوبة مسبقاً) ──
  const searchResults = useMemo(() => {
    if (!document || !searchQuery.trim()) return [];
    const q = searchQuery.trim();
    return document.content
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => {
        if (item.type !== 'article') return false;
        if (searchByNumber) {
          const num = item.num ?? '';
          return exactMatch ? num === q : num.includes(q);
        }
        const text = item.text ?? '';
        return exactMatch ? text === q : text.includes(q);
      });
  }, [document, searchQuery, searchByNumber, exactMatch]);

  // ── استرجاع موضع القراءة المحفوظ عند فتح المستند ──
  useEffect(() => {
    if (!docId || !document) return;
    const saved = getReadingPosition(docId);
    if (saved && articleRefs.current[saved]) {
      setTimeout(() => {
        articleRefs.current[saved]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [docId, document]);

  // ── مراقبة آخر مادة ظاهرة فعلياً في الشاشة وحفظ موضعها (IntersectionObserver حقيقي) ──
  useEffect(() => {
    if (!docId || !document) return;
    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const key = (topMost.target as HTMLElement).dataset.articleKey;
        if (key) saveReadingPosition(docId, key);
      },
      { threshold: 0.3 }
    );
    observerRef.current = observer;
    Object.values(articleRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [docId, document]);

  const scrollToIndex = (idx: number) => {
    setShowIndex(false);
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToArticle = (idx: number) => {
    setSearchOpen(false);
    const key = String(idx);
    articleRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-3xl py-10 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </MainLayout>
    );
  }

  if (!document) {
    return (
      <MainLayout>
        <div className="container max-w-3xl py-20 text-center text-muted-foreground">
          تعذّر العثور على هذا المستند
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={cn(nightMode ? 'bg-slate-950 text-slate-100' : 'bg-background', 'min-h-screen')}>
        {/* الهيدر */}
        <div className={cn(theme.headerBg, 'sticky top-0 z-30')}>
          <div className="container max-w-3xl flex items-center gap-3 py-3">
            <button onClick={() => navigate(-1)} className="text-white p-1.5 -m-1 shrink-0" aria-label="رجوع">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setShowFontPanel(p => !p)} className="text-white p-1.5 -m-1" aria-label="حجم الخط">
                <Type className="w-5 h-5" />
              </button>
              <button onClick={toggleNightMode} className="text-white p-1.5 -m-1" aria-label="الوضع الليلي">
                {nightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
            <h1 className="flex-1 text-center text-sm sm:text-base font-black text-white leading-snug line-clamp-2 px-1">
              {document.file_name}
            </h1>
            <button onClick={() => setShowIndex(true)} className="text-white p-1.5 -m-1 shrink-0" aria-label="الفهرس">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* شريط البحث الداخلي */}
          <div className="container max-w-3xl pb-3">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="ابحث داخل نصوص المواد..."
                className="w-full h-10 pr-9 pl-9 rounded-xl bg-white/95 text-sm text-right outline-none"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="absolute left-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-end gap-4 mt-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
                <input type="checkbox" checked={exactMatch} onChange={(e) => setExactMatch(e.target.checked)} className="accent-amber-400" />
                مطابق تام
              </label>
              <button
                onClick={() => setSearchByNumber(v => !v)}
                className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors',
                  searchByNumber ? 'bg-amber-400 text-slate-900' : 'bg-white/15 text-white/90')}
              >
                بحث بالرقم
              </button>
            </div>
          </div>
        </div>

        {/* لوحة حجم الخط */}
        {showFontPanel && (
          <div className="container max-w-3xl py-2">
            <div className="flex items-center justify-center gap-4 bg-card border border-border rounded-xl py-2">
              <button onClick={decreaseFont} className="w-8 h-8 rounded-full bg-muted font-black">-</button>
              <span className="text-xs font-bold text-muted-foreground w-10 text-center">{fontSize}px</span>
              <button onClick={increaseFont} className="w-8 h-8 rounded-full bg-muted font-black">+</button>
            </div>
          </div>
        )}

        {/* نتائج البحث */}
        {searchOpen && searchQuery.trim() && (
          <div className="container max-w-3xl py-3">
            <div className="bg-card border border-border rounded-2xl divide-y divide-border max-h-72 overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="p-4 text-sm text-center text-muted-foreground">لا توجد نتائج</p>
              ) : (
                searchResults.map(({ item, idx }) => (
                  <button
                    key={idx}
                    onClick={() => scrollToArticle(idx)}
                    className="w-full text-right p-3 hover:bg-muted/60 transition-colors"
                  >
                    <span className={cn('text-xs font-black', theme.articleNumColor)}>المادة ({item.num})</span>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.text}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* المحتوى */}
        <div className="container max-w-3xl py-6 space-y-4" style={{ fontSize: `${fontSize}px` }}>
          {document.content.map((item, idx) => (
            <ContentBlock
              key={idx}
              item={item}
              idx={idx}
              theme={theme}
              docId={document.id}
              articleRefs={articleRefs}
              sectionRefs={sectionRefs}
              isFavorite={isFavorite}
              toggleFavorite={toggleFavorite}
              copy={copy}
              copiedKey={copiedKey}
              nightMode={nightMode}
            />
          ))}
        </div>
      </div>

      {/* الفهرس (Drawer) */}
      {showIndex && (
        <div className="fixed inset-0 z-[9997]" onClick={() => setShowIndex(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute top-0 left-0 h-full w-[85%] max-w-sm bg-background shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn(theme.headerBg, 'p-4 flex items-center justify-between')}>
              <h3 className="text-white font-black text-sm">الفهرس</h3>
              <button onClick={() => setShowIndex(false)} className="text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {indexItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">لا توجد أقسام في هذا المستند</p>
              ) : (
                indexItems.map(({ item, idx }) => (
                  <button
                    key={idx}
                    onClick={() => scrollToIndex(idx)}
                    className="w-full text-right p-3 rounded-xl hover:bg-muted text-sm font-bold text-foreground"
                  >
                    {item.level ? `${item.level} — ` : ''}{item.title}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// عرض عنصر واحد من content حسب نوعه
// ─────────────────────────────────────────────────────────────
function ContentBlock({
  item, idx, theme, docId, articleRefs, sectionRefs, isFavorite, toggleFavorite, copy, copiedKey, nightMode,
}: {
  item: LegalContentItem; idx: number;
  theme: Theme;
  docId: number;
  articleRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  sectionRefs: MutableRefObject<Record<number, HTMLDivElement | null>>;
  isFavorite: (t: 'article', ref: string) => boolean;
  toggleFavorite: (t: 'article', ref: string) => void;
  copy: (text: string, key: string) => void;
  copiedKey: string | null;
  nightMode: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const LONG_TEXT_THRESHOLD = 600;

  switch (item.type) {
    case 'preamble':
      return (
        <div className={cn('rounded-2xl border p-6 text-center', nightMode ? 'bg-slate-900 border-slate-800' : 'bg-card border-border')}>
          <Landmark className="w-7 h-7 mx-auto mb-3 text-amber-500/70" />
          <div className="h-px w-12 mx-auto bg-amber-400/40 mb-4" />
          <p className="leading-loose whitespace-pre-line">{item.text}</p>
        </div>
      );

    case 'section':
      return (
        <div
          ref={(el) => { sectionRefs.current[idx] = el; }}
          className="rounded-2xl bg-slate-900 dark:bg-black py-4 px-5 text-center"
        >
          <p className="text-white font-black leading-snug">
            {item.level ? <span className="block text-amber-400 text-xs mb-1">{item.level}</span> : null}
            {item.title}
          </p>
        </div>
      );

    case 'side_title':
      return (
        <p className="text-sm font-bold text-amber-700 dark:text-amber-400 px-1">{item.text}</p>
      );

    case 'article': {
      const key = String(idx);
      const articleRef = `${docId}:${idx}`;
      const fav = isFavorite('article', articleRef);
      const text = item.text ?? '';
      const isLong = text.length > LONG_TEXT_THRESHOLD;
      const displayText = isLong && !expanded ? text.slice(0, LONG_TEXT_THRESHOLD) + '…' : text;

      return (
        <div
          ref={(el) => { articleRefs.current[key] = el; }}
          data-article-key={key}
          className={cn('rounded-2xl border p-5', nightMode ? 'bg-slate-900 border-slate-800' : 'bg-card border-border')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => toggleFavorite('article', articleRef)} aria-label="مفضلة">
                <Heart className={cn('w-4 h-4', fav ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground/50')} />
              </button>
              <button onClick={() => copy(text, key)} aria-label="نسخ">
                {copiedKey === key ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground/50" />}
              </button>
            </div>
            <span className={cn('font-black text-base', theme.articleNumColor)}>المادة ({item.num})</span>
          </div>
          <p className="leading-loose whitespace-pre-line">{displayText}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(e => !e)}
              className={cn('mt-2 text-xs font-black', theme.articleNumColor)}
            >
              {expanded ? 'عرض أقل' : 'عرض المزيد'}
            </button>
          )}
        </div>
      );
    }

    case 'conclusion':
      return (
        <p className="text-center italic text-muted-foreground leading-loose pt-6 pb-2 whitespace-pre-line">
          {item.text}
        </p>
      );

    default:
      return null;
  }
}
