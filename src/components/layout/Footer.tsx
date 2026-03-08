import { Scale, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Code2, ShieldCheck, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#050a15] text-slate-300 border-t border-white/5 mt-auto overflow-hidden">
      {/* تأثير الإضاءة الفني - علامة الجودة الرقمية */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* قسم الهوية المؤسسية - Alnasser Tech */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/20 transition-all group-hover:rotate-6">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white tracking-tight">الباحث القانوني</span>
                <span className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Alnasser Tech Solutions</span>
              </div>
            </div>
            
            <p className="text-slate-400 leading-relaxed text-lg max-w-md">
              منصة تعليمية متطورة تابعة لـ <strong>الناصر تِك</strong>، نهدف من خلالها إلى تطويع الحلول الرقمية لخدمة المجتمع القانوني في اليمن والوطن العربي.
            </p>

            {/* أيقونات التواصل الاجتماعي */}
            <div className="flex items-center gap-4 pt-4">
              {[
                { Icon: Twitter, href: "https://twitter.com/AlnasserTech" },
                { Icon: Linkedin, href: "https://www.linkedin.com/company/alnasser-tech" },
                { Icon: Facebook, href: "https://www.facebook.com/AlnasserTech" },
                { Icon: Instagram, href: "https://www.instagram.com/AlnasserTech" }
              ].map((social, index) => (
                <a 
                  key={index} 
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 group"
                >
                  <social.Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* روابط سريعة */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold text-lg mb-8 relative inline-block">
              أقسام المنصة
              <span className="absolute -bottom-2 right-0 w-8 h-1 bg-primary rounded-full" />
            </h4>
            <ul className="space-y-4 font-medium">
              {[
                { to: "/", label: "الرئيسية" },
                { to: "/levels", label: "المستويات" },
                { to: "/privacy", label: "الخصوصية" }
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="flex items-center group text-slate-400 hover:text-primary transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 ml-3 group-hover:w-4 group-hover:bg-primary transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* معلومات المقر والاتصال - صنعاء، اليمن */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-bold text-lg mb-8 relative inline-block">
              المقر والاتصال
              <span className="absolute -bottom-2 right-0 w-8 h-1 bg-primary rounded-full" />
            </h4>
            <div className="bg-white/[0.03] backdrop-blur-sm rounded-[2rem] p-8 border border-white/5 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">الموقع الجغرافي</p>
                  <p className="text-sm font-bold text-slate-200">الجمهورية اليمنية، صنعاء</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">الدعم الفني</p>
                  <p className="text-sm font-bold text-slate-200">info@alnasser-tech.com</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 text-emerald-500" />
                 <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">موثق ومعتمد رقمياً</span>
              </div>
            </div>
          </div>
        </div>

        {/* سطر الحقوق الرسمي والنهائي */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
             <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/5 text-sm">
                <Code2 className="w-4 h-4 text-primary" />
                <span className="text-slate-400 font-medium">تطوير وتشغيل:</span>
                <span className="text-white font-black italic">الناصر تِك Alnasser Tech</span>
             </div>
             
             <p className="text-slate-500 text-sm leading-relaxed">
               © {currentYear} <span className="text-slate-300 font-bold">الناصر تِك للحلول الرقمية (Alnasser Tech Digital Solutions)</span>. جميع الحقوق محفوظة.
             </p>
          </div>
          
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
             <span>صنعاء</span>
             <span className="w-1 h-1 rounded-full bg-slate-800" />
             <span>الجمهورية اليمنية</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
