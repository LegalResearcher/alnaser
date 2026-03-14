/**
 * Alnasser Tech Digital Solutions
 * Component: Features — صفحة المزايا
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import {
  BookOpen, Target, Timer, BarChart3, Brain, TrendingUp,
  Swords, FlaskConical, MessageSquare, Share2, ChevronDown,
  Sparkles, ArrowLeft, CheckCircle2, Trophy, Flame, Zap,
  Users, Clock, Star, Award, Shield, RefreshCw
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
      'تغطية كاملة لجميع مواد الكليات القانونية',
      'تحديث مستمر بإضافة أسئلة الدورات الجديدة',
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
      'نموذج عام — الاختبار الرسمي للدورة',
      'نموذج موازي — الدورة الاحتياطية',
      'مختلط — عشوائي من جميع السنوات',
      'تجريبي — أسئلة تدريبية إضافية خارج الدورات',
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
  { icon: Star,          value: '١٠',       label: 'مزايا حصرية',       color: 'text-amber-500' },
];

/* ─────────────── بطاقة الميزة ─────────────── */
function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = feature.icon;

  return (
    <div
      className={cn(
        'group rounded-3xl border transition-all duration-300 overflow-hidden',
        feature.bg, feature.border,
        open ? 'shadow-xl' : 'hover:shadow-lg hover:-translate-y-0.5'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* الرأس */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-right p-5 md:p-6 flex items-start gap-4"
      >
        {/* أيقونة */}
        <div className={cn(
          'shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center',
          'bg-gradient-to-br shadow-md',
          feature.color
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* المحتوى */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn(
              'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
              feature.bg, feature.accent,
              'border', feature.border
            )}>
              {feature.tag}
            </span>
            <h3 className="font-black text-base text-foreground">{feature.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            {feature.short}
          </p>
        </div>

        {/* سهم */}
        <ChevronDown className={cn(
          'shrink-0 w-5 h-5 mt-1 transition-transform duration-300',
          feature.accent,
          open ? 'rotate-180' : ''
        )} />
      </button>

      {/* التفاصيل */}
      {open && (
        <div className="px-5 md:px-6 pb-5 md:pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-t border-current/10 pt-4 space-y-2">
            {feature.details.map((detail, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className={cn('w-4 h-4 shrink-0 mt-0.5', feature.accent)} />
                <span className="text-sm text-foreground/80 font-medium leading-relaxed">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── الصفحة الرئيسية ─────────────── */
const FeaturesPage = () => {
  const navigate = useNavigate();
  const [expandAll, setExpandAll] = useState(false);

  return (
    <MainLayout>
      <div className="min-h-screen bg-background" dir="rtl">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-12 pb-10 md:pt-20 md:pb-16">
          {/* خلفية زخرفية */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[120px]" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="max-w-3xl mx-auto text-center">

              {/* شارة */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-black text-primary">١٠ مزايا حصرية</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4 leading-tight">
                كل ما يميّز{' '}
                <span className="text-transparent bg-clip-text" style={{
                  backgroundImage: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))'
                }}>
                  الباحث القانوني
                </span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground font-bold leading-relaxed mb-8 max-w-xl mx-auto">
                منصة تعليمية متكاملة بُنيت خصيصاً لطلاب القانون في جامعة صنعاء — من بنك الأسئلة حتى التحدي الجماعي الحي
              </p>

              {/* أزرار */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/levels')}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl font-black text-white text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }}
                >
                  ابدأ الاختبار الآن
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/diagnostic')}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl font-black text-sm border border-border hover:bg-muted transition-all"
                >
                  <Brain className="w-4 h-4 text-rose-500" />
                  جرّب التشخيصي
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-y border-border bg-muted/30">
          <div className="container mx-auto px-4 md:px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="text-center">
                    <Icon className={cn('w-5 h-5 mx-auto mb-1', s.color)} />
                    <p className="text-2xl font-black text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground font-semibold">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── المزايا ── */}
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">

            {/* عنوان القسم + توسيع */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-foreground">جميع المزايا</h2>
              <button
                onClick={() => setExpandAll(!expandAll)}
                className="flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {expandAll ? 'طيّ الكل' : 'عرض الكل'}
              </button>
            </div>

            {/* البطاقات */}
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
        <section className="py-10 md:py-14 bg-muted/30 border-t border-border">
          <div className="container mx-auto px-4 md:px-6 max-w-2xl">
            <h2 className="text-xl font-black text-center text-foreground mb-8">ما يميّزنا عن غيرنا</h2>
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
                  <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/40">
                    <span className="text-slate-400 shrink-0 mt-0.5 text-sm">✕</span>
                    <span className="text-xs font-medium text-muted-foreground leading-relaxed">{row.them}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }}>
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
                جاهز تبدأ؟
              </h2>
              <p className="text-muted-foreground font-bold mb-7">
                لا تسجيل، لا اشتراك — فقط ادخل اسمك وابدأ
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/levels')}
                  className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-2xl font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }}
                >
                  ابدأ الاختبار
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/progress')}
                  className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-2xl font-black text-sm border border-border hover:bg-muted transition-all"
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

/* ─────────────── بطاقة قابلة للتوسيع مع دعم forceOpen ─────────────── */
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

  return (
    <div
      className={cn(
        'group rounded-3xl border transition-all duration-300 overflow-hidden',
        feature.bg, feature.border,
        isOpen ? 'shadow-xl' : 'hover:shadow-lg hover:-translate-y-0.5'
      )}
    >
      <button
        onClick={() => setLocalOpen(!localOpen)}
        className="w-full text-right p-5 md:p-6 flex items-start gap-4"
      >
        <div className={cn(
          'shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-md',
          feature.color
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn(
              'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
              feature.bg, feature.accent, feature.border
            )}>
              {feature.tag}
            </span>
            <h3 className="font-black text-base text-foreground">{feature.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">{feature.short}</p>
        </div>
        <ChevronDown className={cn(
          'shrink-0 w-5 h-5 mt-1 transition-transform duration-300',
          feature.accent,
          isOpen ? 'rotate-180' : ''
        )} />
      </button>

      {isOpen && (
        <div className="px-5 md:px-6 pb-5 md:pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-t border-current/10 pt-4 space-y-2">
            {feature.details.map((detail, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className={cn('w-4 h-4 shrink-0 mt-0.5', feature.accent)} />
                <span className="text-sm text-foreground/80 font-medium leading-relaxed">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturesPage;
