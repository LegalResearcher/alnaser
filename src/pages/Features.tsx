/**
 * Alnasser Tech Digital Solutions
 * Component: Features — صفحة المزايا
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import {
  BookOpen, Target, Timer, BarChart3, Brain, TrendingUp,
  Swords, FlaskConical, MessageSquare, Share2, ChevronDown,
  Sparkles, ArrowLeft, CheckCircle2, Trophy, Flame, Zap,
  Users, Clock, Star, Award, Shield, RefreshCw,
  RotateCcw, XCircle, Lightbulb, Settings, Search,
  List, Repeat2, PlayCircle, BarChart2, Lock, Hash,
  Shuffle, Coins, StickyNote
} from 'lucide-react';

/* ─────────────── بيانات المزايا ─────────────── */
const features = [
  {
    id: 'bank',
    icon: BookOpen,
    emoji: '📚',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/40',
    accent: 'text-blue-600 dark:text-blue-400',
    tag: 'الأساس',
    title: 'بنك أسئلة ضخم',
    short: '+١٠,٤٩٢ سؤال في 47 مادة موزعة على ٤ مستويات',
    details: [
      'جميع الأسئلة من اختبارات جامعة صنعاء الفعلية',
      'مُصنَّفة حسب المستوى والمادة والسنة والنموذج',
      'تغطية كاملة لجميع مواد كلية الشريعة والقانون',
      'تحديث مستمر بإضافة أسئلة النماذج الجديدة',
    ],
  },
  {
    id: 'setup',
    icon: Settings,
    emoji: '⚙️',
    color: 'from-slate-500 to-gray-600',
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    border: 'border-slate-200 dark:border-slate-800/40',
    accent: 'text-slate-600 dark:text-slate-400',
    tag: 'إعداد',
    title: 'إعداد الاختبار',
    short: 'تحكّم كامل في طريقة الاختبار قبل أن تبدأ',
    details: [
      'اختيار سنة الدورة أو "جميع الأسئلة" لخلط كل الدورات عشوائياً',
      'اختيار النموذج: عام، موازي، مختلط — أو نماذج مرقّمة لثالث ثانوي',
      'شريط تمرير لضبط مدة المحاولة من ١٠ إلى ١٢٠ دقيقة',
      'حماية بكلمة مرور للمعلمين للتحكم في من يدخل الاختبار',
      'عداد يُظهر عدد الأسئلة الفعلي المتوفر لأي تصفية قبل البدء',
    ],
  },
  {
    id: 'subject-settings',
    icon: Search,
    emoji: '🔍',
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800/40',
    accent: 'text-purple-600 dark:text-purple-400',
    tag: 'استكشاف',
    title: 'إعدادات المادة',
    short: 'أدوات ذكية لاستكشاف كل مادة قبل الاختبار',
    details: [
      'بحث نصي داخل أسئلة المادة للوصول السريع لأي سؤال بعينه',
      'قائمة منظّمة بجميع أسئلة المادة مع فلترة بالسنة والنموذج',
      'كشف الأسئلة المكررة عبر الدورات مع تحديد السنوات التي ظهرت فيها',
      'بدء اختبار سريع مباشرة من داخل إعدادات المادة',
      'إحصائيات المادة: عدد الأسئلة الكلي وتوزيعها وعدد المكرر منها',
    ],
  },
  {
    id: 'inside-exam',
    icon: PlayCircle,
    emoji: '🎮',
    color: 'from-teal-500 to-cyan-500',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800/40',
    accent: 'text-teal-600 dark:text-teal-400',
    tag: 'تفاعل',
    title: 'داخل الاختبار',
    short: 'تجربة تفاعلية سلسة أثناء تأديته',
    details: [
      'مؤقت دائري يتحول للأصفر عند الاقتراب والأحمر عند الخطر',
      'تلميحات اختيارية لكل سؤال تُفعّلها عند الحاجة دون أثر على نتيجتك',
      'نقاط مباشرة (Score Live) يظهر رصيدك أثناء الإجابة لحظةً بلحظة',
      'ترتيب الأسئلة والخيارات يختلف في كل محاولة لمنع الحفظ الأعمى',
    ],
  },
  {
    id: 'modes',
    icon: Target,
    emoji: '🎯',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800/40',
    accent: 'text-violet-600 dark:text-violet-400',
    tag: 'مرونة',
    title: 'نماذج اختبار متعددة',
    short: 'عام · موازي · مختلط · تجريبي · جميع الأسئلة',
    details: [
      'نموذج عام — الاختبار  ',
      'نموذج موازي —  الاختبار',
      'مختلط — عشوائي ',
      'تجريبي — أسئلة تدريبية إضافية خارج النماذج',
      'جميع الأسئلة — الكنز الكامل للمادة دفعة واحدة',
    ],
  },
  {
    id: 'timer',
    icon: Timer,
    emoji: '⏱️',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/40',
    accent: 'text-amber-600 dark:text-amber-400',
    tag: 'تنافس',
    title: 'مؤقت مرئي + نقاط',
    short: 'كل اختبار بوقت حقيقي ونقاط تتراكم وفق أدائك',
    details: [
      'مؤقت دائري يظهر الوقت بشكل بصري واضح',
      '١٠ نقاط لكل إجابة صحيحة',
      '+٥٠ نقطة إذا تجاوزت ٩٠%',
      '+١٠٠ نقطة إذا أتقنت ١٠٠%',
      '+٢٠ نقطة إذا أنهيت في أقل من ٥ دقائق',
    ],
  },
  {
    id: 'results',
    icon: BarChart3,
    emoji: '📊',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    accent: 'text-emerald-600 dark:text-emerald-400',
    tag: 'تحليل',
    title: 'نتائج فورية ومفصّلة',
    short: 'بطاقة احترافية + مراجعة كاملة + مقارنة بالآخرين',
    details: [
      'دائرة متحركة تمتلئ بنسبتك مع كونفيتي احتفالي عند النجاح',
      'مراجعة كل سؤال مع تمييز إجابتك والإجابة الصحيحة',
      'المرجع القانوني أسفل كل سؤال إن وُجد',
      'مقارنة أداءك مع جميع من حلّوا هذه المادة',
      'حفظ النتيجة صورة PNG + مشاركة واتساب وتويتر',
    ],
  },
  {
    id: 'diagnostic',
    icon: Brain,
    emoji: '🧠',
    color: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800/40',
    accent: 'text-rose-600 dark:text-rose-400',
    tag: 'ذكاء',
    title: 'الاختبار التشخيصي',
    short: '٣ أسئلة من كل مادة → تحليل مادة بمادة → توصية مباشرة',
    details: [
      'يجلب ٣ أسئلة من كل مادة في مستواك ويخلطها في جلسة واحدة',
      'يُحلّل أداءك مادةً بمادة ويحدد نقاط القوة والضعف',
      'توصية مباشرة باسم المواد التي تحتاج تركيزاً أكثر',
      'لا حساب · لا تسجيل · نتيجة فورية',
      'يمكن إعادته لأي مستوى آخر من نفس الصفحة',
    ],
  },
  {
    id: 'progress',
    icon: TrendingUp,
    emoji: '🔄',
    color: 'from-sky-500 to-blue-500',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-800/40',
    accent: 'text-sky-600 dark:text-sky-400',
    tag: 'تتبع',
    title: 'متابعة تقدمك',
    short: 'سجلك يتراكم تلقائياً بمجرد كتابة نفس اسمك',
    details: [
      'لا حساب ولا بريد إلكتروني — فقط اسمك في كل اختبار',
      'متوسط نتائجك وأفضل نتيجة وإجمالي الاختبارات',
      'أطول سلسلة أيام متواصلة وآخر ٨ اختبارات',
      '٧ شارات تُمنح تلقائياً: أول اختبار · إتقان تام · متفوق · مثابر · خبير · ٣ أيام · أسبوع',
      'الشارات المكتسبة تضيء والمتبقية باهتة',
    ],
  },
  {
    id: 'challenge',
    icon: Swords,
    emoji: '⚔️',
    color: 'from-orange-500 to-red-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800/40',
    accent: 'text-orange-600 dark:text-orange-400',
    tag: 'تحدي',
    title: 'تحدي الزميل',
    short: 'اختبار جماعي حي بنفس أسئلتك ولوحة ترتيب مباشرة',
    details: [
      'اضغط "تحدّ زميلك" بعد أي اختبار وسيُنشأ رابط في ثانية',
      'كل من يفتح الرابط يحل نفس أسئلتك بنفس الوقت المحدد',
      'لوحة ترتيب حية تتحدث لحظة بلحظة بمجرد انتهاء كل مشارك',
      'الترتيب بالنسبة أولاً ثم الوقت عند التساوي',
      'الرابط صالح ٤٨ ساعة',
    ],
  },
  {
    id: 'trial',
    icon: FlaskConical,
    emoji: '🧪',
    color: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800/40',
    accent: 'text-teal-600 dark:text-teal-400',
    tag: 'مجتمع',
    title: 'الأسئلة التجريبية',
    short: 'قسم مستقل في كل مادة يُثريه محررون معتمدون من الطلاب',
    details: [
      'بجانب أسئلة السنوات الرسمية قسم مستقل للأسئلة التجريبية',
      'يُضيفها محررون معتمدون من الطلاب أنفسهم',
      'كل طلب إضافة يمر بمراجعة المسؤول قبل النشر',
      'الطالب المتميز يتحول من مستخدم إلى مساهم حقيقي',
      'الجودة محمية بنظام المراجعة والموافقة',
    ],
  },
  {
    id: 'share',
    icon: Share2,
    emoji: '📲',
    color: 'from-indigo-500 to-violet-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800/40',
    accent: 'text-indigo-600 dark:text-indigo-400',
    tag: 'مشاركة',
    title: 'مشاركة السؤال أثناء الاختبار',
    short: 'أرسل أي سؤال لزملائك بضغطة واحدة دون مغادرة الاختبار',
    details: [
      'زر "مشاركة" صغير أعلى كل سؤال مباشرةً',
      'واتساب — نص السؤال كاملاً مع رابط المادة',
      'تيليغرام وتويتر/X — تغريدة جاهزة بنص السؤال',
      'نسخ الرابط مع تأكيد "تم النسخ ✓"',
      'المؤقت لا ينقطع والاختبار لا يزال يعمل',
    ],
  },
  {
    id: 'resume',
    icon: RotateCcw,
    emoji: '💾',
    color: 'from-cyan-500 to-sky-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800/40',
    accent: 'text-cyan-600 dark:text-cyan-400',
    tag: 'استمرارية',
    title: 'استئناف الاختبار',
    short: 'حفظ تلقائي للإجابات والوقت — عُد من حيث توقفت في أي وقت',
    details: [
      'حفظ تلقائي للإجابات والوقت المتبقي كل دقيقة',
      'التقدم المحفوظ يبقى صالحاً لمدة ٧ أيام كاملة',
      'عند العودة يسألك الموقع: متابعة أم بدء من جديد؟',
      'يعمل حتى لو أُغلق المتصفح أو انقطع الإنترنت',
    ],
  },
  {
    id: 'errors',
    icon: XCircle,
    emoji: '❌',
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800/40',
    accent: 'text-red-600 dark:text-red-400',
    tag: 'مراجعة',
    title: 'بنك الأخطاء',
    short: 'كل سؤال تُخطئ فيه يُحفظ تلقائياً — راجع نقاط ضعفك بدقة',
    details: [
      'كل سؤال تُخطئ فيه يُحفظ تلقائياً في بنك الأخطاء',
      'متى وصلت إلى ٣ أخطاء أو أكثر يظهر زر "راجع أخطاءك" قبل الاختبار',
      'اختبار مخصص يضم فقط الأسئلة التي أخطأت فيها سابقاً',
      'ركّز على نقاط ضعفك بدلاً من إعادة الكل من البداية',
    ],
  },
  {
    id: 'suggest',
    icon: Lightbulb,
    emoji: '💡',
    color: 'from-lime-500 to-green-500',
    bg: 'bg-lime-50 dark:bg-lime-950/30',
    border: 'border-lime-200 dark:border-lime-800/40',
    accent: 'text-lime-700 dark:text-lime-400',
    tag: 'مشاركة',
    title: 'اقتراح سؤال',
    short: 'أي زائر يستطيع اقتراح سؤال جديد — يُضاف بعد مراجعة الفريق',
    details: [
      'أي زائر يستطيع اقتراح سؤال جديد لأي مادة',
      'يدعم أنواعاً متعددة: ٤ خيارات، ٣، ٢، صح وخطأ',
      'كل مقترح يمر بمراجعة المسؤول قبل النشر للحفاظ على الجودة',
      'الطالب المتميز يتحول من مستخدم إلى مساهم حقيقي في بناء المنصة',
    ],
  },
  {
    id: 'report',
    icon: MessageSquare,
    emoji: '💬',
    color: 'from-yellow-500 to-amber-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800/40',
    accent: 'text-yellow-700 dark:text-yellow-400',
    tag: 'جودة',
    title: 'نظام التعقيب على الأسئلة',
    short: 'أبلغ عن خطأ من داخل السؤال نفسه لحظة رؤيته',
    details: [
      'زر "إبلاغ عن خطأ" برتقالي مميز أعلى كل سؤال',
      'اختر نوع الخطأ + الإجابة الصحيحة + ملاحظة + صورة مرجع',
      'يصل للإدارة مرتبطاً بمعرّف السؤال تلقائياً',
      'بياناتك اختيارية تماماً',
      'اسمك يُسجَّل مراجعاً في السؤال ذاته إن ثبتت صحة ملاحظتك',
    ],
  },
];

/* ─────────────── Stats ─────────────── */
const stats = [
  { icon: BookOpen,      value: '+١٠,٤٩٢', label: 'سؤال قانوني',       color: 'text-blue-500' },
  { icon: Target,        value: '47',       label: 'مادة دراسية',       color: 'text-violet-500' },
  { icon: Users,         value: '٤',        label: 'مستويات أكاديمية',  color: 'text-emerald-500' },
  { icon: Star,          value: '١٣',       label: 'مزايا حصرية',       color: 'text-amber-500' },
];

/* ─────────────── تحويل الأرقام العربية إلى إنجليزية ─────────────── */
function arabicToInt(str: string): number {
  return parseInt(
    str
      .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
      .replace(/[^0-9]/g, ''),
    10
  ) || 0;
}

/* ─────────────── Count-up hook ─────────────── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ─────────────── Stat Item with count-up ─────────────── */
function StatItem({ stat, animate }: { stat: typeof stats[0]; animate: boolean }) {
  const Icon = stat.icon;
  const numericTarget = arabicToInt(stat.value);
  const count = useCountUp(numericTarget, 1800, animate);
  const hasPlus = stat.value.includes('+');
  const displayValue = animate && numericTarget > 0
    ? `${hasPlus ? '+' : ''}${count.toLocaleString('ar-EG')}`
    : stat.value;

  return (
    <div className="text-center group">
      <div className={cn(
        'w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center',
        'bg-background border border-border shadow-sm',
        'group-hover:scale-110 transition-transform duration-300'
      )}>
        <Icon className={cn('w-5 h-5', stat.color)} />
      </div>
      <p className="text-2xl font-black text-foreground tabular-nums">{displayValue}</p>
      <p className="text-xs text-muted-foreground font-semibold mt-0.5">{stat.label}</p>
    </div>
  );
}

/* ─────────────── الصفحة الرئيسية ─────────────── */
const FeaturesPage = () => {
  const navigate = useNavigate();
  const [expandAll, setExpandAll] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // ══════════════════════════════════════
  // حماية المحتوى ضد النسخ
  // ══════════════════════════════════════
  useEffect(() => {
    // منع تحديد النص
    const preventSelect = (e: Event) => e.preventDefault();
    // منع القائمة اليمنى
    const preventContext = (e: MouseEvent) => e.preventDefault();
    // منع اختصارات لوحة المفاتيح
    const preventKeys = (e: KeyboardEvent) => {
      if (
        e.ctrlKey && ['c', 'a', 's', 'u', 'p'].includes(e.key.toLowerCase())
      ) e.preventDefault();
      // منع F12 وأدوات المطور
      if (e.key === 'F12') e.preventDefault();
      // منع Print Screen — يعمل في بعض المتصفحات
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        navigator.clipboard?.writeText('').catch(() => {});
      }
    };
    // منع السحب والإفلات
    const preventDrag = (e: DragEvent) => e.preventDefault();

    document.addEventListener('selectstart', preventSelect);
    document.addEventListener('contextmenu', preventContext);
    document.addEventListener('keydown', preventKeys);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('copy', preventSelect);
    document.addEventListener('cut', preventSelect);

    // CSS لمنع التحديد
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    return () => {
      document.removeEventListener('selectstart', preventSelect);
      document.removeEventListener('contextmenu', preventContext);
      document.removeEventListener('keydown', preventKeys);
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('copy', preventSelect);
      document.removeEventListener('cut', preventSelect);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  // تشغيل count-up عند ظهور Stats في الشاشة
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.4 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <MainLayout>
      <div
        className="min-h-screen bg-background relative"
        dir="rtl"
        onCopy={e => e.preventDefault()}
        onCut={e => e.preventDefault()}
        onContextMenu={e => e.preventDefault()}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {/* طبقة Watermark شفافة — تظهر في Screenshot */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='150'%3E%3Ctext transform='rotate(-30)' x='-60' y='100' font-size='14' fill='%23000' opacity='0.04' font-family='Cairo,sans-serif' font-weight='bold'%3Emnصة الناصر — محمي%3C/text%3E%3C/text%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* ══════════════════════════════════════
            Hero — خلفية متحركة + entrance animation
        ══════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-14 pb-12 md:pt-24 md:pb-20">

          {/* طبقة الخلفية */}
          <div className="absolute inset-0 pointer-events-none">
            {/* gradient كبير */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-transparent to-transparent" />
            {/* دوائر ضبابية متعددة */}
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="absolute top-1/2 left-0 w-[350px] h-[350px] bg-violet-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
            <div className="absolute -bottom-10 right-1/3 w-[300px] h-[300px] bg-cyan-500/6 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
            {/* شبكة نقطية خفيفة */}
            <div className="absolute inset-0 opacity-[0.015]"
              style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="max-w-3xl mx-auto text-center">

              {/* شارة — تظهر أولاً */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6
                animate-in fade-in slide-in-from-bottom-3 duration-500">
                <Sparkles className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-sm font-black text-primary">١٣ مزايا حصرية</span>
              </div>

              {/* العنوان */}
              <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4 leading-tight
                animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: '100ms' }}>
                كل ما يميّز{' '}
                <span className="relative inline-block text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }}>
                  الباحث القانوني
                  {/* خط تحت العنوان */}
                  <span className="absolute -bottom-1 right-0 left-0 h-[3px] rounded-full opacity-60"
                    style={{ background: 'linear-gradient(90deg, hsl(217 91% 55%), hsl(199 89% 48%))' }} />
                </span>
              </h1>

              {/* الوصف */}
              <p className="text-base md:text-lg text-muted-foreground font-bold leading-relaxed mb-8 max-w-xl mx-auto
                animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: '200ms' }}>
                منصة تعليمية متكاملة بُنيت خصيصاً لطلاب الشريعة والقانون في اليمن — من بنك الأسئلة حتى التحدي الجماعي الحي
              </p>

              {/* أزرار */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center
                animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: '300ms' }}>
                <button
                  onClick={() => navigate('/levels')}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl font-black text-white text-sm shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }}
                >
                  ابدأ الاختبار الآن
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/diagnostic')}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl font-black text-sm border border-border bg-background/80 backdrop-blur-sm text-foreground hover:bg-muted hover:scale-[1.02] transition-all active:scale-[0.98]"
                >
                  <Brain className="w-4 h-4 text-rose-500" />
                  جرّب التشخيصي
                </button>
              </div>

              {/* Social proof صغير تحت الأزرار */}
              <p className="mt-5 text-xs text-muted-foreground font-semibold animate-in fade-in duration-700" style={{ animationDelay: '500ms' }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex -space-x-1 rtl:space-x-reverse">
                    {['🟢','🟢','🟢'].map((_, i) => (
                      <span key={i} className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 border-2 border-background flex items-center justify-center text-[8px]">👤</span>
                    ))}
                  </span>
                  انضم لأكثر من <strong className="text-foreground">٢,٠٠٠ طالب</strong> يستعدون الآن
                </span>
              </p>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            Stats — count-up عند الظهور
        ══════════════════════════════════════ */}
        <section className="border-y border-border bg-muted/40 dark:bg-card/50" ref={statsRef}>
          <div className="container mx-auto px-4 md:px-6 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((s, i) => (
                <StatItem key={i} stat={s} animate={statsVisible} />
              ))}
            </div>
          </div>
        </section>

        {/* ── المزايا ── */}
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-foreground">جميع المزايا</h2>
              <button
                onClick={() => setExpandAll(!expandAll)}
                className="flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
              >
                <RefreshCw className={cn('w-3.5 h-3.5 transition-transform duration-500', expandAll && 'rotate-180')} />
                {expandAll ? 'طيّ الكل' : 'عرض الكل'}
              </button>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <ExpandableCard
                  key={feature.id}
                  feature={feature}
                  index={index}
                  forceOpen={expandAll}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── مقارنة سريعة ── */}
        <section className="py-10 md:py-14 bg-muted/40 dark:bg-card/30 border-t border-border">
          <div className="container mx-auto px-4 md:px-6 max-w-2xl">
            <div className="text-center mb-8">
              <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">مقارنة</p>
              <h2 className="text-xl font-black text-foreground">ما يميّزنا عن غيرنا</h2>
            </div>
            <div className="space-y-3">
              {[
                { us: 'بلاغ من داخل السؤال نفسه', them: 'راسلنا على واتساب إذا وجدت خطأ' },
                { us: 'تحدٍّ حي بنفس الأسئلة ولوحة ترتيب فورية', them: 'أرسل لصديقك وقارن يدوياً' },
                { us: 'مقارنة أدائك مع المئات من الطلاب', them: 'نتيجتك فقط بدون سياق' },
                { us: 'اختبار تشخيصي يحدد مواد ضعفك بالاسم', them: 'ذاكر بدون توجيه' },
                { us: 'محررون من الطلاب يُثرون بنك الأسئلة', them: 'محتوى ثابت من الإدارة فقط' },
                { us: 'سجل تقدم بدون تسجيل حساب', them: 'تسجيل إلزامي لمتابعة أدائك' },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 leading-relaxed">{row.us}</span>
                  </div>
                  <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 text-sm">✕</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{row.them}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            CTA — social proof + تصميم محسّن
        ══════════════════════════════════════ */}
        <section className="py-14 md:py-20 relative overflow-hidden">
          {/* خلفية CTA */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-violet-500/6 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 md:px-6 text-center relative">
            <div className="max-w-lg mx-auto">

              {/* أيقونة */}
              <div className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-xl shadow-primary/20"
                style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }}>
                <Zap className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
                جاهز تبدأ؟
              </h2>
              <p className="text-muted-foreground font-bold mb-4">
                لا تسجيل، لا اشتراك — فقط ادخل اسمك وابدأ
              </p>

              {/* Social proof */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-7 text-xs text-muted-foreground font-semibold">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  +٢,٠٠٠ طالب نشط
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  +١٠,٤٩٢ سؤال
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-violet-500" />
                  بدون إعلانات
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  مجاني ١٠٠٪
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/levels')}
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl font-black text-white shadow-xl shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }}
                >
                  ابدأ الاختبار
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/progress')}
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl font-black text-sm border border-border bg-background/80 backdrop-blur-sm text-foreground hover:bg-muted hover:scale-[1.02] transition-all active:scale-[0.98]"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  تقدمي الدراسي
                </button>
              </div>

            </div>
          </div>
        </section>

      </div>
    </MainLayout>
  );
};

/* ─────────────── بطاقة قابلة للتوسيع — animation سلس ─────────────── */
function ExpandableCard({
  feature, index, forceOpen
}: {
  feature: typeof features[0];
  index: number;
  forceOpen: boolean;
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = forceOpen || localOpen;
  const Icon = feature.icon;
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      className={cn(
        'group rounded-3xl border transition-all duration-300 overflow-hidden',
        feature.bg, feature.border,
        isOpen
          ? 'shadow-xl dark:shadow-black/40'
          : 'hover:shadow-lg dark:hover:shadow-black/30 hover:-translate-y-0.5'
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* رأس البطاقة */}
      <button
        onClick={() => setLocalOpen(!localOpen)}
        className="w-full text-right p-5 md:p-6 flex items-start gap-4"
      >
        {/* أيقونة */}
        <div className={cn(
          'shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-md transition-transform duration-300',
          feature.color,
          isOpen ? 'scale-110' : 'group-hover:scale-105'
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* المحتوى */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn(
              'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
              feature.accent, feature.border,
              'bg-white/60 dark:bg-white/5'
            )}>
              {feature.tag}
            </span>
            <h3 className="font-black text-base text-foreground">{feature.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">{feature.short}</p>
        </div>

        {/* سهم */}
        <ChevronDown className={cn(
          'shrink-0 w-5 h-5 mt-1 transition-transform duration-300',
          feature.accent,
          isOpen ? 'rotate-180' : ''
        )} />
      </button>

      {/* التفاصيل — animation بالـ height */}
      <div
        style={{
          height: `${height}px`,
          transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        <div ref={contentRef} className="px-5 md:px-6 pb-5 md:pb-6">
          <div className="border-t border-current/10 pt-4 space-y-2">
            {feature.details.map((detail, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5"
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                  transition: `opacity 0.3s ease ${i * 50}ms, transform 0.3s ease ${i * 50}ms`,
                }}
              >
                <CheckCircle2 className={cn('w-4 h-4 shrink-0 mt-0.5', feature.accent)} />
                <span className="text-sm text-foreground/80 font-medium leading-relaxed">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturesPage;