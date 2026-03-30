import { Scale, Code2 } from 'lucide-react';
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
            
            <p className="text-slate-400 dark:text-muted-foreground leading-relaxed text-lg max-w-md">
              منصة تعليمية متطورة تابعة لـ <strong>الناصر تِك</strong>، نهدف من خلالها إلى تطويع الحلول الرقمية لخدمة طلاب الشريعة والقانون في اليمن.
            </p>

            {/* صاحب المنصة */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/10 bg-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-black text-white text-xl shrink-0 font-cairo">
                م
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-muted-foreground font-black uppercase tracking-widest mb-0.5">إعداد وتطوير</p>
                <p className="text-white font-black text-base">أ. معين الناصر</p>
              </div>
            </div>

            {/* أيقونات التواصل الاجتماعي */}
            <div className="flex items-center gap-3 pt-4 flex-wrap">
              {[
                {
                  label: "Telegram",
                  href: `https://t.me/share/url?url=${encodeURIComponent('https://alnaseer.org')}&text=${encodeURIComponent('منصة الباحث القانوني - أكبر منصة لتحضير الاختبارات القانونية في اليمن')}`,
                  color: "hover:bg-[#229ED9]",
                  svg: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  )
                },
                {
                  label: "WhatsApp",
                  href: `https://wa.me/?text=${encodeURIComponent('منصة الباحث القانوني - أكبر منصة لتحضير الاختبارات القانونية في اليمن\nhttps://alnaseer.org')}`,
                  color: "hover:bg-[#25D366]",
                  svg: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                  )
                },
                {
                  label: "Instagram",
                  href: `https://www.instagram.com/share?url=${encodeURIComponent('https://alnaseer.org')}`,
                  color: "hover:bg-gradient-to-br hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045]",
                  svg: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                  )
                },
                {
                  label: "Facebook",
                  href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://alnaseer.org')}`,
                  color: "hover:bg-[#1877F2]",
                  svg: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )
                },
                {
                  label: "LinkedIn",
                  href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://alnaseer.org')}`,
                  color: "hover:bg-[#0A66C2]",
                  svg: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  )
                },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.label}
                  className={`w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300 hover:scale-110 hover:border-transparent hover:shadow-lg ${social.color}`}
                >
                  {social.svg}
                </a>
              ))}
            </div>

            {/* رابط قناة تيليغرام */}
            <a
              href="https://t.me/muen2025"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 mt-2 px-4 py-2.5 rounded-2xl bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] hover:bg-[#229ED9]/20 transition-all duration-300 hover:scale-[1.02] group w-fit"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="text-sm font-bold">قناة الباحث القانوني</span>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2 shrink-0 opacity-60 group-hover:translate-x-[-2px] transition-transform" style={{strokeLinecap:'round',strokeLinejoin:'round'}}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>
              </svg>
            </a>
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
                { to: "/about", label: "عن المنصة" },
                { to: "/privacy", label: "الخصوصية" }
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="flex items-center group text-slate-400 dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 ml-3 group-hover:w-4 group-hover:bg-primary transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* سطر الحقوق الرسمي والنهائي */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
             <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800 dark:bg-card/5 border border-white/5 text-sm">
                <Code2 className="w-4 h-4 text-primary" />
                <span className="text-slate-400 dark:text-muted-foreground font-medium">تطوير وتشغيل:</span>
                <span className="text-white font-black italic">الناصر تِك Alnasser Tech</span>
             </div>
             
             <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed">
               © {currentYear} <span className="text-slate-300 font-bold">الناصر تِك للحلول الرقمية (Alnasser Tech Digital Solutions)</span>. جميع الحقوق محفوظة.
             </p>
          </div>
          
        </div>
      </div>
    </footer>
  );
}