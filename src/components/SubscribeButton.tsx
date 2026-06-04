import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, Crown, CreditCard, Phone, User, Zap, BookOpen, Target, Brain, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionMessage } from '@/hooks/useSubscriptionMessage';

interface Props {
  subjectId: string;
  subjectName: string;
  levelName?: string;
}

// أيقونات ذكية لكل نوع من أسطر المزايا
const FEATURE_ICONS: Record<string, React.ReactNode> = {
  'شرح':    <BookOpen className="w-3.5 h-3.5" />,
  'تلميح':  <Brain className="w-3.5 h-3.5" />,
  'نماذج':  <Target className="w-3.5 h-3.5" />,
  'توقعات': <Zap className="w-3.5 h-3.5" />,
  'فوري':   <Zap className="w-3.5 h-3.5" />,
  'مجاناً': <Crown className="w-3.5 h-3.5" />,
  'default': <CheckCircle2 className="w-3.5 h-3.5" />,
};

function getIcon(line: string) {
  for (const [key, icon] of Object.entries(FEATURE_ICONS)) {
    if (key !== 'default' && line.includes(key)) return icon;
  }
  return FEATURE_ICONS['default'];
}

// طرق الدفع
const PAYMENT_METHODS = [
  { id: 'jawali', label: 'جيب',    emoji: '📱' },
  { id: 'floosi', label: 'فلوسك', emoji: '💳' },
  { id: 'wncash', label: 'ون كاش', emoji: '🏦' },
];

export default function SubscribeButton({ subjectId, subjectName, levelName }: Props) {
  const { toast } = useToast();
  const subMsg = useSubscriptionMessage();
  const [open, setOpen]           = useState(false);
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [payment, setPayment]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  const allLines = subMsg.note
    .split(/\n|(?<=\.)(?=\s*\S)/)
    .map((l: string) => l.trim())
    .filter(Boolean);

  // جمل تنتهي بـ ** → تنبيهات معزولة | الباقي → مزايا
  const featureLines = allLines.filter((l: string) => !l.endsWith('**'));
  const alertLines   = allLines
    .filter((l: string) => l.endsWith('**'))
    .map((l: string) => l.slice(0, -2).trim()); // إزالة ** من النهاية

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'يرجى إدخال الاسم ورقم الهاتف', variant: 'destructive' });
      return;
    }
    if (phone.trim().length < 7) {
      toast({ title: 'رقم الهاتف غير صحيح', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await (supabase as any).from('payment_requests').insert({
        student_name: name.trim(),
        phone_number: phone.trim(),
        subject_id: subjectId,
        subject_name: subjectName,
        status: 'pending',
      });
      if (error) throw error;

      await supabase.functions.invoke('send-telegram', {
        body: {
          message: `🔔 <b>طلب اشتراك جديد</b>\n\n👤 الاسم: ${name.trim()}\n📱 الهاتف: ${phone.trim()}\n📚 المادة: ${subjectName}${levelName ? `\n🎓 المستوى: ${levelName}` : ''}${payment ? `\n💳 طريقة الدفع: ${payment}` : ''}\n💰 المبلغ: ${subMsg.fee}\n\n⏳ في انتظار التأكيد من لوحة التحكم`,
        },
      });

      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setName('');
        setPhone('');
        setPayment('');
      }, 3000);
    } catch (err: any) {
      toast({ title: 'فشل إرسال الطلب', description: err?.message || 'حاول مجدداً', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── زر الاشتراك ── */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs text-white transition-all active:scale-95 relative z-20 overflow-hidden animate-shimmer"
        style={{
          background: 'linear-gradient(135deg, hsl(217 91% 57%) 0%, hsl(160 84% 39%) 100%)',
          boxShadow: '0 4px 20px hsl(217 91% 57% / 0.4)',
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        اشترك — {subMsg.fee}
      </button>

      {/* ── Modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-[95vw] max-w-[420px] p-0 overflow-hidden border-0 shadow-deep"
          dir="rtl"
          style={{ borderRadius: '1.4rem' }}
        >

          {/* ── Header Gradient ── */}
          <div
            className="relative px-5 pt-5 pb-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(217 91% 57%) 0%, hsl(199 89% 48%) 60%, hsl(160 84% 39%) 100%)',
            }}
          >
            {/* دوائر زخرفية */}
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, white, transparent)' }} />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, white, transparent)' }} />

            <DialogHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <DialogTitle className="text-right text-base font-black text-white leading-tight">
                    الباقة المتقدمة
                  </DialogTitle>
                  <p className="text-white/75 text-[11px] font-medium text-right">{subjectName}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                  <Crown className="w-5 h-5 text-yellow-300" />
                </div>
              </div>

              {/* السعر */}
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)' }}
                >
                  <CreditCard className="w-3.5 h-3.5 text-white" />
                  <span className="text-white font-black text-sm">{subMsg.fee}</span>
                </div>
                <span className="text-white/60 text-[10px]">{subMsg.feeLabel}</span>
              </div>
            </DialogHeader>
          </div>

          {/* ── Body ── */}
          <div className="px-5 py-4 bg-card space-y-4">

            {done ? (
              /* ── نجاح ── */
              <div className="py-6 text-center space-y-3 animate-scale-in">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 50%))' }}
                >
                  <CheckCircle2 className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">تم إرسال طلبك بنجاح 🎉</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    سيتم التواصل معك قريباً على واتساب لتفعيل اشتراكك.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* ── مزايا الباقة ── */}
                {featureLines.length > 0 && (
                  <div
                    className="rounded-2xl p-3.5 space-y-2"
                    style={{
                      background: 'hsl(var(--primary) / 0.04)',
                      border: '1px solid hsl(var(--primary) / 0.12)',
                    }}
                  >
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2.5">
                      ✦ مزايا الباقة المتقدمة
                    </p>
                    <div className="space-y-2">
                      {featureLines.map((line: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 animate-fade-in"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          {/* أيقونة المزية */}
                          <div
                            className="mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, hsl(217 91% 57% / 0.15), hsl(160 84% 39% / 0.1))',
                              color: 'hsl(var(--primary))',
                            }}
                          >
                            {getIcon(line)}
                          </div>
                          <span className="text-[12px] text-foreground/80 leading-snug font-medium flex-1">
                            {line}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── صندوق التنبيهات ── */}
                {alertLines.length > 0 && (
                  <div
                    className="rounded-2xl overflow-hidden animate-fade-in"
                    style={{ animationDelay: '200ms' }}
                  >
                    <div
                      className="flex items-center gap-2 px-3.5 py-2"
                      style={{
                        background: 'linear-gradient(135deg, hsl(38 92% 50%) 0%, hsl(45 96% 58%) 100%)',
                      }}
                    >
                      <span className="text-sm">⚠️</span>
                      <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
                        تنبيه مهم
                      </span>
                    </div>
                    <div
                      className="px-3.5 py-3 space-y-2"
                      style={{
                        background: 'hsl(38 92% 50% / 0.06)',
                        border: '1px solid hsl(38 92% 50% / 0.2)',
                        borderTop: 'none',
                        borderRadius: '0 0 1rem 1rem',
                      }}
                    >
                      {alertLines.map((line: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div
                            className="mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black"
                            style={{
                              background: 'hsl(38 92% 50% / 0.15)',
                              color: 'hsl(38 92% 38%)',
                            }}
                          >
                            !
                          </div>
                          <span className="text-[12px] leading-snug font-semibold"
                            style={{ color: 'hsl(38 60% 28%)' }}>
                            {line}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── فورم ── */}
                <form onSubmit={handleSubmit} className="space-y-3">

                  {/* طريقة الدفع */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-wide">
                      طريقة الدفع
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPayment(m.label)}
                          className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all text-xs font-bold"
                          style={{
                            borderColor: payment === m.label ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                            background: payment === m.label ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                            color: payment === m.label ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                          }}
                        >
                          <span className="text-base">{m.emoji}</span>
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* الاسم */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <User className="w-3 h-3" /> الاسم الكامل
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      maxLength={100}
                      className="bg-background text-sm h-10 rounded-xl border-border/60 focus:border-primary/50"
                      required
                    />
                  </div>

                  {/* الهاتف */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> رقم الجوال (واتساب)
                    </Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="7XXXXXXXX"
                      type="tel"
                      maxLength={20}
                      className="bg-background text-sm h-10 rounded-xl border-border/60 focus:border-primary/50"
                      required
                    />
                  </div>

                  {/* تنبيه */}
                  <div className="flex items-start gap-2 p-2.5 rounded-xl"
                    style={{ background: 'hsl(var(--muted))', }}>
                    <Lock className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      يرجى تحويل {subMsg.feeLabel} ورفع الإيصال. سيتم تفعيل حسابك فور التحقق.
                    </p>
                  </div>

                  {/* زر الإرسال */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-white transition-all active:scale-95 disabled:opacity-60 relative overflow-hidden"
                    style={{
                      background: loading
                        ? 'hsl(var(--muted))'
                        : 'linear-gradient(135deg, hsl(217 91% 57%) 0%, hsl(199 89% 48%) 100%)',
                      boxShadow: loading ? 'none' : '0 4px 20px hsl(217 91% 57% / 0.4)',
                    }}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /><span>جاري الإرسال...</span></>
                      : <><Sparkles className="w-4 h-4" /><span>إرسال طلب الاشتراك</span></>
                    }
                  </button>
                </form>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
