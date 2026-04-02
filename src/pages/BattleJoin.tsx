/**
 * Alnasser Tech — BattleJoin
 * صفحة الانضمام لغرفة بالكود
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Hash, ChevronLeft, Loader2, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const BattleJoin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);

  const handleJoin = async () => {
    if (code.trim().length !== 6) { toast({ title: 'الكود يجب أن يكون 6 أرقام', variant: 'destructive' }); return; }
    setChecking(true);
    const { data, error } = await (supabase.from('battle_rooms' as any) as any)
      .select('id, code, status, expires_at, subject_id').eq('code', code.trim()).maybeSingle();

    if (error || !data) { toast({ title: 'الغرفة غير موجودة', variant: 'destructive' }); setChecking(false); return; }
    if (new Date(data.expires_at) < new Date()) { toast({ title: 'انتهت صلاحية هذه الغرفة', variant: 'destructive' }); setChecking(false); return; }
    if (data.status === 'finished') { toast({ title: 'انتهى الاختبار في هذه الغرفة', variant: 'destructive' }); setChecking(false); return; }

    // ✅ فحص إيقاف غرف التحدي من الأدمن
    const { data: subjectData } = await (supabase.from('subjects' as any) as any)
      .select('battle_disabled')
      .eq('id', data.subject_id)
      .maybeSingle();
    if (subjectData?.battle_disabled) {
      toast({
        title: '⛔ غرف التحدي موقوفة',
        description: 'غرف التحدي لهذه المادة موقوفة حالياً من قِبَل الإدارة',
        variant: 'destructive',
      });
      setChecking(false);
      return;
    }

    navigate(`/battle/${data.code}`);
    setChecking(false);
  };

  return (
    <MainLayout>
      <section className="min-h-[calc(100vh-80px)] flex items-center py-8" dir="rtl">
        <div className="container mx-auto px-4 max-w-sm">

          <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-primary transition-colors bg-white dark:bg-card border border-slate-200 rounded-xl px-4 py-2">
            <ChevronLeft className="w-4 h-4" /> رجوع
          </button>

          <div className="bg-white dark:bg-card rounded-[2rem] border border-slate-100 dark:border-border shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-10 bg-amber-500/20 blur-xl" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Swords className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-black text-white">انضم لغرفة</h1>
                <p className="text-blue-300 text-sm font-bold mt-1">أدخل كود الغرفة للانضمام</p>
              </div>
            </div>

            <div className="p-7 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> كود الغرفة (6 أرقام)
                </label>
                <Input
                  placeholder="000000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  className="h-16 rounded-[1rem] text-center text-3xl font-black tracking-[0.4em] bg-slate-50 dark:bg-muted border-slate-200 font-mono"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleJoin}
                disabled={checking || code.length !== 6}
                className="w-full h-13 rounded-[1rem] font-black text-white gap-2 bg-gradient-to-l from-amber-500 to-orange-600 shadow-lg text-base"
              >
                {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Swords className="w-5 h-5" /> انضم للغرفة</>}
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100 dark:bg-border" />
                <span className="text-xs text-slate-400 font-bold">أو</span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-border" />
              </div>

              <Button
                variant="outline"
                onClick={() => navigate('/battle/create')}
                className="w-full h-12 rounded-[1rem] font-black gap-2"
              >
                <Plus className="w-4 h-4" /> أنشئ غرفة جديدة
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default BattleJoin;