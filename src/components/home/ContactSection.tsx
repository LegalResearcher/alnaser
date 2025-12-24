import { useState } from 'react';
import { Send, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'تم إرسال رسالتك بنجاح',
      description: 'سنتواصل معك في أقرب وقت ممكن',
    });
    
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  return (
    <section className="py-20" id="contact">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            تواصل <span className="text-gradient-primary">معنا</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            نحن هنا للإجابة على استفساراتك ومساعدتك
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-4">معلومات التواصل</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                يسعدنا تواصلك معنا في أي وقت. فريقنا جاهز للإجابة على جميع استفساراتك ومساعدتك في رحلتك التعليمية.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">البريد الإلكتروني</p>
                  <p className="text-muted-foreground">info@legal-researcher.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">الهاتف</p>
                  <p className="text-muted-foreground" dir="ltr">+966 50 123 4567</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">الموقع</p>
                  <p className="text-muted-foreground">المملكة العربية السعودية</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card rounded-2xl border p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    placeholder="أدخل اسمك"
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    dir="ltr"
                    className="bg-background text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">الموضوع</Label>
                <Input
                  id="subject"
                  placeholder="موضوع الرسالة"
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">الرسالة</Label>
                <Textarea
                  id="message"
                  placeholder="اكتب رسالتك هنا..."
                  required
                  rows={5}
                  className="bg-background resize-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground border-0 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
