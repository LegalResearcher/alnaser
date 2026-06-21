/**
 * LegalDocumentViewer.tsx
 * عارض نص القانون/اللائحة/تعليمات النيابة (البند 4 — الأهم في المواصفة)
 * يقرأ من عمود content (JSONB) ويعرض كل عنصر حسب type.
 * البحث الداخلي وبناء الفهرس يتمّان بالكامل على جانب العميل بعد الجلب مرة واحدة.
 *
 * ⚠️ إصلاح أمني (راجع useLegalLibrary.ts): الجلب أصبح على خطوتين — بيانات
 * خفيفة (meta) أولاً لمعرفة is_premium، ثم لا يُطلب نص content الكامل من
 * الخادم إطلاقاً إلا إن كان المستند غير مدفوع أو كان المستخدم متحقَّقاً منه
 * فعلاً. بهذا لا يعود فتح الرابط مباشرة /library/doc/123 يكشف نص أي قانون
 * مدفوع — قبل هذا الإصلاح كان content يُجلب بالكامل بصرف النظر عن is_premium.
 */
import { useEffect, useMemo, useRef, useState, MutableRefObject } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  ChevronRight, Moon, Sun, Type, Search, X, Heart, Copy, Check, Landmark, Lock, LayoutList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CATEGORY_THEME, LegalContentItem, useLegalDocumentMeta, useLegalDocumentContent,
  useLegalFavorites, useIsPremiumUnlocked,
} from '@/hooks/useLegalLibrary';
import { useReaderPreferences, saveReadingPosition, getReadingPosition } from '@/hooks/useReaderPreferences';
import {
  LibraryPasswordModal, LibrarySubscriptionModal,
} from '@/components/shared/LibrarySubscriptionModals';

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

  const { data: meta, isLoading: metaLoading } = useLegalDocumentMeta(docId);
  const { isPremiumUnlocked, setIsPremiumUnlocked } = useIsPremiumUnlocked();

  // مدفوع ولم يتحقق المستخدم بعد؟ — إن كان كذلك لا نطلب content من الخادم إطلاقاً
  const isLocked = !!meta?.is_premium && !isPremiumUnlocked;

  const { data: contentData, isLoading: contentLoading } = useLegalDocumentContent(docId, !isLocked);

  // مستند مُجمَّع للاستخدام في باقي الصفحة — content فاضي طالما محجوب (لم يُطلب أصلاً)
  const document = meta ? { ...meta, content: (isLocked ? [] : contentData) ?? [] } : null;
  const isLoading = metaLoading || (!isLocked && contentLoading);

  const { isFavorite, toggleFavorite } = useLegalFavorites();
  const { fontSize, increaseFont, decreaseFont, nightMode, toggleNightMode } = useReaderPreferences();
  const { copy, copiedKey } = useCopyToClipboard();

  const [showIndex, setShowIndex] = useState(false);
  const [indexTab, setIndexTab] = useState<'subjects' | 'numbers'>('subjects');
  const [indexSearch, setIndexSearch] = useState('');
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchByNumber, setSearchByNumber] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const articleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  const category = document?.category ?? 'law';
  const theme = CATEGORY_THEME[category];

  // ── بناء الفهرس من كل عناصر section (client-side) ──
  const sectionItems = useMemo(() => {
    if (!document) return [];
    return document.content
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.type === 'section');
  }, [document]);

  // ── بناء فهرس أرقام المواد (client-side) ──
  const articleIndexItems = useMemo(() => {
    if (!document) return [];
    return document.content
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.type === 'article');
  }, [document]);

  const indexItems = useMemo(() => {
    const q = indexSearch.trim();
    if (indexTab === 'numbers') {
      if (!q) return articleIndexItems;
      return articleIndexItems.filter(({ item }) => (item.num ?? '').includes(q));
    }
    if (!q) return sectionItems;
    return sectionItems.filter(({ item }) => (item.title ?? '').includes(q));
  }, [indexTab, indexSearch, sectionItems, articleIndexItems]);

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
    if (!docId || !document || isLocked) return;
    const saved = getReadingPosition(docId);
    if (saved && articleRefs.current[saved]) {
      setTimeout(() => {
        articleRefs.current[saved]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [docId, document, isLocked]);

  // ── مراقبة آخر مادة ظاهرة فعلياً في الشاشة وحفظ موضعها (IntersectionObserver حقيقي) ──
  useEffect(() => {
    if (!docId || !document || isLocked) return;
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
  }, [docId, document, isLocked]);

  const scrollToIndex = (idx: number) => {
    setShowIndex(false);
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const jumpToArticleFromIndex = (idx: number) => {
    setShowIndex(false);
    const key = String(idx);
    setTimeout(() => {
      articleRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
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

  const categoryLabel = category === 'law' ? 'قانون' : category === 'regulation' ? 'لائحة' : 'تعليمة';

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
          </div>

          {/* شريط البحث الداخلي — مخفي بالكامل طالما المستند محجوباً (لا content لنبحث فيه أصلاً) */}
          {!isLocked && (
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
                <button
                  onClick={() => setShowIndex(true)}
                  className="flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-white/90 text-foreground shrink-0"
                  aria-label="الفهرس"
                >
                  الفهرس
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
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

        {isLocked ? (
          /* ── حالة الحجب: لا يُعرض أي جزء من النص لأنه أصلاً لم يُطلب من الخادم ── */
          <div className="container max-w-3xl py-10">
            <div className={cn('rounded-2xl border p-8 text-center', nightMode ? 'bg-slate-900 border-slate-800' : 'bg-card border-border')}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="font-black text-base mb-2">هذا {categoryLabel} مدفوع</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                أدخل كلمة المرور أو فعّل الاشتراك للوصول إلى النص الكامل لـ«{document.file_name}».
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className={cn('h-11 rounded-2xl font-black text-sm text-white', theme.headerBg)}
                >
                  إدخال كلمة المرور
                </button>
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="h-11 rounded-2xl font-black text-sm border border-border text-foreground"
                >
                  الاشتراك المدفوع
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* الفهرس (Bottom Sheet) — تبويب المواضيع والفصول وتبويب أرقام المواد */}
      {showIndex && !isLocked && (
        <div className="fixed inset-0 z-[9998]" onClick={() => setShowIndex(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 inset-x-0 max-h-[85vh] bg-background rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2.5 pb-1.5">
              <span className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={indexSearch}
                  onChange={(e) => setIndexSearch(e.target.value)}
                  placeholder="ابحث في الفهرس أو رقم المادة..."
                  className="w-full h-11 pr-9 pl-9 rounded-xl border border-border bg-card text-sm text-right outline-none"
                  autoFocus
                />
                {indexSearch && (
                  <button onClick={() => setIndexSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-6 mt-3 border-b border-border">
                <button
                  onClick={() => setIndexTab('numbers')}
                  className={cn('pb-2.5 text-sm font-black transition-colors',
                    indexTab === 'numbers' ? cn(theme.articleNumColor, 'border-b-2', theme.accentBorder) : 'text-muted-foreground')}
                >
                  أرقام المواد
                </button>
                <button
                  onClick={() => setIndexTab('subjects')}
                  className={cn('pb-2.5 text-sm font-black transition-colors',
                    indexTab === 'subjects' ? cn(theme.articleNumColor, 'border-b-2', theme.accentBorder) : 'text-muted-foreground')}
                >
                  المواضيع والفصول
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {indexItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">لا توجد نتائج</p>
              ) : indexTab === 'subjects' ? (
                <div className="space-y-2.5">
                  {indexItems.map(({ item, idx }) => (
                    <button
                      key={idx}
                      onClick={() => scrollToIndex(idx)}
                      className="w-full text-right p-3.5 rounded-xl border border-border bg-card text-sm font-bold text-foreground"
                    >
                      {item.level ? `${item.level} — ` : ''}{item.title}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {indexItems.map(({ item, idx }) => (
                    <button
                      key={idx}
                      onClick={() => jumpToArticleFromIndex(idx)}
                      className={cn('rounded-xl border py-3 text-center', theme.accentBorder, theme.accentBg)}
                    >
                      <span className={cn('text-xs font-black', theme.articleNumColor)}>المادة ({item.num})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <LibraryPasswordModal
          onSuccess={() => { setIsPremiumUnlocked(true); setShowPasswordModal(false); }}
          onSubscribe={() => { setShowPasswordModal(false); setShowSubscriptionModal(true); }}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
      {showSubscriptionModal && (
        <LibrarySubscriptionModal
          fileName={document.file_name}
          onClose={() => setShowSubscriptionModal(false)}
        />
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
            <span className={cn('font-black text-base', theme.articleNumColor)}>المادة ({item.num})</span>
            <div className="flex items-center gap-3">
              <button onClick={() => copy(text, key)} aria-label="نسخ">
                {copiedKey === key ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground/50" />}
              </button>
              <button onClick={() => toggleFavorite('article', articleRef)} aria-label="مفضلة">
                <Heart className={cn('w-4 h-4', fav ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground/50')} />
              </button>
            </div>
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
