/**
 * LegalAboutModal.tsx
 * نافذة "معلومة" المنبثقة — تظهر عند الضغط على "حول" في شريط التنقل السفلي
 * لقوائم المكتبة القانونية (القوانين / اللوائح / تعليمات النيابة).
 * المحتوى والتنسيق مطابقان للقطة الشاشة المرجعية: خلفية وردية فاتحة جداً،
 * عناوين الأقسام بالأزرق الفاتح، أيقونات تعبيرية، زر "فهمت" كحلي في الأسفل.
 */
import { Info } from 'lucide-react';

interface LegalAboutModalProps {
  open: boolean;
  onClose: () => void;
  /** عنوان القسم المعروض ضمن الجملة التمهيدية، مثل "القوانين اليمنية" أو "اللوائح" */
  sectionLabel: string;
}

export function LegalAboutModal({ open, onClose, sectionLabel }: LegalAboutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55" />
      <div
        className="relative w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-3xl bg-[#fbf3f7] dark:bg-slate-900 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* العنوان */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Info className="w-5 h-5 text-sky-500 fill-sky-100" />
          <h2 className="text-lg font-black text-foreground">معلومة</h2>
        </div>

        {/* النص التمهيدي */}
        <p className="text-sm leading-loose text-center text-foreground/90 mb-5">
          يتضمن هذا القسم كافة {sectionLabel} مع آخر التعديلات الرسمية التي طرأت عليها حتى اليوم،
          لضمان وصولك إلى نص قانوني دقيق وموثوق.
        </p>

        {/* هل تعلم؟ */}
        <section className="mb-5">
          <h3 className="flex items-center justify-center gap-1.5 text-sm font-black text-sky-600 dark:text-sky-400 mb-2">
            هل تعلم؟ <span>📊</span>
          </h3>
          <p className="text-sm text-center text-foreground/90 mb-1.5">منذ عام 1990م وحتى اليوم:</p>
          <ul className="text-sm text-foreground/90 space-y-1.5 text-center">
            <li>• تم إلغاء أكثر من 10 قوانين بالكامل وحل محلها قوانين جديدة.</li>
            <li>• طرأت تعديلات على أكثر من 50 قانوناً آخر.</li>
            <li>• تغيرت أكثر من ألف مادة قانونية سواء بالحذف أو التعديل أو الإضافة.</li>
          </ul>
        </section>

        {/* جربه بنفسك */}
        <section className="mb-5">
          <h3 className="flex items-center justify-center gap-1.5 text-sm font-black text-sky-600 dark:text-sky-400 mb-2">
            جرّبه بنفسك <span>🎁</span>
          </h3>
          <p className="text-sm text-center text-foreground/90 leading-loose">
            القرار لا يُبنى على الكلام، بل على التجربة. أمامك الوقت الكافي لتجربة التطبيق مجاناً
            ومقارنته بمصادرك الحالية.
          </p>
        </section>

        {/* مميزات التطبيق */}
        <section className="mb-5">
          <h3 className="flex items-center justify-center gap-1.5 text-sm font-black text-sky-600 dark:text-sky-400 mb-2">
            مميزات التطبيق <span>⭐</span>
          </h3>
          <ul className="text-sm text-foreground/90 space-y-1.5 text-center">
            <li>• المفضلة لسهولة الرجوع.</li>
            <li>• البحث الشامل والسريع.</li>
            <li>• فهرس تفاعلي للأبواب والفصول.</li>
            <li>• البحث برقم المادة مباشرة.</li>
            <li>• نسخ المواد بنقرة واحدة.</li>
            <li>• التحكم بحجم الخط والوضع الليلي.</li>
            <li>• تمييز المواد المعدَّلة.</li>
          </ul>
        </section>

        {/* الجملة الختامية */}
        <p className="text-xs text-center italic text-muted-foreground leading-loose mb-5">
          اختيارك لهذا التطبيق هو استثمار في الدقة، والسرعة، والاحترافية. مرجع قانوني واحد… يغنيك
          عن عشرات المصادر المتناقضة. 🛰️
        </p>

        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="w-full h-11 rounded-2xl bg-[#1a2744] text-white font-black text-sm shadow-md active:scale-[0.98] transition-transform"
        >
          فهمت
        </button>
      </div>
    </div>
  );
}
