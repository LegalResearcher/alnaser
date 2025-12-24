import { Scale, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#050a15] text-slate-300 border-t border-white/5 mt-auto overflow-hidden">
      {/* لمسة جمالية: إضاءة خلفية خافتة في الزاوية */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Brand Section - 4 columns */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/20">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white tracking-tight">الباحث القانوني</span>
                <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">Professional Excellence</span>
              </div>
            </div>
            
            <p className="text-slate-400 leading-relaxed text-lg max-w-md">
              المنصة الرائدة في تمكين الكوادر القانونية. نسخر تقنيات التعلم الحديثة لنقدم لك تجربة اختبارات تفاعلية تحاكي الواقع وتضمن لك التفوق.
            </p>

            {/* Social Icons - ضرورية للمظهر العالمي */}
            <div className="flex items-center gap-4 pt-4">
              {[
                { Icon: Twitter, href: "#" },
                { Icon: Linkedin, href: "#" },
                { Icon: Facebook, href: "#" },
                { Icon: Instagram, href: "#" }
              ].map((social, index) => (
                <a 
                  key={index} 
                  href={social.href} 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 group"
                >
                  <social.Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links - 3 columns */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold text-lg mb-8 relative inline-block">
              روابط سريعة
              <span className="absolute -bottom-2 right-0 w-8 h-1 bg-primary rounded-full" />
            </h4>
            <ul className="space-y-4">
              {[
                { to: "/", label: "الرئيسية" },
                { to: "/levels", label: "المستويات الدراسية" },
                { to: "/#faq", label: "الأسئلة الشائعة" },
                { to: "/admin/login", label: "بوابة الإدارة" }
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="flex items-center group text-slate-400 hover:text-white transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 ml-3 group-hover:w-3 group-hover:bg-primary transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details - 4 columns */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-bold text-lg mb-8 relative inline-block">
              تواصل مباشر
              <span className="absolute -bottom-2 right-0 w-8 h-1 bg-primary rounded-full" />
            </h4>
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-5">
              <a href="mailto:info@legal-researcher.com" className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">البريد الإلكتروني</p>
                  <p className="text-sm font-medium text-slate-200">info@legal-researcher.com</p>
                </div>
              </a>
              
              <a href="tel:+966501234567" className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">رقم الهاتف</p>
                  <p className="text-sm font-medium text-slate-200 text-left" dir="ltr">+966 50 123 4567</p>
                </div>
              </a>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">المقر الرئيسي</p>
                  <p className="text-sm font-medium text-slate-200">المملكة العربية السعودية</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <p>© {currentYear} الباحث القانوني. جميع الحقوق محفوظة.</p>
          
          <div className="flex items-center gap-8">
            <Link to="/privacy" className="hover:text-primary transition-colors">سياسة الخصوصية</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">شروط الاستخدام</Link>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              حالة النظام: متصل
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
