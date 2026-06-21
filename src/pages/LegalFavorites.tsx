/**
 * LegalFavorites.tsx
 * صفحة "المفضلة" المستقلة — تجمع كل عناصر المفضلة (مستندات / مواد / قواعد قضائية)
 * المحفوظة عبر أقسام المكتبة القانونية كاملةً، بصرف النظر عن القسم الحالي.
 * حالة الفراغ مطابقة للقطة الشاشة المرجعية: رسالة وسطية بسيطة بدون أي زخرفة إضافية.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, Star, Trash2, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_THEME, useResolvedLegalFavorites, useLegalAccessMode } from '@/hooks/useLegalLibrary';
import { saveReadingPosition } from '@/hooks/useReaderPreferences';
import { FeatureLockedModal } from '@/components/legal-library/LegalLimitedAccessModals';

export default function LegalFavorites() {
  const navigate = useNavigate();
  const { isLimitedMode } = useLegalAccessMode();
  const [showLockedModal, setShowLockedModal] = useState(isLimitedMode);
  const {
    isLoading, isEmpty, favoriteDocuments, favoriteRules, favoriteArticles, toggleFavorite,
  } = useResolvedLegalFavorites();

  // ── المفضلة محجوبة بالكامل في وضع الاستخدام المجاني المحدود ──
  if (isLimitedMode) {
    return (
      <MainLayout>
        <div className="bg-[#1a2744] sticky top-0 z-30">
          <div className="container max-w-3xl flex items-center gap-3 py-4">
            <button onClick={() => navigate(-1)} className="text-white p-1 -m-1" aria-label="رجوع">
              <ChevronRight className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black text-white">المفضلة</h1>
          </div>
        </div>
        <div className="bg-[#f5f5f5] dark:bg-background min-h-[calc(100vh-64px)]" />
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
          <button onClick={() => navigate(-1)} className="text-white p-1 -m-1" aria-label="رجوع">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-white">المفضلة</h1>
        </div>
      </div>

      <div className="bg-[#f5f5f5] dark:bg-background min-h-[calc(100vh-64px)]">
        {isLoading && (
          <div className="container max-w-3xl py-5 space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && isEmpty && (
          <div className="flex items-center justify-center py-32 px-6">
            <p className="text-center text-muted-foreground text-sm">
              لا توجد عناصر في المفضلة حالياً
            </p>
          </div>
        )}

        {!isLoading && !isEmpty && (
          <div className="container max-w-3xl py-5 space-y-6 pb-10">
            {favoriteDocuments.length > 0 && (
              <section className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-sm font-black text-foreground">
                  <Scale className="w-4 h-4 text-amber-500" /> القوانين واللوائح
                </p>
                {favoriteDocuments.map((doc) => {
                  const theme = CATEGORY_THEME[doc.category];
                  return (
                    <div
                      key={`doc-${doc.id}`}
                      className="flex items-center gap-3 bg-white dark:bg-card rounded-2xl border border-border px-3 py-3.5"
                    >
                      <button
                        onClick={() => toggleFavorite('document', String(doc.id))}
                        className="shrink-0 p-1 -m-1"
                        aria-label="إزالة من المفضلة"
                      >
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      </button>
                      <button
                        onClick={() => navigate(`/library/doc/${doc.id}`)}
                        className="flex-1 text-right flex items-center gap-2 min-w-0"
                      >
                        <span className="flex-1 text-sm font-bold text-foreground leading-snug line-clamp-2">
                          {doc.file_name}
                        </span>
                        <span className={cn('shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full', theme.circleColor)}>
                          {theme.label}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            {favoriteArticles.length > 0 && (
              <section className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-sm font-black text-foreground">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> المواد المفضّلة
                </p>
                {favoriteArticles.map((a) => {
                  const theme = CATEGORY_THEME[a.category];
                  return (
                    <div
                      key={`art-${a.ref}`}
                      className="bg-white dark:bg-card rounded-2xl border border-border p-3.5"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn('text-xs font-black', theme.articleNumColor)}>
                          مادة ({a.num}): {a.fileName}
                        </span>
                        <button onClick={() => toggleFavorite('article', a.ref)} aria-label="إزالة من المفضلة">
                          <Trash2 className="w-4 h-4 text-muted-foreground/50" />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          saveReadingPosition(a.docId, String(a.idx));
                          navigate(`/library/doc/${a.docId}`);
                        }}
                        className="text-right block w-full"
                      >
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.text}</p>
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            {favoriteRules.length > 0 && (
              <section className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-sm font-black text-foreground">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> القواعد القضائية
                </p>
                {favoriteRules.map((rule) => (
                  <div
                    key={`rule-${rule.id}`}
                    className="bg-white dark:bg-card rounded-2xl border border-border p-3.5"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                        القاعدة {rule.rule_number} — {rule.circuit}
                      </span>
                      <button onClick={() => toggleFavorite('rule', String(rule.id))} aria-label="إزالة من المفضلة">
                        <Trash2 className="w-4 h-4 text-muted-foreground/50" />
                      </button>
                    </div>
                    <button
                      onClick={() => navigate(`/library/judicial/${encodeURIComponent(rule.circuit)}`)}
                      className="text-right block w-full"
                    >
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{rule.subject}</p>
                    </button>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
