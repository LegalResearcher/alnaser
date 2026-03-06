import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Award, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--secondary)/0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-4 py-20 lg:py-32 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
            <Award className="w-4 h-4" />
            <span>المنصة الأولى للباحث القانوني</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up">
            اختبر معرفتك القانونية
            <br />
            <span className="text-gradient-primary">وطور مهاراتك</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
            منصة تفاعلية متكاملة تضم أكثر من 5000 سؤال في مختلف مجالات القانون، مصممة لمساعدتك في التحضير للامتحانات والارتقاء بمستواك المهني.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Link to="/levels">
              <Button size="lg" className="gradient-primary text-primary-foreground border-0 shadow-xl hover:shadow-2xl transition-all gap-2 text-lg px-8 py-6">
                ابدأ الآن
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/#about">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6">
                <BookOpen className="w-5 h-5" />
                تعرف علينا
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: BookOpen, label: '+5000 سؤال', sublabel: 'متنوع ومحدث' },
              { icon: Users, label: '4 مستويات', sublabel: 'تدريجية' },
              { icon: Award, label: '43 مادة', sublabel: 'قانونية' },
              { icon: CheckCircle, label: 'نتائج فورية', sublabel: 'مع التصحيح' },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50 card-hover"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-bold text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
