/**
 * ContactSection.tsx — تصميم عالمي dark موحّد
 */
import { useState } from 'react';
import { Send, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CONTACTS = [
  { icon: Mail,    title: 'البريد الإلكتروني', detail: 'info@alnaseer.org',        href: 'mailto:info@alnaseer.org', color: 'hsl(217 91% 60%)' },
  { icon: Phone,   title: 'الدعم المباشر',     detail: '+967 ...',                 href: 'tel:+967',                 color: '#34d399',          ltr: true },
  { icon: MapPin,  title: 'المقر الرئيسي',     detail: 'صنعاء — الجمهورية اليمنية', href: '#',                       color: '#f87171'           },
];

export function ContactSection() {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.target as HTMLFormElement;
    const data = {
      name:    (form.elements.namedItem('name')    as HTMLInputElement).value,
      email:   (form.elements.namedItem('email')   as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };
    try {
      const res = await fetch(
        'https://tozmmphymxiamvdxfmjv.supabase.co/functions/v1/send-contact',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
      );
      if (res.ok) {
        toast({ title: 'تم إرسال رسالتك بنجاح ✅', description: 'سنتواصل معك في أقرب وقت ممكن' });
        form.reset();
      } else throw new Error();
    } catch {
      toast({ title: 'حدث خطأ أثناء الإرسال', description: 'حاول مرة أخرى أو تواصل مباشرة', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 52, borderRadius: 12, padding: '0 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit', direction: 'rtl',
  };

  return (
    <section
      id="contact"
      dir="rtl"
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, #080f20 0%, #070d1a 100%)',
        padding: '96px 0 80px',
      }}
    >
      {/* شبكة */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* خط علوي */}
      <div className="absolute top-0 inset-x-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.25), transparent)',
      }} />

      {/* توهج ذهبي */}
      <div className="absolute pointer-events-none" style={{
        bottom: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300,
        background: 'radial-gradient(ellipse, rgba(200,168,75,0.06) 0%, transparent 70%)',
        filter: 'blur(50px)',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{
            background: 'rgba(200,168,75,0.1)',
            border: '1px solid rgba(200,168,75,0.2)',
          }}>
            <MessageSquare style={{ width: 13, height: 13, color: '#c8a84b' }} />
            <span style={{ fontSize: 11, color: '#c8a84b', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              تواصل معنا
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 16,
          }}>
            نحن هنا{' '}
            <span style={{
              background: 'linear-gradient(135deg, #c8a84b, #f0d080)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              لأجلك دائماً
            </span>
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', lineHeight: 1.8, maxWidth: 480, margin: '0 auto' }}>
            هل لديك استفسار أو مشكلة تقنية؟ فريقنا جاهز للمساعدة
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'start' }}>

          {/* معلومات التواصل */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>
              معلومات التواصل
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CONTACTS.map((c, i) => (
                <a
                  key={i}
                  href={c.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '18px 20px', borderRadius: 16, textDecoration: 'none',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLElement).style.borderColor = `${c.color}40`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${c.color}15`, border: `1px solid ${c.color}30`,
                  }}>
                    <c.icon style={{ width: 18, height: 18, color: c.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                      {c.title}
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.8)', direction: c.ltr ? 'ltr' : 'rtl' }}>
                      {c.detail}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            {/* بطاقة وقت الاستجابة */}
            <div style={{
              marginTop: 20, padding: '16px 20px', borderRadius: 16,
              background: 'rgba(99,149,255,0.06)',
              border: '1px solid rgba(99,149,255,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', animation: 'contact-pulse 2s infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                  متوسط وقت الاستجابة:{' '}
                  <span style={{ color: '#34d399', fontWeight: 800 }}>أقل من 24 ساعة</span>
                </span>
              </div>
            </div>
          </div>

          {/* نموذج التواصل */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24, padding: '36px 32px',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>
              أرسل رسالتك
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                    الاسم الكامل
                  </label>
                  <input name="name" placeholder="أدخل اسمك" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(99,149,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                    البريد الإلكتروني
                  </label>
                  <input name="email" type="email" placeholder="example@email.com" required dir="ltr"
                    style={{ ...inputStyle, textAlign: 'right' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(99,149,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                  عنوان الرسالة
                </label>
                <input name="subject" placeholder="ما الذي تود مناقشته؟" required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(99,149,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                  تفاصيل الرسالة
                </label>
                <textarea
                  name="message" placeholder="اكتب رسالتك هنا..." required rows={4}
                  style={{
                    ...inputStyle, height: 'auto', padding: '14px 16px',
                    resize: 'none', lineHeight: 1.7,
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(99,149,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  height: 56, borderRadius: 14, border: 'none', cursor: submitting ? 'wait' : 'pointer',
                  background: submitting
                    ? 'rgba(255,255,255,0.1)'
                    : 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))',
                  color: '#fff', fontSize: 15, fontWeight: 800,
                  boxShadow: submitting ? 'none' : '0 8px 32px rgba(59,130,246,0.35)',
                  transition: 'all 0.25s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  if (!submitting) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {submitting ? (
                  <>
                    <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'contact-spin 0.8s linear infinite' }} />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    إرسال الرسالة
                    <Send style={{ width: 17, height: 17 }} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* خط سفلي */}
        <div style={{
          marginTop: 64, paddingTop: 32,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
            © {new Date().getFullYear()} منصة الناصر القانونية — جميع الحقوق محفوظة
          </p>
        </div>
      </div>

      <style>{`
        @keyframes contact-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
        @keyframes contact-spin  { to{transform:rotate(360deg)} }
      `}</style>
    </section>
  );
}
