import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * NavLinkCompatProps - واجهة مطورة تدعم التوافقية العالية
 * تهدف لتسهيل عملية التصميم الديناميكي للمنصات الكبرى.
 */
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  /** إضافة خاصية اختيارية لتعطيل الرابط عند الحاجة */
  disabled?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, disabled, ...props }, ref) => {
    
    // تحسين الأداء باستخدام useMemo لدمج الكلاسات الأساسية
    const baseClasses = useMemo(() => 
      cn(
        "transition-all duration-300 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md",
        disabled && "pointer-events-none opacity-50",
        className
      ), 
    [className, disabled]);

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        // منع الانتقال إذا كان الرابط معطلاً
        onClick={(e) => {
          if (disabled) e.preventDefault();
          if (props.onClick) props.onClick(e);
        }}
        className={({ isActive, isPending }) =>
          cn(
            baseClasses,
            // حالة النشاط: تعطي تغذية بصرية فورية للمستخدم
            isActive && cn("active-link-effect shadow-sm", activeClassName),
            // حالة التحميل: مهمة جداً لإشعار المستخدم بأن الصفحة قيد الجلب
            isPending && cn("animate-pulse cursor-wait opacity-70", pendingClassName)
          )
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
