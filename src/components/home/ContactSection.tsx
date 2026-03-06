import { useState } from 'react';
import { Send, Mail, Phone, MapPin, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'تم إرسال رسالتك بنجاح',
      description: 'سنتواصل معك في أقرب وقت ممكن عبر بريدك الإلكتروني',
    });
    
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  return (
    <section className="py-24 relative overflow-hidden bg-white" id="contact">
      {/* عناصر جمالية في الخلفية */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Section Header - تصميم عصري مع شارة */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em]">
            <Sparkles className="w-3.5 h-3.5" />
            مركز الدعم والمساندة
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            نحن هنا <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">لأجلك دائماً</span>
          </h2>
          <p className="text-slate-500 text-lg md:text-xl">
            هل لديك استفسار حول المواد القانونية أو تواجه مشكلة تقنية؟ فريقنا المختص جاهز لمساعدتك.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-16 max-w-6xl mx-auto items-start">
          
          {/* Contact Info (5 Columns) */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-primary" />
                معلومات التواصل
              </h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                نسعى لتوفير بيئة تعليمية متكاملة، تواصلك معنا يساعدنا على تطوير المنصة بما يخدم تطلعاتك المهنية.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Mail, title: 'البريد الإلكتروني', detail: 'info@legal-researcher.com', href: 'mailto:info@legal-researcher.com' },
                { icon: Phone, title: 'الدعم المباشر', detail: '+967 ', href: 'tel:+967' },
                { icon: MapPin, title: 'المقر الرئيسي', detail: 'صنعاء-الجمهورية اليمنية', href: '#' }
              ].map((item, idx) => (
                <a 
                  key={idx}
                  href={item.href}
                  className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.title}</p>
                    <p className={cn("text-lg font-bold text-slate-700", item.icon === Phone && "text-left")} dir={item.icon === Phone ? "ltr" : "rtl"}>
                      {item.detail}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Form (7 Columns) - تصميم البطاقة الطافية */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 relative overflow-hidden group">
              {/* لمسة لونية جانبية للمودرن ديزاين */}
              <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary to-blue-500 opacity-20" />
              
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-bold text-slate-700 mr-1">الاسم الكامل</Label>
                    <Input
                      id="name"
                      placeholder="أدخل اسمك"
                      required
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-bold text-slate-700 mr-1">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      required
                      dir="ltr"
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-right"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="subject" className="text-sm font-bold text-slate-700 mr-1">عنوان الرسالة</Label>
                  <Input
                    id="subject"
                    placeholder="ما الذي تود مناقشته؟"
                    required
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-sm font-bold text-slate-700 mr-1">تفاصيل الرسالة</Label>
                  <Textarea
                    id="message"
                    placeholder="اكتب رسالتك هنا بكل وضوح..."
                    required
                    rows={4}
                    className="rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all resize-none p-4"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 gap-3"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">جاري الإرسال <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></span>
                  ) : (
                    <>
                      إرسال الرسالة الآن
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
