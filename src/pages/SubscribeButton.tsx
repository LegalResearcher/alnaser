import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  subjectId: string;
  subjectName: string;
  levelName?: string;
}

const WALLETS = [
  { id: 'jeeb',    label: 'جيب',     account: '488281' },
  { id: 'fawry',   label: 'فلوسك',   account: '800035159' },
  { id: 'onecash', label: 'ون كاش',  account: '174459935' },
];

export default function SubscribeButton({ subjectId, subjectName, levelName }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const selectedWalletData = WALLETS.find(w => w.id === selectedWallet);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

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
      // رفع صورة الإيصال إن وُجدت
      let receiptUrl: string | null = null;
      if (receiptFile) {
        const ext = receiptFile.name.split('.').pop();
        const fileName = `receipts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('payment-receipts').upload(fileName, receiptFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('payment-receipts').getPublicUrl(fileName);
          receiptUrl = urlData?.publicUrl ?? null;
        }
      }

      const { error } = await (supabase as any).from('payment_requests').insert({
        student_name: name.trim(),
        phone_number: phone.trim(),
        subject_id: subjectId,
        subject_name: subjectName,
        status: 'pending',
        ...(receiptUrl && { receipt_image_url: receiptUrl }),
        ...(selectedWallet && { wallet_type: selectedWallet }),
      });
      if (error) throw error;

      // إشعار تيليجرام
      await supabase.functions.invoke('send-telegram', {
        body: {
          message: `🔔 <b>طلب اشتراك جديد</b>\n\n👤 الاسم: ${name.trim()}\n📱 الهاتف: ${phone.trim()}\n📚 المادة: ${subjectName}${levelName ? `\n🎓 المستوى: ${levelName}` : ''}\n💰 المبلغ: 1000 ريال${selectedWalletData ? `\n💳 المحفظة: ${selectedWalletData.label} (${selectedWalletData.account})` : ''}${receiptUrl ? `\n🖼 الإيصال: ${receiptUrl}` : ''}\n\n⏳ في انتظار التأكيد من لوحة التحكم`,
        },
      });

      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setName('');
        setPhone('');
        setSelectedWallet(null);
        setReceiptFile(null);
        setReceiptPreview(null);
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
        <span className="font-black">اشترك لتفعيل المادة وكافة الميزات | 1000 ريال</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-md p-5 sm:p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-black flex items-center gap-2">
              💳 باقة مادة: {subjectName}
            </DialogTitle>
          </DialogHeader>

          {done ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="font-black text-base text-slate-800 dark:text-slate-100">تم إرسال طلبك بنجاح</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                سيتم التواصل معك قريباً على رقم الهاتف لإرسال رمز التفعيل.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* نص إرشادي */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                💡 يرجى تحويل المبلغ إلى الحساب الموضح، ثم رفع صورة الإيصال وتعبئة البيانات لتأكيد الاشتراك.
              </div>

              {/* اختيار المحفظة */}
              <div className="space-y-2">
                <Label className="text-sm font-black">اختر طريقة الدفع</Label>
                <div className="grid grid-cols-3 gap-2">
                  {WALLETS.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWallet(w.id === selectedWallet ? null : w.id)}
                      className={`py-2.5 rounded-xl text-xs font-black border-2 transition-all ${
                        selectedWallet === w.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 bg-background text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                {/* رقم الحساب الديناميكي */}
                {selectedWalletData && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">رقم الحساب</span>
                    <span className="font-black text-base text-emerald-800 dark:text-emerald-300 tracking-wide" dir="ltr">
                      {selectedWalletData.account}
                    </span>
                  </div>
                )}

                {/* رفع صورة الإيصال */}
                {selectedWallet && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="receipt-upload"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all font-black text-sm text-slate-600 dark:text-slate-300"
                    >
                      <Upload className="w-4 h-4" />
                      {receiptFile ? receiptFile.name : 'رفع صورة إيصال الإيداع 📁'}
                    </label>
                    <input
                      id="receipt-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {receiptPreview && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={receiptPreview} alt="الإيصال" className="w-full max-h-32 object-cover" />
                      </div>
                    )}
                  </div>
                )}
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
                  placeholder="7XXXXXXXX"
                  type="tel"
                  maxLength={20}
                  className="bg-background"
                  dir="ltr"
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
