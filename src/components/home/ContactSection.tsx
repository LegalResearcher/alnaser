/**
 * ContactSection.tsx — dark موحّد، نموذج تواصل احترافي
 */
import { useState } from 'react';
import { Send, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CONTACTS = [
  { icon: Mail,   title: 'البريد الإلكتروني', detail: 'info@alnaseer.org',          href: 'mailto:info@alnaseer.org', color: 'hsl(217 91% 62%)' },
  { icon: Phone,  title: 'تيليغرام',           detail: 't.me/MuenAlnaser',           href: 'https://t.me/MuenAlnaser', color: '#34d399', ltr: true },
  { icon: MapPin, title: 'المقر الرئيسي',      detail: 'صنعاء — الجمهورية اليمنية', href: '#',                        color: '#f87171' },
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

  const inputBase: React.CSSProperties = {
    width: '100%', borderRadius: 12, padding: '0 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: '#fff', fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
    boxSizing: 'border-box', fontFamily: 'inherit', direction: 'rtl',
    height: 48,
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(99,149,255,0.45)';
    e.target.style.background  = 'rgba(255,255,255,0.07)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.09)';
    e.target.style.background  = 'rgba(255,255,255,0.04)';
  };

  return (
    <section id="contact" dir="rtl" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #07101e 0%, #070d1a 100%)', padding: '96px 0 72px' }}>

      {/* شبكة */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

      {/* خط أعلى */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.22), transparent)', pointerEvents: 'none' }} />

      {/* توهج ذهبي */}
      <div style={{ position: 'absolute', bottom: '-8%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 280, background: 'radial-gradient(ellipse, rgba(200,168,75,0.05) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, marginBottom: 20, background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.18)' }}>
            <MessageSquare style={{ width: 12, height: 12, color: '#c8a84b' }} />
            <span style={{ fontSize: 11, color: '#c8a84b', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>تواصل معنا</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 14, marginTop: 0 }}>
            نحن هنا{' '}
            <span style={{ background: 'linear-gradient(135deg, #c8a84b, #f0d080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              لأجلك دائماً
            </span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.32)', lineHeight: 1.8, maxWidth: 460, margin: '0 auto' }}>
            استفسار؟ مشكلة تقنية؟ اقتراح؟ فريقنا جاهز للمساعدة
          </p>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'start' }}>

          {/* معلومات التواصل */}
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20, marginTop: 0 }}>
              وسائل التواصل
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {CONTACTS.map((c, i) => (
                <a key={i} href={c.href} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, textDecoration: 'none', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.055)'; (e.currentTarget as HTMLElement).style.borderColor = `${c.color}35`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c.color}12`, border: `1px solid ${c.color}25` }}>
                    <c.icon style={{ width: 16, height: 16, color: c.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 3px' }}>{c.title}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: 0, direction: c.ltr ? 'ltr' : 'rtl' }}>{c.detail}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* بطاقة وقت الاستجابة */}
            <div style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', animation: 'ct-pulse 2s infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                  وقت الاستجابة المتوسط:{' '}
                  <span style={{ color: '#34d399', fontWeight: 800 }}>أقل من 24 ساعة</span>
                </span>
              </div>
            </div>
          </div>

          {/* نموذج التواصل */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: '32px 28px' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 24, marginTop: 0 }}>
              أرسل رسالتك
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, display: 'block', marginBottom: 7, letterSpacing: '0.08em' }}>الاسم الكامل</label>
                  <input name="name" placeholder="أدخل اسمك" required style={inputBase} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, display: 'block', marginBottom: 7, letterSpacing: '0.08em' }}>البريد الإلكتروني</label>
                  <input name="email" type="email" placeholder="example@email.com" required dir="ltr" style={{ ...inputBase, textAlign: 'right' }} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, display: 'block', marginBottom: 7, letterSpacing: '0.08em' }}>عنوان الرسالة</label>
                <input name="subject" placeholder="ما الذي تود مناقشته؟" required style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, display: 'block', marginBottom: 7, letterSpacing: '0.08em' }}>تفاصيل الرسالة</label>
                <textarea name="message" placeholder="اكتب رسالتك هنا..." required rows={4}
                  style={{ ...inputBase, height: 'auto', padding: '12px 14px', resize: 'none', lineHeight: 1.75 }}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>

              <button type="submit" disabled={submitting}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  height: 52, borderRadius: 12, border: 'none', cursor: submitting ? 'wait' : 'pointer',
                  background: submitting ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))',
                  color: '#fff', fontSize: 14, fontWeight: 800,
                  boxShadow: submitting ? 'none' : '0 6px 28px rgba(59,130,246,0.3)',
                  transition: 'all 0.25s ease', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                {submitting ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ct-spin 0.8s linear infinite' }} />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    إرسال الرسالة
                    <Send style={{ width: 15, height: 15 }} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', margin: 0 }}>
            © {new Date().getFullYear()} منصة الناصر القانونية — جميع الحقوق محفوظة
          </p>
        </div>
      </div>

      <style>{`
        @keyframes ct-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.8)} }
        @keyframes ct-spin  { to{transform:rotate(360deg)} }
      `}</style>
    </section>
  );
}
