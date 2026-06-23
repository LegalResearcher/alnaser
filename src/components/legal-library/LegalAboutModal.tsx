/**
 * LegalAboutModal.tsx — تصميم احترافي عالمي
 * نافذة "عن المكتبة القانونية" بمحتوى موسّع وتصميم راقٍ
 */
import { X } from 'lucide-react';

interface LegalAboutModalProps {
  open: boolean;
  onClose: () => void;
  sectionLabel?: string;
}

export function LegalAboutModal({ open, onClose }: LegalAboutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* الـ Sheet من الأسفل */}
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        style={{ background: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ══ هيدر داكن ══ */}
        <div
          className="flex-shrink-0 px-5 pt-6 pb-5 relative"
          style={{
            background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)',
          }}
        >
          {/* زر الإغلاق */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 border border-white/15 text-white/70 active:text-white transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          {/* العنوان */}
          <div className="text-center">
            <p className="text-2xl mb-1">ℹ️</p>
            <h2 className="text-[17px] font-black text-white leading-tight">
              عن المكتبة القانونية
            </h2>
            <p className="text-[11px] text-gray-400 mt-1 tracking-widest uppercase">
              Al-Naser Legal Library
            </p>
          </div>

          {/* بادج */}
          <div className="flex justify-center mt-3">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
              style={{
                background: 'rgba(200,168,75,0.15)',
                border: '1px solid rgba(200,168,75,0.3)',
                color: '#c8a84b',
              }}
            >
              منصة الناصر القانونية © 2026
            </div>
          </div>
        </div>

        {/* ══ المحتوى القابل للتمرير ══ */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#f8f9fc' }}>

          {/* ── المقدمة ── */}
          <div className="mx-4 mt-4 mb-3 rounded-2xl bg-white p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="text-[13px] leading-[1.9] text-gray-700 text-right">
              يضم هذا القسم بنية تشريعية وقضائية متكاملة تمنحك وصولاً فورياً إلى أكثر من{' '}
              <span className="font-black text-[#c8a84b]">272 قانوناً ووثيقة رسمية</span>{' '}
              خاضعة لآخر التعديلات التشريعية، بالإضافة إلى{' '}
              <span className="font-black text-[#c8a84b]">1997 قاعدة قضائية</span>{' '}
              مستنبطة من أحكام ومبادئ المحكمة العليا.
            </p>
            <p className="text-[13px] leading-[1.9] text-gray-700 text-right mt-2">
              تتميز المنصة بـ <span className="font-bold text-gray-900">"فهرس أحكام المحكمة العليا"</span> المصنّف
              تفاعلياً ليشمل كافة الدوائر القضائية التخصصية:{' '}
              <span className="text-[#0ea5e9] font-semibold">
                الإدارية، المدنية، التجارية، الجزائية، الشخصية، العسكرية، ودائرة فحص الطعون
              </span>.
            </p>
          </div>

          {/* ── إحصائيات ── */}
          <SectionBlock emoji="📊" title="إحصائيات وحقائق قانونية" subtitle="منذ عام 1990م وحتى اليوم">
            <div className="space-y-2.5 mt-1">
              <StatRow
                color="#ef4444"
                label="إلغاء وإحلال"
                text="تم إلغاء أكثر من 10 قوانين بالكامل واستبدالها بتشريعات حديثة مواكبة للمستجدات."
              />
              <StatRow
                color="#f59e0b"
                label="تعديلات هيكلية"
                text="خضع أكثر من 50 قانوناً لتعديلات جوهرية."
              />
              <StatRow
                color="#6366f1"
                label="تحديثات نصية"
                text="شملت عمليات الحذف، الإضافة، أو التعديل أكثر من 1000 مادة قانونية."
              />
            </div>
          </SectionBlock>

          {/* ── اتخذ قرارك ── */}
          <SectionBlock emoji="⚖️" title="اتخذ قرارك بناءً على التجربة">
            <p className="text-[13px] leading-[1.9] text-gray-600 text-right">
              القرارات القانونية الرشيدة تُبنى على البرهان لا على الوعود. ندعوكم لخوض تجربة عملية
              متكاملة للمنصة تتيح لكم تقييم كفاءة أدواتنا الرقمية ومقارنتها مباشرة بمصادركم الحالية.
            </p>
          </SectionBlock>

          {/* ── المميزات ── */}
          <SectionBlock emoji="✨" title="مميزات المنصة الذكية">
            <div className="space-y-2 mt-1">
              {[
                { icon: '🏛️', title: 'فهارس الأحكام التخصصية', desc: 'تبويب ذكي ومفصل لدوائر المحكمة العليا يسهل الوصول للمبادئ القضائية.' },
                { icon: '🔍', title: 'محرك بحث شامل وسريع', desc: 'يدعم الوصول الفوري للمعلومة القانونية في جميع الأقسام.' },
                { icon: '📑', title: 'فهرسة تفاعلية للأبواب والفصول', desc: 'تصنيف هيكلي دقيق يسهل التنقل بين النصوص التشريعية.' },
                { icon: '🔢', title: 'البحث المباشر برقم المادة', desc: 'للوصول الفوري ودون عناء.' },
                { icon: '📋', title: 'نسخ النصوص بنقرة واحدة', desc: 'لدعم سرعة إعداد المذكرات والبحوث القانونية.' },
                { icon: '❤️', title: 'المفضلة المتقدمة', desc: 'لحفظ النصوص، القواعد، والأحكام والرجوع إليها بمرونة عالية.' },
                { icon: '🌙', title: 'تخصيص كامل لواجهة المستخدم', desc: 'تحكم مرن بحجم الخط ودعم كامل للوضع الليلي (Dark Mode).' },
                { icon: '🔖', title: 'تمييز المواد المعدَّلة', desc: 'إشارات بصرية واضحة للمواد التشريعية التي خضعت للتحديث.' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3 bg-white rounded-xl px-3 py-2.5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <span className="text-[16px] flex-shrink-0 mt-0.5">{f.icon}</span>
                  <div className="text-right flex-1">
                    <p className="text-[12.5px] font-bold text-gray-800 leading-tight">{f.title}</p>
                    <p className="text-[11.5px] text-gray-500 leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>

          {/* ── الاقتباس الختامي ── */}
          <div className="mx-4 mb-4">
            <div
              className="rounded-2xl p-4 text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0f1923 0%, #1a2a40 100%)',
              }}
            >
              {/* خط ذهبي علوي */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full" style={{ background: '#c8a84b' }} />

              <p className="text-[11px] font-bold text-[#c8a84b] mb-2 tracking-wider uppercase">
                💡 الاستثمار الأمثل
              </p>
              <p className="text-[13px] leading-[1.8] text-gray-300 italic">
                "إن اختياركم لمنصة الناصر القانونية هو استثمار حقيقي في الدقة، السرعة،
                والاحترافية الرقمية. مرجع قانوني موحد... يغنيكم تماماً عن تشتت المصادر المتناقضة."
              </p>

              {/* الذيل */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-[10.5px] text-gray-500">
                  جميع الحقوق محفوظة لمنصة الناصر القانونية © 2026
                </p>
                <p className="text-[10.5px] text-gray-400 mt-0.5">
                  المؤسس والمطور التقني: أ. معين الناصر
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ══ زر الإغلاق الثابت ══ */}
        <div
          className="flex-shrink-0 px-4 pb-6 pt-3"
          style={{
            background: 'linear-gradient(to top, #ffffff 80%, transparent)',
          }}
        >
          <button
            onClick={onClose}
            className="w-full h-12 rounded-2xl font-black text-[14px] text-white active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #0f1923 0%, #1a2a40 100%)',
              boxShadow: '0 4px 16px rgba(15,25,35,0.3)',
            }}
          >
            حسناً، فهمت ✓
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── مكوّنات مساعدة ── */

function SectionBlock({
  emoji, title, subtitle, children,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-4 mb-3">
      {/* رأس القسم */}
      <div className="flex items-center gap-2 mb-2 justify-end">
        <h3 className="text-[13px] font-black text-gray-800">{title}</h3>
        <span className="text-[16px]">{emoji}</span>
      </div>
      {subtitle && (
        <p className="text-[11px] text-gray-400 text-right mb-2">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

function StatRow({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <div className="bg-white rounded-xl px-3 py-2.5 flex items-start gap-2.5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex-shrink-0 mt-1 w-2 h-2 rounded-full" style={{ background: color }} />
      <div className="text-right flex-1">
        <span className="text-[12px] font-black text-gray-800">{label}: </span>
        <span className="text-[12px] text-gray-600 leading-relaxed">{text}</span>
      </div>
    </div>
  );
}
