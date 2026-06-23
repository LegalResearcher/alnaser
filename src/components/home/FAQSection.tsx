/**
 * FAQSection.tsx — dark موحّد، accordion بدون مكتبة خارجية
 */
import { useState } from 'react';
import { Plus, Minus, HelpCircle, ArrowLeft } from 'lucide-react';

const faqs = [
  { q: 'ما هي منصة الناصر القانونية؟', a: 'منصة رقمية مستقلة تضم أكثر من 25,000 سؤال مؤتمت ومكتبة قانونية متكاملة — مصممة لخدمة وتدريب طلاب الشريعة والقانون، ودعم المحامين والباحثين في تطوير ملكتهم المعرفية والقضائية.' },
  { q: 'كيف أبدأ الاختبار؟', a: 'اختر المستوى المناسب، ثم المادة التي تريد اختبارها، وأدخل اسمك لبدء الاختبار. ستحصل على نتيجتك فور الانتهاء مع مراجعة تفصيلية لكل إجابة.' },
  { q: 'هل الاختبارات مجانية؟', a: 'نعم، جميع الاختبارات متاحة مجاناً لجميع المستخدمين. نهدف إلى توفير أفضل المصادر التعليمية للباحثين القانونيين دون أي تكلفة.' },
  { q: 'كيف يتم تحديد درجة النجاح؟', a: 'تختلف درجة النجاح حسب كل مادة، وعادةً ما تكون 60% من إجمالي الأسئلة. يمكنك معرفة الدرجة المطلوبة قبل بدء كل اختبار.' },
  { q: 'هل يمكنني مراجعة إجاباتي بعد الاختبار؟', a: 'نعم، بعد الانتهاء يمكنك مراجعة جميع إجاباتك مع الإجابات الصحيحة والتفسيرات الإرشادية لكل سؤال.' },
  { q: 'ما هي نماذج سنوات الاختبار المتاحة؟', a: 'نوفر نماذج من سنوات 2020–2026 لكل مادة، مما يتيح التدرب على أسئلة متنوعة وفهم أنماط الاختبارات المختلفة.' },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const num = String(index + 1).padStart(2, '0');

  return (
    <div style={{
      background: open ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${open ? 'rgba(99,149,255,0.28)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 18,
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}
      >
        <span style={{
          flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900, letterSpacing: '0.05em',
          color: open ? '#fff' : 'rgba(255,255,255,0.25)',
          background: open ? 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' : 'rgba(255,255,255,0.05)',
          border: open ? 'none' : '1px solid rgba(255,255,255,0.08)',
          transition: 'all 0.3s ease',
          fontFamily: 'inherit',
        }}>{num}</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: open ? '#fff' : 'rgba(255,255,255,0.72)', lineHeight: 1.5, transition: 'color 0.2s', fontFamily: 'inherit' }}>
          {q}
        </span>
        <span style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'rgba(99,149,255,0.18)' : 'rgba(255,255,255,0.04)',
          color: open ? 'hsl(217 91% 75%)' : 'rgba(255,255,255,0.25)',
          transition: 'all 0.3s ease',
        }}>
          {open ? <Minus style={{ width: 13, height: 13 }} /> : <Plus style={{ width: 13, height: 13 }} />}
        </span>
      </button>
      <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
        <p style={{ padding: '0 24px 22px 24px', paddingRight: 74, fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.9, margin: 0 }}>
          {a}
        </p>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" dir="rtl" style={{ position: 'relative', overflow: 'hidden', background: '#07101e', padding: '96px 0 80px' }}>

      {/* شبكة خلفية */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

      {/* خط أعلى */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,149,255,0.25), transparent)', pointerEvents: 'none' }} />

      {/* توهج */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(99,149,255,0.05) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, marginBottom: 20, background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.18)' }}>
            <HelpCircle style={{ width: 12, height: 12, color: 'hsl(217 91% 72%)' }} />
            <span style={{ fontSize: 11, color: 'hsl(217 91% 72%)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>الأسئلة الشائعة</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 14, marginTop: 0 }}>
            لديك{' '}
            <span style={{ background: 'linear-gradient(135deg, hsl(217 91% 68%), hsl(160 84% 52%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              تساؤلات؟
            </span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.32)', lineHeight: 1.8, maxWidth: 460, margin: '0 auto' }}>
            أجوبة مباشرة لأكثر الأسئلة شيوعاً حول المنصة وطريقة الاستخدام
          </p>
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} index={i} />)}
        </div>

        {/* CTA أسفل */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>لم تجد إجابتك؟</span>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <a href="#contact" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: 'hsl(217 91% 72%)', textDecoration: 'none' }}>
              تواصل معنا مباشرة
              <ArrowLeft style={{ width: 13, height: 13 }} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
