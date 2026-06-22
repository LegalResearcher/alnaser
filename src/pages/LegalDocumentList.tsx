/**
 * LegalDocumentList.tsx — تصميم احترافي عالمي
 * laws + regulations + prosecutions — مكوّن موحّد
 * المنطق محفوظ 100%
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, ChevronLeft, Search, Star, Info, Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CATEGORY_THEME, LegalCategory, useLegalDocumentsList, useLegalFavorites, useIsPremiumUnlocked,
  useLegalAccessMode,
} from '@/hooks/useLegalLibrary';
import { LibraryPasswordModal, LibrarySubscriptionModal } from '@/components/shared/LibrarySubscriptionModals';
import { LegalAboutModal } from '@/components/legal-library/LegalAboutModal';
import { FeatureLockedModal } from '@/components/legal-library/LegalLimitedAccessModals';

const VALID_CATEGORIES: LegalCategory[] = ['law', 'regulation', 'prosecution_instruction'];

/* ─── ثيمات الأقسام ─── */
const SECTION_THEME: Record<LegalCategory, { accent: string; label: string; sublabel: string }> = {
  law:                    { accent: '#1b6ca8', label: 'القوانين اليمنية',    sublabel: 'بآخر التعديلات الرسمية' },
  regulation:             { accent: '#b45309', label: 'اللوائح والأنظمة',    sublabel: 'اللوائح التنفيذية والتشريعية' },
  prosecution_instruction:{ accent: '#0d7a5c', label: 'تعليمات النيابة',     sublabel: 'الملفات والإجراءات الجزائية' },
};

/* ─── صف الوثيقة ─── */
function DocRow({
  rank, name, isFavorite, accent, locked, onClick, onToggleFavorite,
}: {
  rank: number; name: string; isFavorite: boolean; accent: string;
  locked: boolean; onClick: () => void; onToggleFavorite: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 bg-white rounded-2xl px-3 py-3.5 active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.05)' }}
    >
      {/* زر المفضلة */}
      <button onClick={onToggleFavorite} className="shrink-0 p-1 -m-1" aria-label="مفضلة">
        <Star className={cn('w-5 h-5 transition-colors', isFavorite ? 'fill-[#c8a84b] text-[#c8a84b]' : 'text-gray-200')} />
      </button>

      {/* اسم الوثيقة */}
      <button onClick={onClick} className="flex-1 text-right flex items-center gap-3 min-w-0">
        <span className="flex-1 text-[13px] font-bold text-gray-800 leading-snug line-clamp-2">
          {name}
          {locked && <Lock className="inline-block mr-1.5 w-3 h-3 text-amber-500 align-middle" />}
        </span>
        {/* رقم الترتيب */}
        <span
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white"
          style={{ background: accent }}
        >
          {rank}
        </span>
      </button>
    </div>
  );
}

/* ─── Skeleton ─── */
function DocSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-3 py-3.5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="w-5 h-5 rounded-full bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
      <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse shrink-0" />
    </div>
  );
}

export default function LegalDocumentList() {
  const params = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [pendingDoc, setPendingDoc] = useState<{ id: number; file_name: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFeatureLockedModal, setShowFeatureLockedModal] = useState(false);

  const { isPremiumUnlocked, setIsPremiumUnlocked } = useIsPremiumUnlocked();
  const { isFavorite, toggleFavorite } = useLegalFavorites();
  const { isLimitedMode } = useLegalAccessMode();

  const segment = params.category as string;
  const category: LegalCategory =
    segment === 'regulations' ? 'regulation' :
    segment === 'prosecutions' ? 'prosecution_instruction' : 'law';

  const theme = CATEGORY_THEME[category];
  const sectionTheme = SECTION_THEME[category];
  const { data: documents = [], isLoading } = useLegalDocumentsList(category);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return documents;
    return documents.filter(d => d.file_name.includes(q));
  }, [documents, search]);

  const featured = useMemo(() => filtered.filter(d => d.is_featured), [filtered]);

  const handleOpen = (doc: { id: number; file_name: string; is_premium: boolean }) => {
    if (doc.is_premium && !isPremiumUnlocked && !isLimitedMode) {
      setPendingDoc({ id: doc.id, file_name: doc.file_name });
      setShowPasswordModal(true);
      return;
    }
    navigate(`/library/doc/${doc.id}`);
  };

  const guardedToggleFavorite = (docId: number) => {
    if (isLimitedMode) { setShowFeatureLockedModal(true); return; }
    toggleFavorite('document', String(docId));
  };

  return (
    <MainLayout>

      {/* ══════════ HERO HEADER ══════════ */}
      <div
        className="sticky top-0 z-30 pt-5 pb-5 px-5"
        style={{ background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/8 border border-white/10 text-white flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Legal Library</p>
            <h1 className="text-[17px] font-black text-white leading-tight">{sectionTheme.label}</h1>
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${sectionTheme.accent}25`, color: sectionTheme.accent === '#1b6ca8' ? '#90c4f0' : sectionTheme.accent === '#b45309' ? '#f6c07a' : '#5ecfac' }}
          >
            {sectionTheme.sublabel}
          </span>
        </div>

        {/* شريط البحث */}
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              if (isLimitedMode) { setShowFeatureLockedModal(true); return; }
              setSearch(e.target.value);
            }}
            onFocus={() => {
              if (isLimitedMode) { setShowFeatureLockedModal(true); return; }
              setSearchFocused(true);
            }}
            onBlur={() => setSearchFocused(false)}
            placeholder={`ابحث في ${sectionTheme.label}...`}
            className="w-full h-11 pr-10 pl-10 rounded-xl text-[13px] text-right outline-none text-gray-800 placeholder-gray-400"
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: searchFocused ? `1.5px solid ${sectionTheme.accent}` : '1.5px solid transparent',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* ══════════ المحتوى ══════════ */}
      <div className="bg-[#f4f6f9] min-h-[calc(100vh-160px)] pb-24 px-4 pt-4">

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2.5">
            {Array.from({ length: 7 }).map((_, i) => <DocSkeleton key={i} />)}
          </div>
        )}

        {/* المميزة */}
        {!isLoading && featured.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ background: '#c8a84b' }} />
              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">الأكثر استخداماً</span>
              <Star className="w-3.5 h-3.5 text-[#c8a84b] fill-[#c8a84b]" />
            </div>
            <div className="space-y-2.5">
              {featured.map((doc, idx) => (
                <DocRow
                  key={doc.id}
                  rank={idx + 1}
                  name={doc.file_name}
                  isFavorite={isFavorite('document', String(doc.id))}
                  accent={sectionTheme.accent}
                  locked={doc.is_premium && !isPremiumUnlocked}
                  onClick={() => handleOpen(doc)}
                  onToggleFavorite={() => guardedToggleFavorite(doc.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* الكل */}
        {!isLoading && (
          <section>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                جميع {category === 'law' ? 'القوانين' : category === 'regulation' ? 'اللوائح' : 'التعليمات'}
              </span>
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] text-gray-400 font-medium">{filtered.length}</span>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">لا توجد نتائج مطابقة</div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((doc, idx) => (
                  <DocRow
                    key={doc.id}
                    rank={idx + 1}
                    name={doc.file_name}
                    isFavorite={isFavorite('document', String(doc.id))}
                    accent="#9ca3af"
                    locked={doc.is_premium && !isPremiumUnlocked}
                    onClick={() => handleOpen(doc)}
                    onToggleFavorite={() => guardedToggleFavorite(doc.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ══════════ شريط التنقل السفلي ══════════ */}
      <div
        className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
      >
        <div className="container max-w-5xl grid grid-cols-3">
          <button
            onClick={() => { if (isLimitedMode) { setShowFeatureLockedModal(true); return; } navigate('/library/favorites'); }}
            className="flex flex-col items-center gap-0.5 py-3 text-[#c8a84b]"
          >
            <Star className="w-5 h-5" />
            <span className="text-[10px] font-bold">المفضلة</span>
          </button>
          <button
            onClick={() => setShowAboutModal(true)}
            className="flex flex-col items-center gap-0.5 py-3 text-gray-400"
          >
            <Info className="w-5 h-5" />
            <span className="text-[10px] font-bold">حول</span>
          </button>
          <button
            onClick={() => { if (isLimitedMode) { setShowFeatureLockedModal(true); return; } navigate('/library/search'); }}
            className="flex flex-col items-center gap-0.5 py-3 text-gray-400"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold">بحث شامل</span>
          </button>
        </div>
      </div>

      <LegalAboutModal open={showAboutModal} onClose={() => setShowAboutModal(false)} sectionLabel={theme.label} />

      {showPasswordModal && (
        <LibraryPasswordModal
          onSuccess={() => { setIsPremiumUnlocked(true); setShowPasswordModal(false); if (pendingDoc) navigate(`/library/doc/${pendingDoc.id}`); }}
          onSubscribe={() => { setShowPasswordModal(false); setShowSubscriptionModal(true); }}
          onClose={() => { setShowPasswordModal(false); setPendingDoc(null); }}
        />
      )}
      {showSubscriptionModal && pendingDoc && (
        <LibrarySubscriptionModal fileName={pendingDoc.file_name} onClose={() => { setShowSubscriptionModal(false); setPendingDoc(null); }} />
      )}
      {showFeatureLockedModal && <FeatureLockedModal onClose={() => setShowFeatureLockedModal(false)} />}
    </MainLayout>
  );
}
