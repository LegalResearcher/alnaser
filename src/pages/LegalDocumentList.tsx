/**
 * LegalDocumentList.tsx
 * قائمة القوانين/اللوائح/تعليمات النيابة (البند 3 و7 و8 من المواصفة — مكوّن موحّد بتغيير الثيم فقط)
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, Search, Star, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CATEGORY_THEME, LegalCategory, useLegalDocumentsList, useLegalFavorites, useIsPremiumUnlocked,
} from '@/hooks/useLegalLibrary';
import {
  LibraryPasswordModal, LibrarySubscriptionModal,
} from '@/components/shared/LibrarySubscriptionModals';
import { LegalAboutModal } from '@/components/legal-library/LegalAboutModal';

const VALID_CATEGORIES: LegalCategory[] = ['law', 'regulation', 'prosecution_instruction'];

function DocRow({
  rank, name, isFavorite, circleClass, locked, onClick, onToggleFavorite,
}: {
  rank: number; name: string; isFavorite: boolean; circleClass: string;
  locked: boolean; onClick: () => void; onToggleFavorite: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-card rounded-2xl border border-border px-3 py-3.5">
      <button
        onClick={onToggleFavorite}
        className="shrink-0 p-1 -m-1"
        aria-label="مفضلة"
      >
        <Star className={cn('w-5 h-5', isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
      </button>
      <button onClick={onClick} className="flex-1 text-right flex items-center gap-3 min-w-0">
        <span className="flex-1 text-sm font-bold text-foreground leading-snug line-clamp-2">
          {name}{locked && <span className="mr-1.5 text-[10px] text-amber-600">🔒</span>}
        </span>
        <span className={cn('shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black', circleClass)}>
          {rank}
        </span>
      </button>
    </div>
  );
}

export default function LegalDocumentList() {
  const params = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [pendingDoc, setPendingDoc] = useState<{ id: number; file_name: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const { isPremiumUnlocked, setIsPremiumUnlocked } = useIsPremiumUnlocked();
  const { isFavorite, toggleFavorite } = useLegalFavorites();

  // يحدَّد القسم من الراوت: /library/laws | /library/regulations | /library/prosecutions
  const segment = params.category as string;
  const category: LegalCategory =
    segment === 'regulations' ? 'regulation' :
    segment === 'prosecutions' ? 'prosecution_instruction' : 'law';

  const theme = CATEGORY_THEME[category];
  const { data: documents = [], isLoading } = useLegalDocumentsList(category);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return documents;
    return documents.filter(d => d.file_name.includes(q));
  }, [documents, search]);

  const featured = useMemo(() => filtered.filter(d => d.is_featured), [filtered]);
  const all = filtered;

  const handleOpen = (doc: { id: number; file_name: string; is_premium: boolean }) => {
    if (doc.is_premium && !isPremiumUnlocked) {
      setPendingDoc({ id: doc.id, file_name: doc.file_name });
      setShowPasswordModal(true);
      return;
    }
    navigate(`/library/doc/${doc.id}`);
  };

  return (
    <MainLayout>
      <div className={cn(theme.headerBg, 'sticky top-0 z-30')}>
        <div className="container max-w-5xl flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-white p-1 -m-1">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-white tracking-wide">{theme.label}</h1>
        </div>
      </div>

      <div className="container max-w-5xl py-4 pb-24 space-y-5">
        {/* شريط البحث */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`ابحث عن ${category === 'law' ? 'القانون' : category === 'regulation' ? 'اللائحة' : 'التعليمات'}...`}
            className="w-full h-11 pr-10 pl-4 rounded-2xl border border-border bg-white dark:bg-card text-sm text-right outline-none focus:border-primary/50"
          />
        </div>

        {isLoading && (
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && featured.length > 0 && (
          <section className="space-y-2.5">
            <p className="flex items-center gap-1.5 text-sm font-black text-foreground">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> أهم {theme.label === 'القوانين اليمنية' ? 'القوانين المستخدمة' : 'العناصر المستخدمة'}
            </p>
            {featured.map((doc, idx) => (
              <DocRow
                key={doc.id}
                rank={idx + 1}
                name={doc.file_name}
                isFavorite={isFavorite('document', String(doc.id))}
                circleClass={theme.circleColor}
                locked={doc.is_premium && !isPremiumUnlocked}
                onClick={() => handleOpen(doc)}
                onToggleFavorite={() => toggleFavorite('document', String(doc.id))}
              />
            ))}
          </section>
        )}

        {!isLoading && (
          <section className="space-y-2.5">
            <p className="text-sm font-black text-muted-foreground">
              كافة {category === 'law' ? 'القوانين' : category === 'regulation' ? 'اللوائح' : 'التعليمات'}
            </p>
            {all.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                لا توجد نتائج مطابقة
              </div>
            ) : (
              all.map((doc, idx) => (
                <DocRow
                  key={doc.id}
                  rank={idx + 1}
                  name={doc.file_name}
                  isFavorite={isFavorite('document', String(doc.id))}
                  circleClass="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  locked={doc.is_premium && !isPremiumUnlocked}
                  onClick={() => handleOpen(doc)}
                  onToggleFavorite={() => toggleFavorite('document', String(doc.id))}
                />
              ))
            )}
          </section>
        )}
      </div>

      {/* شريط التنقل السفلي */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-card border-t border-border">
        <div className="container max-w-5xl grid grid-cols-3">
          <button
            onClick={() => navigate('/library/favorites')}
            className="flex flex-col items-center gap-0.5 py-2.5 text-amber-500"
          >
            <Star className="w-5 h-5" />
            <span className="text-[10px] font-bold">المفضلة</span>
          </button>
          <button
            onClick={() => setShowAboutModal(true)}
            className="flex flex-col items-center gap-0.5 py-2.5 text-muted-foreground"
          >
            <Info className="w-5 h-5" />
            <span className="text-[10px] font-bold">حول</span>
          </button>
          <button
            onClick={() => navigate('/library/search')}
            className="flex flex-col items-center gap-0.5 py-2.5 text-muted-foreground"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold">بحث شامل</span>
          </button>
        </div>
      </div>

      <LegalAboutModal
        open={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        sectionLabel={theme.label}
      />

      {showPasswordModal && (
        <LibraryPasswordModal
          onSuccess={() => {
            setIsPremiumUnlocked(true);
            setShowPasswordModal(false);
            if (pendingDoc) navigate(`/library/doc/${pendingDoc.id}`);
          }}
          onSubscribe={() => { setShowPasswordModal(false); setShowSubscriptionModal(true); }}
          onClose={() => { setShowPasswordModal(false); setPendingDoc(null); }}
        />
      )}
      {showSubscriptionModal && pendingDoc && (
        <LibrarySubscriptionModal
          fileName={pendingDoc.file_name}
          onClose={() => { setShowSubscriptionModal(false); setPendingDoc(null); }}
        />
      )}
    </MainLayout>
  );
}
