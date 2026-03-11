/**
 * Alnasser Tech Digital Solutions
 * Page: About — عن المنصة
 */

import { MainLayout } from '@/components/layout/MainLayout';
import { Scale, BookOpen, Target, Users, Award, Code2, MapPin, GraduationCap } from 'lucide-react';
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
                الباحث القانوني
              </span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              المنصة الأولى المتخصصة في اختبارات الشريعة والقانون لطلاب اليمن
            </p>
          </div>

          {/* ── صاحب المنصة ── */}
          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-8 md:p-12 text-white mb-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }} />
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-6 text-4xl font-black">
                م
              </div>
              <p className="text-white/60 text-xs font-black uppercase tracking-[0.3em] mb-2">إعداد وتطوير</p>
              <h2 className="text-3xl md:text-4xl font-black mb-2">أ. معين الناصر</h2>
              <p className="text-white/70 font-bold text-sm mb-6">مؤسس منصة الباحث القانوني — الرئيس التنفيذي لشركة الناصر تِك للحلول الرقمية</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-bold">
                ⚖️ مجهود شخصي لخدمة طلاب الشريعة والقانون
              </div>
            </div>
          </div>

          {/* ── نبذة شخصية ── */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-10 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-black text-slate-900">نبذة تعريفية</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-base">
              أ. معين الناصر، مؤسس منصة الباحث القانوني والرئيس التنفيذي لشركة الناصر تِك للحلول الرقمية، متخصص في تطوير المواقع الإلكترونية والمنصات التعليمية الرقمية. أسس منصة الباحث القانوني كمبادرة شخصية لخدمة طلاب الشريعة والقانون في اليمن، وتزويدهم بأدوات تعليمية تفاعلية مطابقة لنماذج الاختبارات الرسمية من عام 2020 إلى 2025، سعياً لرفع المستوى الأكاديمي والمهني للباحثين القانونيين وتمكينهم من الاستعداد الأمثل لاختباراتهم في أي وقت ومن أي مكان.
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
              نسعى إلى توفير بيئة تعليمية تفاعلية متكاملة تُمكّن طلاب الشريعة والقانون في اليمن من اختبار معرفتهم وتطوير مهاراتهم في مختلف فروع القانون، من خلال نماذج اختبارات مطابقة للامتحانات الرسمية من عام 2020 إلى 2025.
            </p>
          </div>

          {/* ── ما يميز المنصة ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { icon: BookOpen, title: '+5000 سؤال', desc: 'مراجع ومحدَّث باستمرار في جميع فروع القانون', color: 'bg-blue-50 text-blue-600' },
              { icon: GraduationCap, title: '4 مستويات دراسية', desc: 'تغطي جميع مواد الشريعة والقانون', color: 'bg-emerald-50 text-emerald-600' },
              { icon: Award, title: 'نظام شارات وإنجازات', desc: 'يحفّزك على الاستمرار والتطور المستمر', color: 'bg-amber-50 text-amber-600' },
              { icon: Users, title: 'مجاني للجميع', desc: 'متاح لجميع طلاب الشريعة والقانون بدون أي رسوم', color: 'bg-violet-50 text-violet-600' },
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
