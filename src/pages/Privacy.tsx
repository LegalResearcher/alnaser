import { MainLayout } from '@/components/layout/MainLayout';
import { PrivacySEO } from '@/components/seo/SEOHead';
import { ShieldCheck, Database, Cookie, Globe, UserCheck, Mail } from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: 'البيانات التي نجمعها',
    content: `نقوم بجمع الحد الأدنى من البيانات اللازمة لتشغيل المنصة بكفاءة، وتشمل:
• الاسم الذي تُدخله عند بدء الاختبار (لا يُربط بحساب شخصي).
• نتائج الاختبارات (الدرجة، عدد الأسئلة، المادة، الوقت المستغرق).
• بيانات التصفح العامة مثل الصفحات التي تمت زيارتها (لأغراض إحصائية فقط).
لا نطلب منك إنشاء حساب شخصي لاستخدام المنصة كطالب.`,
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
• الحفاظ على جلسة تسجيل الدخول للمحررين والمسؤولين.
لا نستخدم ملفات تعريف ارتباط إعلانية أو تتبعية.`,
  },
  {
    icon: ShieldCheck,
    title: 'الخدمات الخارجية وحماية البيانات',
    content: `نعتمد على بنية تحتية سحابية آمنة لتخزين البيانات ومعالجتها. جميع الاتصالات مشفرة عبر بروتوكول HTTPS. نلتزم بأفضل الممارسات الأمنية في تخزين البيانات وإدارة الوصول إليها، بما في ذلك:
• تشفير البيانات أثناء النقل والتخزين.
• سياسات صارمة للتحكم في الوصول (RLS).
• عدم تخزين كلمات مرور الطلاب (لا يوجد نظام حسابات للطلاب).`,
  },
  {
    icon: UserCheck,
    title: 'حقوقك كمستخدم',
    content: `بصفتك مستخدمًا للمنصة، يحق لك:
• معرفة البيانات التي نحتفظ بها.
• طلب حذف أي بيانات مرتبطة بك.
• الاعتراض على أي معالجة لبياناتك.
• استخدام المنصة دون الحاجة لتقديم بيانات شخصية حساسة.
يمكنك ممارسة هذه الحقوق بالتواصل معنا عبر البريد الإلكتروني.`,
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
