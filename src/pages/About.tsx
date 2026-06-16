/**
 * منصة الناصر القانونية
 * Page: About — عن المنصة
 */

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Scale, BookOpen, Target, Users, Award, Code2,
  MapPin, GraduationCap, Phone, Mail, Library,
  Swords, MessageSquare, Zap, ChevronLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <MainLayout>
      <section className="py-12 md:py-24 min-h-screen bg-slate-50/50" dir="rtl">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">

          {/* ── Header ── */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-5">
              <Scale className="w-4 h-4" />
              عن المنصة
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              منصة{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                الناصر القانونية
              </span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              منصة رقمية مستقلة تضم أكثر من 25,000 سؤال مؤتمت ومكتبة قانونية متكاملة لتدريب وتقييم طلاب الشريعة والقانون — تتضمن أقساماً مجانية ومدفوعة.
            </p>
          </div>

          {/* ── صاحب المنصة ── */}
          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-8 md:p-12 text-white mb-10 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-6 text-4xl font-black">
                م
              </div>
              <p className="text-white/60 text-xs font-black uppercase tracking-[0.3em] mb-2">المؤسس والمطور القانوني</p>
              <h2 className="text-3xl md:text-4xl font-black mb-2">أ. معين الناصر</h2>
              <p className="text-white/70 font-bold text-sm mb-6">مؤسس منصة الناصر القانونية</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-bold">
                ⚖️ ​منصة رقمية مستقلة لتدريب وتقييم طلاب الشريعة والقانون
              </div>
            </div>
          </div>

          {/* ── من نحن ── */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-10 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-black text-slate-900">من نحن</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-base">
              منصة الناصر القانونية هي منصة رقمية مستقلة متخصصة في التدريب القانوني وأتمتة مراجعة الاختبارات لطلاب الشريعة والقانون في اليمن. تم تطوير المنصة كأداة تقنية مساعدة بإشراف وإعداد المؤسس والمطور القانوني: أ. معين الناصر، لتمكين الطلاب والباحثين من تقييم قدراتهم وتطوير ملكتهم القانونية عبر بيئة تفاعلية ذكية.
            </p>
            <p className="text-slate-600 leading-relaxed text-base mt-4">
              تتيح المنصة للمستخدمين الاستفادة من خدماتها عبر مسارات مرنة تشمل أقساماً مجانية بالكامل تضمن حق الوصول المعرفي الأساسي للجميع، إلى جانب أقسام وخدمات متقدمة مدفوعة توفر مزايا تدريبية مخصصة وأنظمة مراجعة أعمق للمشتركين.
            </p>
          </div>

          {/* ── رسالة المنصة ── */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-10 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-black text-slate-900">رسالة المنصة</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-base">
              الابتكار في تقديم حلول تدريبية تقنية مستقلة تخدم مجتمع باحثي وطلاب الشريعة والقانون. نحن ملتزمون بتوفير أدوات تقييم ذكية تعتمد على "الاختبار والمراجعة" كمبدأ أساسي لقياس الجاهزية المعرفية، مع فتح آفاق التطوير أمام الجميع عبر أقسامنا المجانية والمدفوعة، وتحفيز الطلاب وتكريمهم معنوياً احتفاءً بتقدمهم المعرفي وتميزهم .
            </p>
          </div>

          {/* ── الخدمات والميزات ── */}
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900 mb-4 px-1">خدمات وميزات المنصة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: BookOpen,
                  title: '+25,000 سؤال قانوني',
                  desc: 'بنك أسئلة ضخم مصمم بدقة لمحاكاة الامتحانات الرسمية وتغطية كافة فروع القانون',
                  color: 'bg-blue-50 text-blue-600',
                },
                {
                  icon: Library,
                  title: 'المكتبة القانونية الرقمية',
                  desc: 'مكتبة متكاملة ومؤرشفة تقنياً للمراجع والوثائق القانونية والقضائية',
                  color: 'bg-emerald-50 text-emerald-600',
                },
                {
                  icon: Zap,
                  title: 'منهجية "الاختبار والمراجعة"',
                  desc: 'نظام تفاعلي ذكي يتيح تقييم الجاهزية المعرفية وتحديد نقاط القوة والضعف',
                  color: 'bg-amber-50 text-amber-600',
                },
                {
                  icon: Swords,
                  title: 'غرف التحدي التفاعلية',
                  desc: 'نظام تنافسي جماعي يتيح إنشاء غرف اختبار مخصصة ودعوة حتى 20 زميلاً للمنافسة',
                  color: 'bg-rose-50 text-rose-600',
                },
                {
                  icon: MessageSquare,
                  title: 'متابعة حية ودردشة فورية',
                  desc: 'مشاهدة درجات الزملاء بشكل مباشر أثناء الاختبار مع حقل دردشة للنقاش القانوني الحي',
                  color: 'bg-violet-50 text-violet-600',
                },
                {
                  icon: Award,
                  title: 'نظام شارات وإنجازات',
                  desc: 'تحفيز الطلاب وتكريمهم معنوياً احتفاءً بتقدمهم وتميزهم الأكاديمي',
                  color: 'bg-orange-50 text-orange-600',
                },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}

              {/* بطاقة ميزات إضافية — قابلة للنقر */}
              <Link to="/features" className="md:col-span-2">
                <div className="group bg-gradient-to-r from-primary/5 to-blue-600/5 hover:from-primary/10 hover:to-blue-600/10 border border-primary/20 hover:border-primary/40 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all cursor-pointer">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 mb-1">ميزات إضافية متعددة</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      بالإضافة إلى الكثير من الميزات المتقدمة — اضغط هنا لاستعراضها بالتفصيل في صفحة المزايا.
                    </p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-primary shrink-0 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>

            </div>
          </div>

          {/* ── المستويات الدراسية ── */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-10 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-black text-slate-900">التغطية الأكاديمية</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة'].map((level, i) => (
                <div key={i} className="text-center py-4 px-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-2xl font-black text-primary mb-1">{i + 1}</div>
                  <p className="text-slate-600 text-xs font-bold leading-tight">{level}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-sm mt-4 leading-relaxed">
               تغطي أدوات التقييم بالمنصة فروع الشريعة والقانون للمستويات الأربعة، عبر بنك أسئلة مؤتمت ونماذج تدريبية مبنية وفقاً للامتحانات الرسمية من عام 2020 وحتى عام 2026، مع التحديث والترقية المستمرة للأعوام المقبلة.
            </p>
          </div>

          {/* ── معلومات التواصل ── */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-black text-slate-900">الناصر تِك للحلول الرقمية</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span className="font-bold text-sm">الجمهورية اليمنية، صنعاء</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href="mailto:info@alnaseer.org" className="font-bold text-sm hover:text-primary transition-colors">
                  info@alnaseer.org
                </a>
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="text-center">
            <Link to="/levels">
              <button className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <BookOpen className="w-5 h-5" />
                ابدأ الاختبار الآن
              </button>
            </Link>
          </div>

        </div>
      </section>
    </MainLayout>
  );
};

export default About;
