import { Scale, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">الباحث القانوني</span>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              منصة تعليمية متخصصة في اختبارات الباحث القانوني، نقدم أفضل الاختبارات التفاعلية لمساعدتك في التحضير للامتحانات بكفاءة عالية.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/levels" className="text-muted-foreground hover:text-primary transition-colors">
                  المستويات
                </Link>
              </li>
              <li>
                <Link to="/#faq" className="text-muted-foreground hover:text-primary transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-muted-foreground hover:text-primary transition-colors">
                  لوحة التحكم
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@legal-researcher.com</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span dir="ltr">+966 50 123 4567</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>المملكة العربية السعودية</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} الباحث القانوني. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
