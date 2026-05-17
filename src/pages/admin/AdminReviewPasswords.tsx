import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReviewPassword, Subject, Level } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyRound, Search, Edit2, Trash2, CheckCircle2, XCircle, RefreshCw, Smartphone, Calendar, Clock, Download, Sparkles, Copy, Send } from 'lucide-react';
import { AdminSEO } from '@/components/seo/SEOHead';
import * as XLSX from 'xlsx';

type Row = ReviewPassword & { subject_name?: string };

export default function AdminReviewPasswords() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editDuration, setEditDuration] = useState<number>(30);
  const [editContact, setEditContact] = useState('');
  const [editContactType, setEditContactType] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── بيانات التواصل من localStorage ──
  const CONTACTS_KEY = 'review_pwd_contacts';
  const contacts: Record<string, string> = (() => {
    try { return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '{}'); } catch { return {}; }
  })();

  const handleSendMessage = (p: ReviewPassword) => {
    const saved = contacts[p.id];
    if (!saved) return;
    const subjectName = subjectMap[p.subject_id] || 'المادة';
    const subjectUrl = `https://www.alnaseer.org/exam/${p.subject_id}`;
    const msg = `اهلا وسهلا بك 👋\nتم تفعيل اشتراكك في منصة الناصر القانونية ✅\n\n📚 المادة: ${subjectName}\n🔑 كلمة المرور: ${p.password}\n⏳ المدة: ${p.duration_days || 30} يوم\n\n🔗 رابط ${subjectName}: ${subjectUrl}\n\nادخل عبر الرابط واضغط على "اختبار+ المراجعة" وأدخل كلمة المرور للبدء.\n\nبالتوفيق والنجاح..`;

    const isTelegram = saved.startsWith('telegram:');
    const contact = saved.replace(/^(whatsapp|telegram):/, '');

    if (isTelegram) {
      // تيليجرام: لو رقم أو معرف
      const isUsername = contact.startsWith('@') || isNaN(Number(contact));
      const target = isUsername ? contact.replace('@', '') : contact;
      window.open(`https://t.me/${target}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      const phone = contact.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const copyPassword = (id: string, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('levels').select('*').order('order_index');
      if (error) throw error;
      return data as Level[];
    },
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-min'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('id,name,level_id').order('name');
      if (error) throw error;
      return (data || []) as Pick<Subject, 'id' | 'name' | 'level_id'>[];
    },
  });

  // مواد المستوى المختار فقط
  const filteredSubjects = useMemo(() =>
    levelFilter === 'all' ? subjects : subjects.filter((s: any) => s.level_id === levelFilter)
  , [subjects, levelFilter]);

  const handleLevelFilterChange = (val: string) => {
    setLevelFilter(val);
    setSubjectFilter('all'); // إعادة تعيين المادة عند تغيير المستوى
  };

  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s: any) => [s.id, s.name])), [subjects]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin_review_passwords_all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('review_passwords')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Row[];
    },
  });

  const isExpired = (p: ReviewPassword) => !p.is_active || (p.expires_at && new Date(p.expires_at) < new Date());

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (levelFilter !== 'all') {
        const subjectLevelId = (subjects.find((s: any) => s.id === r.subject_id) as any)?.level_id;
        if (subjectLevelId !== levelFilter) return false;
      }
      if (subjectFilter !== 'all' && r.subject_id !== subjectFilter) return false;
      const expired = isExpired(r);
      if (statusFilter === 'active' && expired) return false;
      if (statusFilter === 'expired' && !expired) return false;
      if (statusFilter === 'unused' && r.first_used_at) return false;
      if (statusFilter === 'used' && !r.first_used_at) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const subjectName = (subjectMap[r.subject_id] || '').toLowerCase();
        if (!(`${r.label || ''} ${r.password} ${subjectName}`.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [rows, search, levelFilter, subjectFilter, statusFilter, subjectMap, subjects]);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('review_passwords').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin_review_passwords_all'] }); toast({ title: 'تم حذف الطالب' }); },
    onError: (e: any) => toast({ title: 'فشل الحذف', description: e?.message, variant: 'destructive' }),
  });

  const renewMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('review_passwords').update({
        first_used_at: null, expires_at: null, device_fingerprint: null, is_active: true,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin_review_passwords_all'] }); toast({ title: 'تم تجديد كلمة المرور' }); },
  });

  const generateMut = useMutation({
    mutationFn: async (id: string) => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
      const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const newPwd = `${seg()}-${seg()}-${seg()}`;
      const { error } = await (supabase as any).from('review_passwords').update({ password: newPwd }).eq('id', id);
      if (error) throw error;
      return newPwd;
    },
    onSuccess: (newPwd) => {
      qc.invalidateQueries({ queryKey: ['admin_review_passwords_all'] });
      toast({ title: 'تم توليد كلمة مرور جديدة', description: newPwd });
    },
    onError: (e: any) => toast({ title: 'فشل التوليد', description: e?.message, variant: 'destructive' }),
  });

  const editMut = useMutation({
    mutationFn: async ({ id, password, duration_days, p }: { id: string; password: string; duration_days: number; p: ReviewPassword }) => {
      const updates: any = { password: password.trim(), duration_days };
      if (p.first_used_at) {
        const newExpiry = new Date(p.first_used_at);
        newExpiry.setDate(newExpiry.getDate() + duration_days);
        updates.expires_at = newExpiry.toISOString();
      }
      const { error } = await (supabase as any).from('review_passwords').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      // حفظ contact في localStorage
      const all = (() => { try { return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '{}'); } catch { return {}; } })();
      if (editContact.trim()) { all[id] = `${editContactType}:${editContact.trim()}`; } else { delete all[id]; }
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(all));
      qc.invalidateQueries({ queryKey: ['admin_review_passwords_all'] });
      setEditingId(null);
      toast({ title: 'تم التحديث' });
    },
    onError: (e: any) => toast({ title: 'فشل التحديث', description: e?.message, variant: 'destructive' }),
  });

  const startEdit = (p: ReviewPassword) => {
    setEditingId(p.id);
    setEditPassword(p.password);
    setEditDuration(p.duration_days || 30);
    const saved = contacts[p.id] || '';
    if (saved.startsWith('telegram:')) {
      setEditContactType('telegram');
      setEditContact(saved.replace('telegram:', ''));
    } else if (saved.startsWith('whatsapp:')) {
      setEditContactType('whatsapp');
      setEditContact(saved.replace('whatsapp:', ''));
    } else {
      setEditContactType('whatsapp');
      setEditContact(saved);
    }
  };

  const fmt = (d?: string | null) => d ? new Date(d).toLocaleString('ar', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const parseDevice = (base64Fingerprint: string | null): { device: string; model: string; browser: string; timezone: string } => {
    if (!base64Fingerprint) return { device: '—', model: '—', browser: '—', timezone: '—' };
    try {
      const decoded = decodeURIComponent(escape(atob(base64Fingerprint)));
      const parts = decoded.split('|');
      const ua = parts[0];
      const timezone = parts[4] || '—';

      // ── المتصفح وإصداره ──
      let browser = 'غير معروف';
      const samsungBrowserMatch = ua.match(/SamsungBrowser\/([\d]+)/);
      const edgeMatch = ua.match(/Edg\/([\d]+)/);
      const chromeMatch = ua.match(/Chrome\/([\d]+)/);
      const firefoxMatch = ua.match(/Firefox\/([\d]+)/);
      const safariMatch = ua.match(/Version\/([\d]+).*Safari/);
      if (samsungBrowserMatch) browser = `Samsung Browser ${samsungBrowserMatch[1]}`;
      else if (edgeMatch) browser = `Edge ${edgeMatch[1]}`;
      else if (chromeMatch) browser = `Chrome ${chromeMatch[1]}`;
      else if (firefoxMatch) browser = `Firefox ${firefoxMatch[1]}`;
      else if (safariMatch) browser = `Safari ${safariMatch[1]}`;

      // ── الجهاز والموديل ──
      let device = 'غير معروف';
      let model = '—';

      if (/iPhone/.test(ua)) {
        device = 'Apple iPhone';
        const v = ua.match(/OS (\d+_\d+)/);
        model = v ? `iOS ${v[1].replace('_', '.')}` : 'iOS';
      } else if (/iPad/.test(ua)) {
        device = 'Apple iPad';
        const v = ua.match(/OS (\d+_\d+)/);
        model = v ? `iOS ${v[1].replace('_', '.')}` : 'iOS';
      } else if (/SM-N/.test(ua)) {
        device = 'Samsung Note';
        model = ua.match(/SM-N[\w]+/)?.[0] || '—';
      } else if (/SM-S/.test(ua)) {
        device = 'Samsung S Series';
        model = ua.match(/SM-S[\w]+/)?.[0] || '—';
      } else if (/SM-A/.test(ua)) {
        device = 'Samsung A Series';
        model = ua.match(/SM-A[\w]+/)?.[0] || '—';
      } else if (/SM-G/.test(ua)) {
        device = 'Samsung Galaxy';
        model = ua.match(/SM-G[\w]+/)?.[0] || '—';
      } else if (/SM-F/.test(ua)) {
        device = 'Samsung Fold/Flip';
        model = ua.match(/SM-F[\w]+/)?.[0] || '—';
      } else if (/SM-/.test(ua)) {
        device = 'Samsung';
        model = ua.match(/SM-[\w]+/)?.[0] || '—';
      } else if (/Huawei|HUAWEI/.test(ua)) {
        device = 'Huawei';
        const m = ua.match(/(?:Huawei|HUAWEI)[- ]([\w]+)/);
        model = m ? m[1] : '—';
      } else if (/Xiaomi|Redmi|MIUI/.test(ua)) {
        device = 'Xiaomi';
        const m = ua.match(/(?:Xiaomi|Redmi)[- ]([\w]+)/);
        model = m ? m[1] : '—';
      } else if (/OPPO/.test(ua)) {
        device = 'OPPO';
        model = ua.match(/OPPO[- ]?([\w]+)/)?.[1] || '—';
      } else if (/vivo/.test(ua)) {
        device = 'Vivo';
        model = ua.match(/vivo[- ]?([\w]+)/)?.[1] || '—';
      } else if (/Android/.test(ua)) {
        device = 'Android';
        const android = ua.match(/Android ([\d.]+)/)?.[1] || '';
        model = android ? `Android ${android}` : '—';
      } else if (/Windows NT/.test(ua)) {
        device = 'Windows PC';
        model = '—';
      } else if (/Macintosh/.test(ua)) {
        device = 'Mac';
        model = '—';
      }

      return { device, model, browser, timezone };
    } catch {
      return { device: '—', model: '—', browser: '—', timezone: '—' };
    }
  };

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter(r => !isExpired(r)).length,
    expired: rows.filter(r => isExpired(r)).length,
    used: rows.filter(r => r.first_used_at).length,
  }), [rows]);

  const handleExport = () => {
    if (rows.length === 0) {
      toast({ title: 'لا توجد بيانات للتصدير', variant: 'destructive' });
      return;
    }
    const exportData = rows.map(r => {
      const saved = contacts[r.id] || '';
      const contactType = saved.startsWith('telegram:') ? 'تيليجرام' : saved.startsWith('whatsapp:') ? 'واتساب' : '';
      const contactValue = saved.replace(/^(whatsapp|telegram):/, '');
      return {
        'الاسم': r.label || '—',
        'كلمة المرور': r.password,
        'المادة': subjectMap[r.subject_id] || '—',
        'المدة (يوم)': r.duration_days || 30,
        'نوع التواصل': contactType,
        'رقم/معرف التواصل': contactValue,
        'الحالة': isExpired(r) ? 'منتهية' : r.first_used_at ? 'قيد الاستخدام' : 'جاهزة',
        'أول استخدام': r.first_used_at ? new Date(r.first_used_at).toLocaleDateString('ar') : '—',
        'تاريخ الانتهاء': r.expires_at ? new Date(r.expires_at).toLocaleDateString('ar') : '—',
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'كلمات المرور');
    XLSX.writeFile(wb, `review-passwords-${new Date().toISOString().slice(0,10)}.xlsx`);
    toast({ title: `تم تصدير ${rows.length} سجل` });
  };

  return (
    <AdminLayout>
      <AdminSEO pageName="سجل كلمات مرور المراجعة" />
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">سجل كلمات مرور اختبار+ المراجعة</h1>
              <p className="text-sm text-slate-500 font-medium">إدارة شاملة لكل الطلاب وأجهزتهم وصلاحية كلمات المرور</p>
            </div>
          </div>
          <Button onClick={handleExport} disabled={rows.length === 0} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تصدير Excel</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: 'الإجمالي', v: stats.total, c: 'bg-slate-100 text-slate-700' },
            { l: 'نشطة', v: stats.active, c: 'bg-emerald-100 text-emerald-700' },
            { l: 'منتهية', v: stats.expired, c: 'bg-rose-100 text-rose-700' },
            { l: 'تم استخدامها', v: stats.used, c: 'bg-blue-100 text-blue-700' },
          ].map((s, i) => (
            <div key={i} className={`rounded-2xl p-4 border ${s.c} border-current/10`}>
              <p className="text-xs font-bold opacity-70">{s.l}</p>
              <p className="text-2xl font-black">{s.v}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 grid grid-cols-1 md:grid-cols-[1fr_180px_180px_180px] gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو المادة أو كلمة المرور..." className="pr-9" />
          </div>
          <Select value={levelFilter} onValueChange={handleLevelFilterChange}>
            <SelectTrigger><SelectValue placeholder="كل المستويات" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المستويات</SelectItem>
              {levels.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger><SelectValue placeholder="كل المواد" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المواد</SelectItem>
              {filteredSubjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="active">نشطة</SelectItem>
              <SelectItem value="expired">منتهية</SelectItem>
              <SelectItem value="used">تم استخدامها</SelectItem>
              <SelectItem value="unused">غير مستخدمة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-64" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">لا توجد كلمات مرور مطابقة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr className="text-right">
                    <th className="p-3 font-black">الطالب</th>
                    <th className="p-3 font-black">المادة</th>
                    <th className="p-3 font-black">كلمة المرور</th>
                    <th className="p-3 font-black">المدة</th>
                    <th className="p-3 font-black">الحالة</th>
                    <th className="p-3 font-black hidden md:table-cell"><Smartphone className="w-3 h-3 inline ml-1" />الجهاز</th>
                    <th className="p-3 font-black hidden md:table-cell">الموديل</th>
                    <th className="p-3 font-black hidden md:table-cell">المتصفح</th>
                    <th className="p-3 font-black hidden md:table-cell">المنطقة الزمنية</th>
                    <th className="p-3 font-black hidden md:table-cell"><Clock className="w-3 h-3 inline ml-1" />أول استخدام</th>
                    <th className="p-3 font-black hidden md:table-cell"><Calendar className="w-3 h-3 inline ml-1" />الانتهاء</th>
                    <th className="p-3 font-black">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => {
                    const expired = isExpired(p);
                    const editing = editingId === p.id;
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50/50 ${expired ? 'opacity-70' : ''}`}>
                        <td className="p-3 font-bold">
                          {editing
                            ? <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">{p.label || '—'}</span>
                                <div className="flex gap-1">
                                  <Select value={editContactType} onValueChange={(v) => setEditContactType(v as 'whatsapp' | 'telegram')}>
                                    <SelectTrigger className="h-8 w-24 text-xs shrink-0">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="whatsapp">واتساب</SelectItem>
                                      <SelectItem value="telegram">تيليجرام</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder={editContactType === 'whatsapp' ? '967700000000' : 'معرف أو رقم'}
                                    value={editContact}
                                    onChange={(e) => setEditContact(e.target.value)}
                                    className="h-8 text-xs flex-1"
                                    dir="ltr"
                                  />
                                </div>
                              </div>
                            : <div>
                                <span>{p.label || '—'}</span>
                                {contacts[p.id] && (
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {contacts[p.id].startsWith('telegram:') ? '📱 ' : '💬 '}
                                    {contacts[p.id].replace(/^(whatsapp|telegram):/, '')}
                                  </p>
                                )}
                              </div>
                          }
                        </td>
                        <td className="p-3">{subjectMap[p.subject_id] || '—'}</td>
                        <td className="p-3 font-mono">
                          {editing
                            ? <Input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="h-8 text-xs" />
                            : <div className="flex items-center gap-1">
                                <span>{p.password}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                                  onClick={() => copyPassword(p.id, p.password)} title="نسخ كلمة المرور">
                                  {copiedId === p.id
                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                                </Button>
                              </div>
                          }
                        </td>
                        <td className="p-3">
                          {editing ? <Input type="number" min={1} value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value))} className="h-8 w-20 text-xs" /> : `${p.duration_days || 30} يوم`}
                        </td>
                        <td className="p-3">
                          {expired
                            ? <Badge variant="secondary" className="bg-rose-100 text-rose-700">منتهية</Badge>
                            : p.first_used_at
                              ? <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">قيد الاستخدام</Badge>
                              : <Badge className="bg-blue-500 text-white hover:bg-blue-500">جاهزة</Badge>}
                        </td>
                        {(() => {
                          const info = parseDevice(p.device_fingerprint);
                          return (
                            <>
                              <td className="p-3 hidden md:table-cell font-semibold text-slate-700 dark:text-slate-300 text-xs">{info.device}</td>
                              <td className="p-3 hidden md:table-cell font-mono text-[11px] text-slate-500">{info.model}</td>
                              <td className="p-3 hidden md:table-cell text-xs text-slate-500">{info.browser}</td>
                              <td className="p-3 hidden md:table-cell text-xs text-slate-500">{info.timezone}</td>
                            </>
                          );
                        })()}
                        <td className="p-3 hidden md:table-cell whitespace-nowrap">{fmt(p.first_used_at)}</td>
                        <td className="p-3 hidden md:table-cell whitespace-nowrap">{fmt(p.expires_at)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {editing ? (
                              <>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-emerald-600"
                                  disabled={editMut.isPending || !editPassword.trim()}
                                  onClick={() => editMut.mutate({ id: p.id, password: editPassword, duration_days: editDuration, p })} title="حفظ">
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)} title="إلغاء">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)} title="تعديل">
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-violet-600"
                                  onClick={() => generateMut.mutate(p.id)} disabled={generateMut.isPending} title="توليد كلمة مرور جديدة">
                                  <Sparkles className="w-4 h-4" />
                                </Button>
                                {contacts[p.id] && (
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-blue-600"
                                    onClick={() => handleSendMessage(p)} title={`إرسال لـ ${contacts[p.id]}`}>
                                    <Send className="w-4 h-4" />
                                  </Button>
                                )}
                                {(expired || p.first_used_at) && (
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-emerald-600"
                                    onClick={() => renewMut.mutate(p.id)} disabled={renewMut.isPending} title="تجديد (إعادة تعيين الجهاز والصلاحية)">
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                  onClick={() => { if (confirm(`حذف الطالب "${p.label || p.password}"؟`)) deleteMut.mutate(p.id); }}
                                  disabled={deleteMut.isPending} title="حذف الطالب">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}