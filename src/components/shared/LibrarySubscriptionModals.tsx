/**
 * LibrarySubscriptionModals.tsx
 * مودالات كلمة المرور والاشتراك — مُستخرجة حرفياً من DriveLibrary.tsx (دون تغيير المنطق)
 * لتكون مصدراً واحداً يُعاد استخدامه في كل من المكتبة القديمة (drive_folders)
 * والمكتبة القانونية الجديدة (legal_documents / judicial_rules).
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLibrarySubscriptionMessage } from '@/hooks/useLibrarySubscriptionMessage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { X, Lock, Crown } from 'lucide-react';
import { getDeviceFingerprint, getLibrarySubjectId } from '@/hooks/useLegalLibrary';

export const LIBRARY_PWD_KEY = 'library_review_pwd_v2';

export async function verifyLibraryPassword(
  password: string,
  fingerprint: string,
  subjectId: string
): Promise<'ok' | 'not_found' | 'wrong_device' | 'expired'> {
  const { data: match } = await (supabase as any)
    .from('review_passwords')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('password', password)
    .eq('is_active', true)
    .maybeSingle();

  if (!match) return 'not_found';
  if (match.expires_at && new Date(match.expires_at) < new Date()) return 'expired';
  if (match.device_fingerprint && match.device_fingerprint !== fingerprint) return 'wrong_device';

  if (!match.first_used_at) {
    const days = Number(match.duration_days) > 0 ? Number(match.duration_days) : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    await (supabase as any).from('review_passwords').update({
      device_fingerprint: fingerprint,
      first_used_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }).eq('id', match.id);
  }
  return 'ok';
}

export function LibraryPasswordModal({ onSuccess, onSubscribe, onClose }: {
  onSuccess: () => void; onSubscribe: () => void; onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) return;
    setLoading(true); setError('');
    try {
      const fingerprint = getDeviceFingerprint();
      const subjectId = await getLibrarySubjectId();

      if (!subjectId) {
        const { data: match } = await (supabase as any)
          .from('review_passwords')
          .select('*')
          .eq('password', password.trim())
          .eq('is_active', true)
          .maybeSingle();

        if (!match) { setError('كلمة المرور غير صحيحة'); setLoading(false); return; }
        if (match.expires_at && new Date(match.expires_at) < new Date()) { setError('انتهت صلاحية كلمة المرور'); setLoading(false); return; }
        if (match.device_fingerprint && match.device_fingerprint !== fingerprint) { setError('كلمة المرور مستخدمة على جهاز آخر'); setLoading(false); return; }

        if (!match.first_used_at) {
          const days = Number(match.duration_days) > 0 ? Number(match.duration_days) : 30;
          const exp = new Date(); exp.setDate(exp.getDate() + days);
          await (supabase as any).from('review_passwords').update({ device_fingerprint: fingerprint, first_used_at: new Date().toISOString(), expires_at: exp.toISOString() }).eq('id', match.id);
        }
        localStorage.setItem(LIBRARY_PWD_KEY, JSON.stringify({ pwd: password.trim(), fp: fingerprint }));
        onSuccess(); return;
      }

      const result = await verifyLibraryPassword(password.trim(), fingerprint, subjectId);
      if (result === 'ok') {
        localStorage.setItem(LIBRARY_PWD_KEY, JSON.stringify({ pwd: password.trim(), fp: fingerprint, subjectId }));
        onSuccess();
      } else if (result === 'not_found') {
        setError('كلمة المرور غير صحيحة');
      } else if (result === 'wrong_device') {
        setError('كلمة المرور مستخدمة على جهاز آخر');
      } else if (result === 'expired') {
        setError('انتهت صلاحية كلمة المرور، تواصل مع الإدارة');
      }
    } catch {
      setError('حدث خطأ، حاول مرة أخرى');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        <div className="h-1.5 bg-gradient-to-l from-amber-400 via-yellow-500 to-amber-600" />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base">محتوى مدفوع</h3>
                <p className="text-[11px] text-slate-400">أدخل رمز التفعيل للوصول</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-3.5 border border-amber-100 dark:border-amber-800/40">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 text-right leading-relaxed">
              في هذا الوضع ستظهر لك <span className="font-black">النصوص الكاملة</span> — أدخل رمز التفعيل الخاص بك.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">رمز التفعيل</label>
            <input type="text" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder="XXXX-XXXX-XXXX" autoFocus dir="ltr"
              className={cn(
                'w-full h-13 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 text-center font-black tracking-[0.3em] text-lg focus:outline-none transition-all',
                error
                  ? 'border-red-400 focus:border-red-500 bg-red-50 dark:bg-red-950/20 text-red-600'
                  : 'border-slate-200 dark:border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30'
              )} />
            {error && <p className="text-xs font-black text-red-500 text-center animate-in fade-in duration-200">❌ {error}</p>}
          </div>
          <button onClick={handleConfirm} disabled={!password.trim() || loading}
            className="w-full h-12 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #92400e, #d97706)', boxShadow: '0 6px 20px rgba(217,119,6,0.4)' }}>
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Crown className="w-4 h-4" /> دخول</>}
          </button>
          <div className="relative flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">أو</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>
          <button onClick={() => { onClose(); onSubscribe(); }}
            className="w-full h-11 rounded-2xl font-black text-sm border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
            اشترك الآن للحصول على رمز التفعيل
          </button>
        </div>
      </div>
    </div>
  );
}

export function LibrarySubscriptionModal({ fileName, onClose, feeOverride }: {
  fileName: string; onClose: () => void;
  /** سعر مخصص يُعرض بدل subMsg.fee — يُستخدم عند الدخول من بطاقة باقة شهرية/سنوية محددة السعر */
  feeOverride?: string;
}) {
  const subMsg = useLibrarySubscriptionMessage();
  const displayFee = feeOverride || subMsg.fee;
  const { toast } = useToast();
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [wallet, setWallet] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!studentName.trim() || !phone.trim()) return;
    setLoading(true);
    try {
      const libSubjectId = await getLibrarySubjectId();
      let receiptUrl = '';
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const filePath = `library-receipts/${Date.now()}.${fileExt}`;
        const { error: upErr } = await supabase.storage.from('receipts').upload(filePath, receiptFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath);
          receiptUrl = urlData.publicUrl;
        }
      }

      const { error: dbErr } = await (supabase as any).from('payment_requests').insert({
        student_name: studentName.trim(),
        phone_number: phone.trim(),
        subject_id: libSubjectId || null,
        subject_name: `المكتبة — ${fileName}`,
        status: 'pending',
        wallet_type: wallet || null,
        receipt_image_url: receiptUrl || null,
      });
      if (dbErr) throw dbErr;

      await supabase.functions.invoke('send-telegram', {
        body: {
          message: `🔔 <b>طلب اشتراك جديد (المكتبة)</b>\n\n👤 ${studentName.trim()}\n📱 ${phone.trim()}\n📄 الملف: ${fileName}${wallet ? `\n💳 المحفظة: ${wallet}` : ''}${receiptUrl ? `\n🖼 الإيصال: ${receiptUrl}` : ''}\n💰 المبلغ: ${displayFee}\n\n⏳ في انتظار التأكيد من لوحة التحكم`,
        },
      });

      setSuccess(true);
    } catch (e: any) {
      toast({ title: 'فشل إرسال الطلب', description: e?.message || 'حاول مجدداً', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const allLines = subMsg.note.split(/\n|(?<=\.)(?=\s*\S)/).map((l: string) => l.trim()).filter(Boolean);
  const featureLines = allLines.filter((l: string) => !l.endsWith('**'));
  const alertLines = allLines.filter((l: string) => l.endsWith('**')).map((l: string) => l.slice(0, -2).trim());

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90dvh] flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-l from-blue-500 via-indigo-500 to-blue-700 shrink-0" />
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center text-xl">💳</div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base">طلب الاشتراك</h3>
                <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{fileName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {!success ? (
            <>
              <div className="space-y-2">
                <p className="text-xs font-black text-blue-700 dark:text-blue-400 text-right">
                  💰 الرسوم: <span className="text-base">{displayFee}</span>
                </p>
                {featureLines.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-3.5 border border-blue-100 dark:border-blue-800/40 space-y-1.5">
                    {featureLines.map((line: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-right">
                        <span className="mt-0.5 text-blue-500 text-xs shrink-0">✓</span>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 leading-relaxed">{line}</span>
                      </div>
                    ))}
                  </div>
                )}
                {alertLines.length > 0 && (
                  <div className="rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3.5 py-2"
                      style={{ background: 'linear-gradient(135deg, hsl(38 92% 50%) 0%, hsl(45 96% 58%) 100%)' }}>
                      <span className="text-sm">⚠️</span>
                      <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">تنبيه مهم</span>
                    </div>
                    <div className="px-3.5 py-3 space-y-1.5"
                      style={{ background: 'hsl(38 92% 50% / 0.06)', border: '1px solid hsl(38 92% 50% / 0.2)', borderTop: 'none', borderRadius: '0 0 1rem 1rem' }}>
                      {alertLines.map((line: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black"
                            style={{ background: 'hsl(38 92% 50% / 0.15)', color: 'hsl(38 92% 38%)' }}>!</div>
                          <span className="text-[11px] font-semibold leading-relaxed" style={{ color: 'hsl(38 60% 28%)' }}>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider text-right block">اختر طريقة الدفع</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'jeeb', label: 'جيب', account: '488281' }, { id: 'fawry', label: 'فلوسك', account: '800035159' }, { id: 'onecash', label: 'ون كاش', account: '174459935' }].map(w => (
                    <button key={w.id} type="button" onClick={() => setWallet(w.id === wallet ? null : w.id)}
                      className={`py-2.5 rounded-xl text-xs font-black border-2 transition-all ${wallet === w.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
                      {w.label}
                    </button>
                  ))}
                </div>
                {wallet && (() => {
                  const accounts: Record<string, string> = { jeeb: '488281', fawry: '800035159', onecash: '174459935' };
                  return (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">رقم الحساب</span>
                      <span className="font-black text-base text-emerald-800 dark:text-emerald-300 tracking-wide" dir="ltr">{accounts[wallet]}</span>
                    </div>
                  );
                })()}
                {wallet && (
                  <div className="space-y-1.5">
                    <label htmlFor="legal-receipt-upload"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all font-black text-sm text-slate-600 dark:text-slate-300">
                      📁 {receiptFile ? receiptFile.name : 'رفع صورة إيصال الإيداع'}
                    </label>
                    <input id="legal-receipt-upload" type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setReceiptFile(file);
                        const reader = new FileReader();
                        reader.onload = () => setReceiptPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }} />
                    {receiptPreview && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={receiptPreview} alt="الإيصال" className="w-full max-h-28 object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider text-right block">الاسم الكامل</label>
                <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)}
                  placeholder="أدخل اسمك الكامل" dir="rtl"
                  className="w-full h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-right font-semibold text-sm focus:outline-none focus:border-blue-400 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider text-right block">رقم الجوال (واتساب)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="7XXXXXXXX" dir="ltr"
                  className="w-full h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-right font-semibold text-sm focus:outline-none focus:border-blue-400 transition-all" />
              </div>
              <button onClick={handleSend} disabled={loading || !studentName.trim() || !phone.trim()}
                className="w-full h-12 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)', boxShadow: '0 6px 20px rgba(29,78,216,0.4)' }}>
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>📩</span> إرسال طلب الاشتراك</>}
              </button>
            </>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl animate-in zoom-in duration-300">✅</div>
              <div>
                <p className="font-black text-slate-800 dark:text-slate-100 text-base mb-1">تم استلام طلبك!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed" dir="rtl">
                  سيتم التواصل معك على رقم الهاتف<br />
                  لإرسال <span className="font-black text-blue-600">رمز التفعيل</span> خلال دقائق 🎉
                </p>
              </div>
              <button onClick={onClose}
                className="w-full h-12 rounded-2xl font-black text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)' }}>
                إغلاق
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
