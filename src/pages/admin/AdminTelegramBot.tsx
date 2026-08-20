import { useEffect, useMemo, useState } from 'react';
import { Bot, ExternalLink, FileText, History, LayoutList, Loader2, MessageSquareText, Pencil, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const BOT_API = 'https://moilegbot-cd9jlnvj.manus.space';

type ManagedMenuItem = { id: number; label: string; actionType: 'url' | 'message'; actionValue: string; rowIndex: number; sortOrder: number; enabled: boolean; createdAt: string; updatedAt: string };
type ManagedSection = { sectionKey: string; displayLabel: string; enabled: boolean; sortOrder: number };
type AuditLog = { id: number; action: string; entityType: string; entityId: string | null; createdAt: string };
type ManagedMessageTemplate = { messageKey: 'welcome' | 'about' | 'help'; title: string; content: string };
type ManagedSource = { id: number; title: string; description: string; collection: string; sortOrder: number; isFeatured: boolean; updatedAt: string };
type UploadDraft = { title: string; description: string; collection: string; category: string; sortOrder: number; isFeatured: boolean };
const emptyUploadDraft: UploadDraft = { title: '', description: '', collection: 'judicial', category: 'general', sortOrder: 0, isFeatured: false };
type Draft = Omit<ManagedMenuItem, 'id' | 'createdAt' | 'updatedAt'>;
const emptyDraft: Draft = { label: '', actionType: 'url', actionValue: '', rowIndex: 100, sortOrder: 0, enabled: true };

function actionLabel(type: ManagedMenuItem['actionType']) { return type === 'url' ? 'فتح رابط' : 'عرض رسالة'; }

export default function AdminTelegramBot() {
  const { session, role } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ManagedMenuItem[]>([]);
  const [sections, setSections] = useState<ManagedSection[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [templates, setTemplates] = useState<ManagedMessageTemplate[]>([]);
  const [sources, setSources] = useState<ManagedSource[]>([]);
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceTotal, setSourceTotal] = useState(0);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>(emptyUploadDraft);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [savingSource, setSavingSource] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const request = async (path: string, options: RequestInit = {}) => {
    const token = session?.access_token;
    if (!token) throw new Error('انتهت جلسة الإدارة. سجّل الدخول مجددًا.');
    const response = await fetch(`${BOT_API}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers ?? {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) throw new Error('تعذر تنفيذ العملية. تحقق من صلاحية الإدارة أو من بيانات الحقل.');
    return body;
  };

  const load = async () => {
    if (!session?.access_token || role !== 'admin') return;
    setLoading(true);
    try {
      const [itemsResponse, sectionsResponse, logsResponse, templatesResponse] = await Promise.all([request('/api/telegram/admin/menu-items'), request('/api/telegram/admin/sections'), request('/api/telegram/admin/audit-logs'), request('/api/telegram/admin/message-templates')]);
      setItems(itemsResponse.items ?? []);
      setSections(sectionsResponse.sections ?? []);
      setLogs(logsResponse.logs ?? []);
      setTemplates(templatesResponse.templates ?? []);
    } catch (error) {
      toast({ title: 'تعذر تحميل إعدادات البوت', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [session?.access_token, role]);
  const title = useMemo(() => editingId ? 'تعديل زر البوت' : 'إضافة زر جديد', [editingId]);
  const reset = () => { setDraft(emptyDraft); setEditingId(null); };

  const save = async () => {
    if (!draft.label.trim() || !draft.actionValue.trim()) { toast({ title: 'أكمل البيانات المطلوبة', description: 'اسم الزر والمحتوى أو الرابط مطلوبان.', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await request(editingId ? `/api/telegram/admin/menu-items/${editingId}` : '/api/telegram/admin/menu-items', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(draft) });
      toast({ title: editingId ? 'تم تحديث الزر' : 'تمت إضافة الزر', description: 'سينعكس التعديل عند فتح المستخدم القائمة الرئيسية في البوت.' });
      reset(); await load();
    } catch (error) { toast({ title: 'تعذر حفظ الزر', description: error instanceof Error ? error.message : undefined, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!window.confirm('هل تريد حذف هذا الزر من البوت؟')) return;
    try { await request(`/api/telegram/admin/menu-items/${id}`, { method: 'DELETE' }); toast({ title: 'تم حذف الزر' }); await load(); }
    catch (error) { toast({ title: 'تعذر حذف الزر', description: error instanceof Error ? error.message : undefined, variant: 'destructive' }); }
  };

  const updateSectionState = (sectionKey: string, patch: Partial<ManagedSection>) => setSections(current => current.map(section => section.sectionKey === sectionKey ? { ...section, ...patch } : section));
  const saveSection = async (section: ManagedSection) => {
    setSavingSection(section.sectionKey);
    try {
      const result = await request(`/api/telegram/admin/sections/${encodeURIComponent(section.sectionKey)}`, { method: 'PUT', body: JSON.stringify(section) });
      setSections(current => current.map(value => value.sectionKey === section.sectionKey ? result.section : value));
      toast({ title: 'تم تحديث القسم', description: 'سيظهر التعديل عند فتح المستخدم القائمة الرئيسية لاحقًا.' });
    } catch (error) { toast({ title: 'تعذر حفظ إعداد القسم', description: error instanceof Error ? error.message : undefined, variant: 'destructive' }); }
    finally { setSavingSection(null); }
  };

  const updateTemplateState = (messageKey: ManagedMessageTemplate['messageKey'], content: string) => setTemplates(current => current.map(template => template.messageKey === messageKey ? { ...template, content } : template));
  const saveTemplate = async (template: ManagedMessageTemplate) => {
    if (!template.content.trim()) { toast({ title: 'نص الرسالة مطلوب', variant: 'destructive' }); return; }
    setSavingTemplate(template.messageKey);
    try {
      const result = await request(`/api/telegram/admin/message-templates/${template.messageKey}`, { method: 'PUT', body: JSON.stringify({ content: template.content }) });
      setTemplates(current => current.map(value => value.messageKey === template.messageKey ? result.template : value));
      toast({ title: 'تم حفظ قالب الرسالة', description: 'سيظهر النص الجديد للمستخدمين عند التدفق المرتبط به.' });
    } catch (error) { toast({ title: 'تعذر حفظ قالب الرسالة', description: error instanceof Error ? error.message : undefined, variant: 'destructive' }); }
    finally { setSavingTemplate(null); }
  };

  const loadSources = async () => {
    setSourceLoading(true);
    try {
      const result = await request(`/api/telegram/admin/sources?q=${encodeURIComponent(sourceQuery)}&page=1`);
      setSources(result.sources ?? []); setSourceTotal(result.total ?? 0);
    } catch (error) { toast({ title: 'تعذر تحميل ملفات البوت', description: error instanceof Error ? error.message : undefined, variant: 'destructive' }); }
    finally { setSourceLoading(false); }
  };
  const updateSourceState = (id: number, patch: Partial<ManagedSource>) => setSources(current => current.map(source => source.id === id ? { ...source, ...patch } : source));
  const saveSource = async (source: ManagedSource) => {
    setSavingSource(source.id);
    try {
      const result = await request(`/api/telegram/admin/sources/${source.id}`, { method: 'PUT', body: JSON.stringify({ title: source.title, description: source.description, sortOrder: source.sortOrder, isFeatured: source.isFeatured }) });
      setSources(current => current.map(value => value.id === source.id ? result.source : value));
      toast({ title: 'تم تحديث بيانات الملف' });
    } catch (error) { toast({ title: 'تعذر تحديث الملف', description: error instanceof Error ? error.message : undefined, variant: 'destructive' }); }
    finally { setSavingSource(null); }
  };
  const removeSource = async (source: ManagedSource) => {
    if (!window.confirm(`سيُحذف «${source.title}» من فهرس البوت فقط، ولن يُحذف من Google Drive. هل تريد المتابعة؟`)) return;
    try { await request(`/api/telegram/admin/sources/${source.id}`, { method: 'DELETE' }); setSources(current => current.filter(value => value.id !== source.id)); setSourceTotal(total => Math.max(0, total - 1)); toast({ title: 'تم حذف الملف من فهرس البوت فقط' }); }
    catch (error) { toast({ title: 'تعذر حذف الملف', description: error instanceof Error ? error.message : undefined, variant: 'destructive' }); }
  };
  const uploadSource = async () => {
    if (!uploadFile || !uploadDraft.title.trim() || !uploadDraft.description.trim()) { toast({ title: 'أكمل بيانات الملف', description: 'اختر ملفًا واكتب اسم العرض والوصف.', variant: 'destructive' }); return; }
    if (uploadFile.size > 20 * 1024 * 1024) { toast({ title: 'حجم الملف كبير', description: 'الحد الإداري للرفع 20 ميغابايت لضمان التسليم الآمن داخل تيليغرام.', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const contentBase64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error('تعذر قراءة الملف')); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.readAsDataURL(uploadFile); });
      await request('/api/telegram/admin/sources/upload', { method: 'POST', body: JSON.stringify({ ...uploadDraft, fileName: uploadFile.name, contentType: uploadFile.type || 'application/octet-stream', contentBase64 }) });
      toast({ title: 'تم رفع الملف وإضافته إلى فهرس البوت', description: 'سيُرسل للمستخدمين كمستند داخل تيليغرام من دون عرض رابط التخزين.' });
      setUploadFile(null); setUploadDraft(emptyUploadDraft); await loadSources();
    } catch (error) { toast({ title: 'تعذر رفع الملف', description: error instanceof Error ? error.message : undefined, variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  return <AdminLayout><div className="space-y-7" dir="rtl">
    <section className="rounded-3xl bg-gradient-to-l from-indigo-700 via-blue-700 to-sky-600 p-7 text-white shadow-xl"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div className="flex gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Bot className="h-7 w-7" /></div><div><h1 className="text-2xl font-black">مركز إدارة بوت الناصر</h1><p className="mt-1 text-sm text-blue-100">اضبط ظهور الأقسام والأزرار والرسائل والروابط من مساحة إدارية واحدة.</p></div></div><a href="https://t.me/Moieen2025Bot" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700"><ExternalLink className="h-4 w-4" />فتح البوت</a></div></section>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><LayoutList className="h-5 w-5 text-primary" /><h2 className="font-black text-slate-800">الأقسام الأساسية</h2></div><p className="mt-1 text-xs leading-5 text-slate-500">يمكنك تعديل تسمية القسم أو ترتيبه أو إخفاؤه. لا تتغير قواعد الاشتراك الإلزامية أو حماية القسم المدفوع من هذه الشاشة.</p></div><span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{sections.filter(section => section.enabled).length} ظاهر</span></div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : <div className="grid gap-3 md:grid-cols-2">{sections.map(section => <article key={section.sectionKey} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${section.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{section.enabled ? 'ظاهر للمستخدمين' : 'مخفي'}</span><label className="flex items-center gap-2 text-xs font-bold text-slate-600">إظهار<input type="checkbox" checked={section.enabled} onChange={event => updateSectionState(section.sectionKey, { enabled: event.target.checked })} className="h-4 w-4 accent-primary" /></label></div><label className="mt-3 block text-xs font-bold text-slate-600">اسم القسم<input value={section.displayLabel} onChange={event => updateSectionState(section.sectionKey, { displayLabel: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary" /></label><div className="mt-3 flex items-end gap-3"><label className="block flex-1 text-xs font-bold text-slate-600">الترتيب<input type="number" value={section.sortOrder} onChange={event => updateSectionState(section.sectionKey, { sortOrder: Number(event.target.value) })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary" /></label><button onClick={() => void saveSection(section)} disabled={savingSection === section.sectionKey} className="flex h-10 items-center gap-1.5 rounded-xl bg-slate-800 px-3 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60">{savingSection === section.sectionKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}حفظ</button></div></article>)}</div>}
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-start gap-2"><FileText className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="font-black text-slate-800">قوالب الرسائل التعريفية</h2><p className="mt-1 text-xs leading-5 text-slate-500">تُدار رسائل الترحيب و«عن المكتبة» والمساعدة فقط. تبقى رسائل الاشتراك والتحقق والدفع محمية وثابتة.</p></div></div>{loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : <div className="grid gap-4 xl:grid-cols-3">{templates.map(template => <article key={template.messageKey} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><h3 className="font-bold text-slate-800">{template.title}</h3><textarea value={template.content} onChange={event => updateTemplateState(template.messageKey, event.target.value)} rows={8} className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none focus:border-primary" /><button onClick={() => void saveTemplate(template)} disabled={savingTemplate === template.messageKey} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60">{savingTemplate === template.messageKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}حفظ القالب</button></article>)}</div>}</section>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><h2 className="font-black text-slate-800">فهرس ملفات البوت</h2></div><p className="mt-1 text-xs leading-5 text-slate-500">ارفع ملفًا محليًا إلى تخزين البوت، أو ابحث في الملفات المسجلة لتعديل العرض. الحذف يزيل السجل من البوت فقط ولا يمس المصدر الأصلي.</p></div><div className="flex w-full gap-2 lg:w-[420px]"><input value={sourceQuery} onChange={event => setSourceQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void loadSources(); }} placeholder="ابحث باسم الملف أو وصفه" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-primary" /><button onClick={() => void loadSources()} disabled={sourceLoading} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-60">{sourceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}بحث</button></div></div><div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-4"><div className="mb-3 flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /><h3 className="text-sm font-black text-slate-800">رفع ملف جديد إلى البوت</h3><span className="text-[10px] text-slate-500">PDF وWord وExcel وTXT حتى 20 ميغابايت</span></div><div className="grid gap-3 lg:grid-cols-4"><label className="text-xs font-bold text-slate-600">الملف<input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={event => { const file = event.target.files?.[0] ?? null; setUploadFile(file); if (file && !uploadDraft.title) setUploadDraft(current => ({ ...current, title: file.name.replace(/\.[^.]+$/, '') })); }} className="mt-1.5 block w-full text-xs" /></label><label className="text-xs font-bold text-slate-600">اسم العرض<input value={uploadDraft.title} onChange={event => setUploadDraft({ ...uploadDraft, title: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary" /></label><label className="text-xs font-bold text-slate-600">القسم<select value={uploadDraft.collection} onChange={event => setUploadDraft({ ...uploadDraft, collection: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="judicial">القواعد القضائية</option><option value="legislation">التشريعات اليمنية</option><option value="legal_forms">نماذج وصيغ قانونية</option><option value="featured_references">مراجع مميزة</option><option value="illustrated_legal_forms">نماذج مصورة</option><option value="all_yemeni_laws">جميع القوانين اليمنية</option></select></label><label className="text-xs font-bold text-slate-600">التصنيف<select value={uploadDraft.category} onChange={event => setUploadDraft({ ...uploadDraft, category: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="general">عام</option><option value="fiqh">فقه</option><option value="civil">مدني</option><option value="commercial">تجاري</option><option value="procedure">إجراءات</option></select></label></div><div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_110px_auto]"><label className="text-xs font-bold text-slate-600">وصف الملف<textarea value={uploadDraft.description} onChange={event => setUploadDraft({ ...uploadDraft, description: event.target.value })} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-primary" /></label><label className="text-xs font-bold text-slate-600">الترتيب<input type="number" value={uploadDraft.sortOrder} onChange={event => setUploadDraft({ ...uploadDraft, sortOrder: Number(event.target.value) })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><button onClick={() => void uploadSource()} disabled={uploading} className="self-end flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white disabled:opacity-60">{uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}رفع وإضافة</button></div></div>{sources.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500">اكتب عبارة بحث ثم اضغط «بحث» لإدارة الملفات. لا تُحمّل القائمة كاملة تلقائيًا لحماية الأداء.</div> : <><p className="mb-3 text-xs text-slate-500">النتائج: {sourceTotal}</p><div className="space-y-3">{sources.map(source => <article key={source.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-600">{source.collection}</span><label className="flex items-center gap-2 text-xs font-bold text-slate-600">مميز<input type="checkbox" checked={source.isFeatured} onChange={event => updateSourceState(source.id, { isFeatured: event.target.checked })} className="h-4 w-4 accent-primary" /></label></div><div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_110px]"><label className="text-xs font-bold text-slate-600">اسم العرض<input value={source.title} onChange={event => updateSourceState(source.id, { title: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary" /></label><label className="text-xs font-bold text-slate-600">الترتيب<input type="number" value={source.sortOrder} onChange={event => updateSourceState(source.id, { sortOrder: Number(event.target.value) })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary" /></label></div><label className="mt-3 block text-xs font-bold text-slate-600">الوصف<textarea value={source.description} onChange={event => updateSourceState(source.id, { description: event.target.value })} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none focus:border-primary" /></label><div className="mt-3 flex gap-2"><button onClick={() => void saveSource(source)} disabled={savingSource === source.id} className="flex h-10 items-center gap-2 rounded-xl bg-slate-800 px-4 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60">{savingSource === source.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}حفظ الملف</button><button onClick={() => void removeSource(source)} className="flex h-10 items-center gap-2 rounded-xl bg-rose-50 px-4 text-xs font-bold text-rose-700 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" />حذف من البوت</button></div></article>)}</div></>}</section>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-2"><History className="h-5 w-5 text-primary" /><div><h2 className="font-black text-slate-800">سجل عمليات الإدارة</h2><p className="mt-1 text-xs text-slate-500">يسجل أحدث التعديلات على العناصر والأقسام، من دون إظهار أي رموز أو أسرار.</p></div></div>{loading ? <div className="flex justify-center py-7"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : logs.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">لا توجد عمليات مسجلة في هذا المركز حتى الآن.</p> : <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{logs.slice(0, 12).map(log => <div key={log.id} className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-600">{log.entityType === 'section' ? 'قسم' : 'زر'}</span><span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString('ar-YE')}</span></div><p className="mt-2 text-sm font-bold text-slate-800">{log.action === 'create' ? 'إضافة' : log.action === 'delete' ? 'حذف' : 'تعديل'} {log.entityId ? `#${log.entityId}` : ''}</p></div>)}</div>}</section>

    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-black text-slate-800">الأزرار المخصصة</h2><p className="mt-1 text-xs text-slate-500">تضاف إلى القائمة الرئيسية للبوت. الأزرار الأساسية والأمنية تبقى محمية.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{items.length} زر</span></div>{loading ? <div className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center"><Bot className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-bold text-slate-600">لا توجد أزرار مخصصة بعد</p><p className="mt-1 text-xs text-slate-400">استخدم النموذج لإضافة رابط أو رسالة جديدة للمستخدمين.</p></div> : <div className="space-y-3">{items.map(item => <article key={item.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">{item.actionType === 'url' ? <ExternalLink className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-800">{item.label}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{item.enabled ? 'ظاهر' : 'مخفي'}</span><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">{actionLabel(item.actionType)}</span></div><p className="mt-1 truncate text-xs text-slate-500">{item.actionValue}</p></div><button onClick={() => { setEditingId(item.id); setDraft({ label: item.label, actionType: item.actionType, actionValue: item.actionValue, rowIndex: item.rowIndex, sortOrder: item.sortOrder, enabled: item.enabled }); }} className="rounded-xl p-2 text-slate-500 hover:bg-white hover:text-primary"><Pencil className="h-4 w-4" /></button><button onClick={() => void remove(item.id)} className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></article>)}</div>}</section>
      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="font-black text-slate-800">{title}</h2>{editingId && <button onClick={reset} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}</div><div className="space-y-4"><label className="block text-sm font-bold text-slate-700">اسم الزر<input value={draft.label} onChange={event => setDraft({ ...draft, label: event.target.value })} placeholder="مثال: المكتبة الجديدة" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-primary" /></label><label className="block text-sm font-bold text-slate-700">نوع الإجراء<select value={draft.actionType} onChange={event => setDraft({ ...draft, actionType: event.target.value as Draft['actionType'] })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-primary"><option value="url">فتح رابط</option><option value="message">عرض رسالة</option></select></label><label className="block text-sm font-bold text-slate-700">{draft.actionType === 'url' ? 'الرابط' : 'نص الرسالة'}{draft.actionType === 'url' ? <input value={draft.actionValue} onChange={event => setDraft({ ...draft, actionValue: event.target.value })} placeholder="https://..." dir="ltr" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-primary" /> : <textarea value={draft.actionValue} onChange={event => setDraft({ ...draft, actionValue: event.target.value })} rows={5} placeholder="الرسالة التي يراها المستخدم" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-primary" />}</label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">ترتيب الصف<input type="number" value={draft.rowIndex} onChange={event => setDraft({ ...draft, rowIndex: Number(event.target.value) })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3" /></label><label className="text-xs font-bold text-slate-600">ترتيب الزر<input type="number" value={draft.sortOrder} onChange={event => setDraft({ ...draft, sortOrder: Number(event.target.value) })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3" /></label></div><label className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700">إظهار الزر للمستخدمين<input type="checkbox" checked={draft.enabled} onChange={event => setDraft({ ...draft, enabled: event.target.checked })} className="h-4 w-4 accent-primary" /></label><button disabled={saving} onClick={() => void save()} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{editingId ? 'حفظ التعديل' : 'إضافة إلى البوت'}</button>{!editingId && <div className="flex items-center gap-2 text-xs text-slate-400"><Plus className="h-3.5 w-3.5" />تُسجل جميع عمليات الإضافة والتعديل والحذف للمراجعة.</div>}</div></aside></div>
  </div></AdminLayout>;
}
