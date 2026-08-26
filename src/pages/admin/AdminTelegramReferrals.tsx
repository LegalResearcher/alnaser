import { useEffect, useState } from 'react';
import { Gift, Loader2, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatTelegramAdminError, telegramAdminRequest } from '@/lib/telegramAdminApi';

type ReferralReward = {
  id: number;
  referrerTelegramUserId: string;
  qualifiedReferralCount: number;
  status: 'active' | 'revoked';
  accessStartsAt: string;
  accessExpiresAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
};

type ReferralPayload = {
  summary: { qualifiedReferrals: number; pendingReferrals: number; activeRewards: number };
  rewards: ReferralReward[];
};

export function AdminTelegramReferrals() {
  const { session, role } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ReferralPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const request = (path: string, options: RequestInit = {}) => telegramAdminRequest(session?.access_token, path, options);

  const load = async () => {
    if (!session?.access_token || role !== 'admin') return;
    setLoading(true);
    setError(null);
    try {
      const payload = await request<ReferralPayload>('/api/telegram/admin/referrals');
      setData({ summary: payload.summary, rewards: payload.rewards ?? [] });
    } catch (error) {
      const message = formatTelegramAdminError(error);
      setError(message);
      toast({ title: 'تعذر تحميل نظام الإحالات', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [session?.access_token, role]);

  const revoke = async (reward: ReferralReward) => {
    const reason = window.prompt('سبب سحب المكافأة (اختياري، يظهر في السجل الإداري فقط):') ?? undefined;
    if (!window.confirm(`هل تريد سحب مكافأة الإحالة رقم #${reward.id}؟ سيفقد المستخدم الوصول الشهري فورًا.`)) return;
    setRevokingId(reward.id);
    try {
      await request(`/api/telegram/admin/referrals/${reward.id}/revoke`, { method: 'POST', body: JSON.stringify({ reason }) });
      toast({ title: 'تم سحب مكافأة الإحالة', description: 'سُجل القرار في سجل التدقيق، وأزيل الوصول المؤقت.' });
      await load();
    } catch (error) {
      toast({ title: 'تعذر سحب المكافأة', description: formatTelegramAdminError(error), variant: 'destructive' });
    } finally {
      setRevokingId(null);
    }
  };

  const fmt = (value: string | null) => value ? new Date(value).toLocaleString('ar-YE') : '—';

  return <section className="rounded-3xl border border-violet-100 bg-gradient-to-l from-violet-50 to-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-2">
        <Gift className="mt-0.5 h-5 w-5 text-violet-700" />
        <div>
          <h2 className="font-black text-slate-800">إحالات الوصول الشهري</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">تُحتسب الإحالة لمستخدم جديد يفتح البوت من الرابط، ويكمل المتطلبات، ويبقى مؤهلًا لمدة 24 ساعة. كل 5 إحالات مؤهلة تمنح شهرًا واحدًا للأقسام المميزة. لا يظهر للمسؤول سوى معرف تيليغرام اللازم للمراجعة.</p>
        </div>
      </div>
      <button onClick={() => void load()} disabled={loading} className="flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-violet-700 ring-1 ring-violet-100 hover:bg-violet-50 disabled:opacity-60">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}تحديث
      </button>
    </div>
    {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-violet-600" /></div> : error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"><div className="flex flex-wrap items-center justify-between gap-3"><span>{error}</span><button onClick={() => void load()} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200">إعادة المحاولة</button></div><p className="mt-2 text-xs text-rose-700/80">لم تُخفَ البيانات السابقة بسبب الخطأ؛ سيبقى القسم مستقلًا عن بقية لوحة البوت.</p></div> : !data ? <div className="rounded-2xl bg-white p-5 text-center text-sm text-slate-500 ring-1 ring-violet-100">لا توجد بيانات إحالات متاحة بعد.</div> : <>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-violet-100"><p className="flex items-center gap-1.5 text-xs text-slate-500"><Users className="h-3.5 w-3.5" />إحالات مؤهلة</p><p className="mt-1 text-2xl font-black text-slate-800">{data.summary.qualifiedReferrals}</p></div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-violet-100"><p className="text-xs text-slate-500">قيد التأهيل (24 ساعة)</p><p className="mt-1 text-2xl font-black text-amber-600">{data.summary.pendingReferrals}</p></div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-violet-100"><p className="text-xs text-slate-500">مكافآت فعّالة</p><p className="mt-1 text-2xl font-black text-emerald-600">{data.summary.activeRewards}</p></div>
      </div>
      <div className="mt-5 space-y-3">
        {data.rewards.length === 0 ? <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-500 ring-1 ring-violet-100">لا توجد مكافآت إحالة مسجلة حتى الآن.</p> : data.rewards.map(reward => {
          const active = reward.status === 'active' && new Date(reward.accessExpiresAt).getTime() > Date.now();
          return <article key={reward.id} className="rounded-2xl border border-violet-100 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-slate-800">مكافأة #{reward.id} · إحالات محتسبة: {reward.qualifiedReferralCount}</p><p className="mt-1 text-xs text-slate-600">معرّف صاحب الإحالة: {reward.referrerTelegramUserId}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${active ? 'bg-emerald-100 text-emerald-700' : reward.status === 'revoked' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{active ? 'وصول فعّال' : reward.status === 'revoked' ? 'مسحوبة' : 'منتهية'}</span></div>
            <p className="mt-3 text-xs text-slate-600">بداية الوصول: {fmt(reward.accessStartsAt)} · انتهاء الوصول: {fmt(reward.accessExpiresAt)}</p>
            {reward.revokeReason && <p className="mt-2 text-xs text-rose-700">سبب السحب: {reward.revokeReason}</p>}
            {active && <button onClick={() => void revoke(reward)} disabled={revokingId === reward.id} className="mt-3 flex h-9 items-center gap-1.5 rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60">{revokingId === reward.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}سحب الوصول</button>}
          </article>;
        })}
      </div>
    </>}
  </section>;
}
