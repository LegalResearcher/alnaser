/**
 * LegalSidebarDrawer.tsx
 * القائمة الجانبية لقسم المكتبة القانونية فقط (البند 8 من المواصفة)
 */
import { useNavigate } from 'react-router-dom';
import { X, CreditCard, MessageSquareText, Grid3x3, BookOpen } from 'lucide-react';
import { useIsPremiumUnlocked } from '@/hooks/useLegalLibrary';

export function LegalSidebarDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { isPremiumUnlocked } = useIsPremiumUnlocked();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="absolute top-0 left-0 h-full w-[85%] max-w-xs bg-background shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس الدرج */}
        <div className="bg-gradient-to-br from-[#1a2744] to-[#243759] p-5 pb-6 relative">
          <button onClick={onClose} className="absolute top-4 left-4 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-black text-base">المكتبة القانونية</p>
              {isPremiumUnlocked ? (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  مشترك
                </span>
              ) : (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  التجربة المجانية
                </span>
              )}
            </div>
          </div>
        </div>

        {/* العناصر */}
        <div className="flex-1 p-4 space-y-1">
          <button
            onClick={() => { onClose(); navigate('/library/subscription'); }}
            className="w-full flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-muted transition-colors text-right"
          >
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold text-foreground">اشتراكي</span>
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent('استفسار بخصوص المكتبة القانونية — منصة الناصر القانونية\nhttps://alnaseer.org')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-muted transition-colors text-right"
          >
            <MessageSquareText className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold text-foreground">تواصل بنا</span>
          </a>
          <button
            onClick={() => { onClose(); navigate('/library/other-services'); }}
            className="w-full flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-muted transition-colors text-right"
          >
            <Grid3x3 className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold text-foreground">خدماتنا الأخرى</span>
          </button>
        </div>

        <div className="p-4 border-t border-border text-center">
          <p className="text-[11px] text-muted-foreground">الإصدار: 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
