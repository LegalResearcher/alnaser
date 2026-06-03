import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
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

export default function SubscribeButton({ subjectId, subjectName, levelName }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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

      // إشعار تيليجرام
      await supabase.functions.invoke('send-telegram', {
        body: {
          message: `🔔 <b>طلب اشتراك جديد</b>\n\n👤 الاسم: ${name.trim()}\n📱 الهاتف: ${phone.trim()}\n📚 المادة: ${subjectName}${levelName ? `\n🎓 المستوى: ${levelName}` : ''}\n💰 المبلغ: 1000 ريال\n\n⏳ في انتظار التأكيد من لوحة التحكم`,
        },
      });

      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setName('');
        setPhone('');
      }, 2500);
    } catch (err: any) {
      toast({ title: 'فشل إرسال الطلب', description: err?.message || 'حاول مجدداً', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs text-white transition-all active:scale-95 relative z-20"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        اشترك — {subMsg.fee}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-md p-5 sm:p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-black flex items-center gap-2">
              💳 اشتراك في {subjectName}
            </DialogTitle>
          </DialogHeader>

          {done ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="font-black text-base text-slate-800 dark:text-slate-100">تم إرسال طلبك بنجاح</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                سيتم التواصل معك قريباً على رقم الهاتف لإرسال كلمة المرور.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                💰 <b>الرسوم: {subMsg.fee}</b> — {subMsg.note}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">الاسم الكامل *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: محمد أحمد"
                  maxLength={100}
                  className="bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">رقم الهاتف (واتساب) *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 967777xxxxxx"
                  type="tel"
                  maxLength={20}
                  className="bg-background"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-sm text-white transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</> : 'إرسال طلب الاشتراك'}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
