import { MainLayout } from '@/components/layout/MainLayout';
import { PrivacySEO } from '@/components/seo/SEOHead';
import { ShieldCheck, Database, Cookie, Globe, UserCheck, Mail } from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: 'البيانات التي نجمعها',
    content: `المنصة لا تطلب منك أي بيانات شخصية لاستخدامها. الشيء الوحيد الذي قد يُسجَّل هو:
• الاسم الذي تختار كتابته عند بدء الاختبار — وهو اختياري تماماً ويمكن أن يكون أي اسم أو لقب.
• نتائج الاختبارات (الدرجة، المادة، الوقت) بشكل مجهول الهوية تماماً — لا يمكن ربطها بشخص حقيقي.
• إحصائيات الصفحات المزارة بشكل إجمالي لتحسين أداء المنصة، دون تتبع أي مستخدم بعينه.
باختصار: أنت مجهول الهوية بالكامل من لحظة دخولك حتى مغادرتك.`,
  },
  {
    icon: Globe,
    title: 'كيف نستخدم بياناتك',
    content: `نستخدم البيانات المجمّعة للأغراض التالية فقط:
• تقديم تجربة اختبار مخصصة وعرض النتائج.
• تحسين جودة الأسئلة والمحتوى التعليمي بناءً على الإحصائيات.
• مراقبة أداء المنصة وضمان استقرارها التقني.
لا نبيع أو نشارك بياناتك مع أي طرف ثالث لأغراض تجارية.`,
  },
  {
    icon: Cookie,
    title: 'ملفات تعريف الارتباط (Cookies)',
    content: `تستخدم المنصة ملفات تعريف الارتباط الضرورية فقط لضمان عمل الموقع بشكل صحيح، مثل:
• تخزين تفضيلات المظهر (الوضع الفاتح/الداكن).
• تخزين بيانات الاختبارات مؤقتاً على جهازك لتحسين تجربتك.
لا نستخدم ملفات تعريف ارتباط إعلانية أو تتبعية، ولا يوجد أي نظام تسجيل دخول للمستخدمين العاديين.`,
  },
  {
    icon: ShieldCheck,
    title: 'الخدمات الخارجية وحماية البيانات',
    content: `نعتمد على بنية تحتية سحابية آمنة لتخزين بيانات المنصة. جميع الاتصالات مشفرة عبر بروتوكول HTTPS. نلتزم بأفضل الممارسات الأمنية، بما في ذلك:
• تشفير البيانات أثناء النقل والتخزين.
• سياسات صارمة للتحكم في الوصول تمنع أي وصول غير مخوّل.
• البيانات المحفوظة (نتائج الاختبارات والإحصائيات) مجهولة الهوية ولا يمكن نسبتها لأي شخص بعينه.`,
  },
  {
    icon: UserCheck,
    title: 'حقوقك كمستخدم',
    content: `المنصة مبنية من الأساس على مبدأ الخصوصية الكاملة — لا حسابات، لا كلمات مرور، لا بيانات شخصية مطلوبة.

الشيء الوحيد الذي قد تُدخله هو اسمك عند بدء الاختبار، وهذا اختياري تماماً ولا يُربط بأي هوية حقيقية.

ببساطة:
• لا نعرف من أنت.
• لا نملك أي صلاحية للوصول إلى جهازك أو بياناتك الشخصية.
• لا يوجد ما يمكن "حذفه" لأننا لا نحتفظ بشيء يخصك أصلاً.
• يمكنك استخدام المنصة بالكامل باسم مستعار أو بدون اسم.

المنصة أداة تعليمية مفتوحة — أنت تستخدمها وتغادر دون أن تترك أثراً يدل عليك.`,
  },
  {
    icon: Mail,
    title: 'تواصل معنا',
    content: `لأي استفسار يتعلق بسياسة الخصوصية أو حماية بياناتك، يمكنك التواصل معنا عبر:
• البريد الإلكتروني: info@alnasser-tech.com
• الموقع: الجمهورية اليمنية، صنعاء
نلتزم بالرد على جميع الاستفسارات خلال 48 ساعة عمل.`,
  },
];

const Privacy = () => (
  <MainLayout>
    <PrivacySEO />
    <section className="py-12 md:py-24 min-h-[calc(100vh-80px)]">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">

        {/* Header */}
        <div className="text-center mb-12 md:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em]">
            <ShieldCheck className="w-4 h-4" />
            حماية البيانات
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
            سياسة <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">الخصوصية</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            نحن في <strong>منصة الناصر — الباحث القانوني</strong> نحترم خصوصيتك ونلتزم بحماية بياناتك وفقًا لأفضل الممارسات.
          </p>
          <p className="text-xs text-muted-foreground">
            آخر تحديث: {new Date().toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-6 md:p-8 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <section.icon className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg md:text-xl font-bold text-foreground">{section.title}</h2>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm md:text-base">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  </MainLayout>
);

export default Privacy;