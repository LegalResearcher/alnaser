/**
 * LegalAboutModal.tsx — تصميم احترافي عالمي — نسخة محسّنة
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
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg max-h-[94vh] flex flex-col rounded-t-[28px] overflow-hidden animate-in slide-in-from-bottom duration-300"
        style={{ background: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ══ هيدر ══ */}
        <div
          className="flex-shrink-0 px-6 pt-7 pb-6 relative"
          style={{ background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-5 left-5 flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/15 text-white/70 active:text-white transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.3)' }}
            >
              <span className="text-2xl">ℹ️</span>
            </div>
            <h2 className="text-[20px] font-black text-white leading-tight mb-1">
              عن المكتبة القانونية
            </h2>
            <p className="text-[12px] text-gray-400 tracking-[0.15em] uppercase mb-3">
              Al-Naser Legal Library
            </p>
            <div
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-bold"
              style={{ background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.3)', color: '#c8a84b' }}
            >
              منصة الناصر القانونية © 2026
            </div>
          </div>
        </div>

        {/* ══ المحتوى ══ */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#f4f6f9' }}>

          {/* المقدمة */}
          <div className="mx-4 mt-5 mb-4 bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p className="text-[15px] leading-[2] text-gray-700 text-right">
              يضم هذا القسم بنية تشريعية وقضائية متكاملة تمنحك وصولاً فورياً إلى أكثر من{' '}
              <span className="font-black text-[#c8a84b]">272 قانوناً ووثيقة رسمية</span>{' '}
              خاضعة لآخر التعديلات التشريعية، بالإضافة إلى{' '}
              <span className="font-black text-[#c8a84b]">1997 قاعدة قضائية</span>{' '}
              مستنبطة من أحكام ومبادئ المحكمة العليا.
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[14px] leading-[2] text-gray-700 text-right">
                تتميز المنصة بـ{' '}
                <span className="font-bold text-gray-900">"فهرس أحكام المحكمة العليا"</span>{' '}
                المصنَّف تفاعلياً ليشمل كافة الدوائر القضائية:{' '}
                <span className="font-semibold text-[#0ea5e9]">
                  الإدارية، المدنية، التجارية، الجزائية، الشخصية، العسكرية، ودائرة فحص الطعون
                </span>.
              </p>
            </div>
          </div>

          {/* إحصائيات */}
          <div className="mx-4 mb-4">
            <SectionHeader emoji="📊" title="إحصائيات وحقائق قانونية" subtitle="منذ عام 1990م وحتى اليوم" />
            <div className="space-y-3 mt-3">
              <StatCard color="#ef4444" bg="#fff5f5" label="إلغاء وإحلال"
                text="تم إلغاء أكثر من 10 قوانين بالكامل واستبدالها بتشريعات حديثة مواكبة للمستجدات." />
              <StatCard color="#f59e0b" bg="#fffbeb" label="تعديلات هيكلية"
                text="خضع أكثر من 50 قانوناً لتعديلات جوهرية." />
              <StatCard color="#6366f1" bg="#f5f3ff" label="تحديثات نصية"
                text="شملت عمليات الحذف، الإضافة، أو التعديل أكثر من 1000 مادة قانونية." />
            </div>
          </div>

          {/* اتخذ قرارك */}
          <div className="mx-4 mb-4">
            <SectionHeader emoji="⚖️" title="اتخذ قرارك بناءً على التجربة" />
            <div className="mt-3 bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p className="text-[15px] leading-[2] text-gray-700 text-right">
                القرارات القانونية الرشيدة تُبنى على البرهان لا على الوعود. ندعوكم لخوض
                تجربة عملية متكاملة للمنصة تتيح لكم تقييم كفاءة أدواتنا الرقمية ومقارنتها
                مباشرة بمصادركم الحالية.
              </p>
            </div>
          </div>

          {/* المميزات */}
          <div className="mx-4 mb-4">
            <SectionHeader emoji="✨" title="مميزات المنصة الذكية" />
            <div className="mt-3 space-y-2.5">
              {[
                { icon: '🏛️', title: 'فهارس الأحكام التخصصية', desc: 'تبويب ذكي ومفصل لدوائر المحكمة العليا يسهل الوصول للمبادئ القضائية.' },
                { icon: '🔍', title: 'محرك بحث شامل وسريع', desc: 'وصول فوري للمعلومة القانونية في جميع الأقسام.' },
                { icon: '📑', title: 'فهرسة تفاعلية للأبواب والفصول', desc: 'تصنيف هيكلي دقيق يسهل التنقل بين النصوص التشريعية.' },
                { icon: '🔢', title: 'البحث المباشر برقم المادة', desc: 'وصول فوري ودون عناء.' },
                { icon: '📋', title: 'نسخ النصوص بنقرة واحدة', desc: 'لدعم سرعة إعداد المذكرات والبحوث القانونية.' },
                { icon: '❤️', title: 'المفضلة المتقدمة', desc: 'حفظ النصوص، القواعد، والأحكام والرجوع إليها بمرونة عالية.' },
                { icon: '🌙', title: 'تخصيص كامل للواجهة', desc: 'تحكم مرن بحجم الخط ودعم كامل للوضع الليلي.' },
                { icon: '🔖', title: 'تمييز المواد المعدَّلة', desc: 'إشارات بصرية واضحة للمواد التشريعية المحدَّثة.' },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-2xl px-4 py-4 flex items-start gap-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span className="text-[22px] flex-shrink-0 mt-0.5">{f.icon}</span>
                  <div className="text-right flex-1">
                    <p className="text-[15px] font-bold text-gray-800 leading-snug">{f.title}</p>
                    <p className="text-[13px] text-gray-500 leading-relaxed mt-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* الاقتباس الختامي */}
          <div className="mx-4 mb-6">
            <div
              className="rounded-2xl p-5 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0f1923 0%, #1a2a40 100%)' }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[3px] rounded-full" style={{ background: '#c8a84b' }} />
              <p className="text-[13px] font-bold text-[#c8a84b] mb-3 tracking-wider">
                💡 الاستثمار الأمثل
              </p>
              <p className="text-[14px] leading-[2] text-gray-300 italic">
                "إن اختياركم لمنصة الناصر القانونية هو استثمار حقيقي في الدقة، السرعة،
                والاحترافية الرقمية. مرجع قانوني موحد... يغنيكم تماماً عن تشتت المصادر المتناقضة."
              </p>
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[12px] text-gray-500">جميع الحقوق محفوظة لمنصة الناصر القانونية © 2026</p>
                <p className="text-[12px] text-gray-400 mt-1">المؤسس والمطور التقني: أ. معين الناصر</p>
              </div>
            </div>
          </div>

        </div>

        {/* ══ زر الإغلاق ══ */}
        <div className="flex-shrink-0 px-4 pb-8 pt-3 bg-white border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full h-14 rounded-2xl font-black text-[16px] text-white active:scale-[0.98] transition-transform"
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

function SectionHeader({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <div>
        <h3 className="text-[16px] font-black text-gray-800 text-right">{title}</h3>
        {subtitle && <p className="text-[12px] text-gray-400 text-right mt-0.5">{subtitle}</p>}
      </div>
      <span className="text-[20px] flex-shrink-0">{emoji}</span>
    </div>
  );
}

function StatCard({ color, bg, label, text }: { color: string; bg: string; label: string; text: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-4 flex items-start gap-3"
      style={{ background: bg, border: `1px solid ${color}22` }}
    >
      <div className="flex-shrink-0 mt-1.5 w-3 h-3 rounded-full" style={{ background: color }} />
      <div className="text-right flex-1">
        <span className="text-[15px] font-black" style={{ color }}>{label}: </span>
        <span className="text-[14px] text-gray-700 leading-relaxed">{text}</span>
      </div>
    </div>
  );
}
