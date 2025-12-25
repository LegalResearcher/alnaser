import * as React from "react";

/** * معيار الشاشات الصغيرة للمنصات العالمية
 * تم ضبطه ليتوافق مع معايير Tailwind القياسية
 */
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // استخدام الحالة الأولية بناءً على حجم الشاشة فوراً لتجنب الـ Flicker
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // التحقق من وجود نافذة المتصفح لضمان التوافق مع SSR
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    // التأكد من أن الكود يعمل في بيئة المتصفح فقط
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // تعريف وظيفة التحديث بشكل منعزل لتحسين الأداء
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // دعم المتصفحات القديمة والحديثة لإضافة المستمع
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
    } else {
      // التوافق مع المتصفحات الأقدم (Legacy Support)
      mql.addListener(onChange);
    }

    // التحديث الأولي عند تفعيل الـ Hook
    setIsMobile(mql.matches);

    // تنظيف المستمع عند مسح المكون من الذاكرة (Memory Management)
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange);
      } else {
        mql.removeListener(onChange);
      }
    };
  }, []);

  return isMobile;
}
