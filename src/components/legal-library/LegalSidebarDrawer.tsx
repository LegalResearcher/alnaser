/**
 * LegalSidebarDrawer.tsx — تصميم احترافي عالمي
 * المنطق محفوظ 100%
 */
import { useNavigate } from 'react-router-dom';
import {
  X, CreditCard, MessageSquareText, Grid3x3,
  Scale, Crown, ChevronLeft, Star,
} from 'lucide-react';
import { useIsPremiumUnlocked } from '@/hooks/useLegalLibrary';

const MENU_ITEMS = [
  {
    key: 'subscription',
    label: 'اشتراكي',
    icon: CreditCard,
    accent: '#c8a84b',
    bg: 'rgba(200,168,75,0.1)',
    route: '/library/subscription',
    type: 'nav' as const,
  },
  {
    key: 'contact',
    label: 'تواصل بنا',
    icon: MessageSquareText,
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    href: `https://t.me/MuenAlnaser?text=${encodeURIComponent('استفسار بخصوص المكتبة القانونية — منصة الناصر القانونية\nhttps://alnaseer.org')}`,
    type: 'link' as const,
  },
  {
    key: 'other-services',
    label: 'خدماتنا الأخرى',
    icon: Grid3x3,
    accent: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    route: '/library/other-services',
    type: 'nav' as const,
  },
];

export function LegalSidebarDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { isPremiumUnlocked } = useIsPremiumUnlocked();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998]" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* الدرج */}
      <div
        className="absolute top-0 left-0 h-full w-[82%] max-w-[300px] flex flex-col animate-in slide-in-from-left duration-250"
        style={{ background: '#f4f6f9' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ══ الهيدر ══ */}
        <div
          className="flex-shrink-0 pt-10 pb-6 px-5 relative"
          style={{ background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)' }}
        >
          {/* زر الإغلاق */}
          <button
            onClick={onClose}
            className="absolute top-5 left-4 flex items-center justify-center w-8 h-8 rounded-xl bg-white/8 border border-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* شعار + الاسم */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.3)' }}
            >
              <Scale className="w-6 h-6 text-[#c8a84b]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Al-Naser Platform</p>
              <p className="text-white font-black text-[15px] leading-tight">المكتبة القانونية</p>
            </div>
          </div>

          {/* badge حالة الاشتراك */}
          {isPremiumUnlocked ? (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <Crown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-black text-emerald-400">مشترك — وصول كامل</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.25)' }}
            >
              <Star className="w-3.5 h-3.5 text-[#c8a84b] fill-[#c8a84b]" />
              <span className="text-[11px] font-black text-[#c8a84b]">التجربة المجانية</span>
            </div>
          )}
        </div>

        {/* ══ القائمة ══ */}
        <div className="flex-1 px-4 pt-5 space-y-2.5">

          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-[#c8a84b]" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">القائمة الرئيسية</span>
          </div>

          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const inner = (
              <>
                {/* أيقونة */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: item.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.accent }} strokeWidth={1.75} />
                </div>

                {/* نص */}
                <span className="flex-1 text-[14px] font-bold text-gray-800">{item.label}</span>

                {/* سهم */}
                <ChevronLeft className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2.5} />
              </>
            );

            if (item.type === 'link') {
              return (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white rounded-2xl px-3 py-3 active:scale-[0.98] transition-transform text-right"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.05)' }}
                >
                  {inner}
                </a>
              );
            }

            return (
              <button
                key={item.key}
                onClick={() => { onClose(); navigate(item.route!); }}
                className="w-full flex items-center gap-3 bg-white rounded-2xl px-3 py-3 active:scale-[0.98] transition-transform text-right"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.05)' }}
              >
                {inner}
              </button>
            );
          })}
        </div>

        {/* ══ الذيل ══ */}
        <div
          className="flex-shrink-0 px-5 py-4 border-t border-gray-200 flex items-center justify-between"
        >
          <span className="text-[10px] text-gray-400 font-medium" dir="ltr">v1.0.0</span>
          <span className="text-[10px] text-gray-400">منصة الناصر القانونية</span>
        </div>
      </div>
    </div>
  );
}
