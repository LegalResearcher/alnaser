/**
 * DriveLibrary.tsx — المكتبة القانونية
 * منصة الناصر القانونية
 * Version 3.1 — دعم المحتوى المدفوع (is_premium) — إصلاح كامل
 *
 * منطق الاشتراك:
 *  1. عند فتح مجلد/ملف مدفوع → مودال كلمة المرور
 *  2. كلمة المرور تُتحقق منها مقابل review_passwords بنفس
 *     المنطق الذي يعمل في ExamStart (device_fingerprint + expires_at)
 *     مع subject_id مأخوذ من platform_settings (library_subject_id)
 *  3. إذا لم توجد كلمات مرور نشطة → مودال الاشتراك مباشرة
 *  4. الملفات المدفوعة تُعرض بمعاينة (5 صفحات) بدون زر تحميل
 *  5. عند نجاح كلمة المرور → يُفتح المجلد/الملف المعلّق تلقائياً
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  useAllFolders,
  useFolderFiles,
  DriveFolder,
  DriveFile,
} from '@/hooks/useDriveLibrary';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionMessage } from '@/hooks/useSubscriptionMessage';
import { cn } from '@/lib/utils';
import {
  Folder, FolderOpen, FileText, Scale, BookMarked, FileSignature,
  Gavel, Library, ChevronLeft, Download, ExternalLink, X, Search,
  BookOpen, Home, Loader2, FolderSearch, MessageSquareText, Lock, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────
// أنواع — نضيف is_premium للواجهات
// ─────────────────────────────────────────────────────────────
type DriveFolderX = DriveFolder & { is_premium?: boolean };
type DriveFileX   = DriveFile   & { is_premium?: boolean };

interface Crumb        { drive_id: string; name: string; }
interface SearchResult { type: 'folder'; item: DriveFolderX; path: string; }

// ─────────────────────────────────────────────────────────────
// مفتاح localStorage لحالة فتح المكتبة
// ─────────────────────────────────────────────────────────────
const LIBRARY_PWD_KEY = 'library_review_pwd_v2';

// ─────────────────────────────────────────────────────────────
// fingerprint الجهاز — نفس منطق ExamStart
// ─────────────────────────────────────────────────────────────
function getDeviceFingerprint(): string {
  try {
    let canvasHash = '';
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top'; ctx.font = '14px Arial';
        ctx.fillStyle = '#f60'; ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069'; ctx.fillText('alnaseer🔑', 2, 15);
        ctx.fillStyle = 'rgba(102,204,0,0.7)'; ctx.fillText('alnaseer🔑', 4, 17);
        canvasHash = canvas.toDataURL().slice(-40);
      }
    } catch { /* ignore */ }
    const nav = window.navigator;
    const raw = [nav.userAgent, nav.language, nav.platform, screen.width, screen.height, screen.colorDepth, new Date().getTimezoneOffset(), canvasHash].join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
    return `fp_${Math.abs(hash).toString(36)}`;
  } catch { return `fp_${Date.now().toString(36)}`; }
}

// ─────────────────────────────────────────────────────────────
// جلب library_subject_id من platform_settings
// ─────────────────────────────────────────────────────────────
async function getLibrarySubjectId(): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('platform_settings')
    .select('value')
    .eq('key', 'library_subject_id')
    .maybeSingle();
  return data?.value ?? null;
}

// ─────────────────────────────────────────────────────────────
// التحقق من review_password للمكتبة — نفس منطق ExamStart
// يُعيد: 'no_passwords' | 'expired' | 'wrong_device' | 'ok' | 'not_found'
// ─────────────────────────────────────────────────────────────
async function verifyLibraryPassword(
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

  // ربط الجهاز + تسجيل أول استخدام (نفس ExamStart)
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

// ─────────────────────────────────────────────────────────────
// ألوان الأقسام الجذرية
// ─────────────────────────────────────────────────────────────
const ROOT_COLORS = [
  { icon: 'text-blue-500',    bg: 'bg-blue-500/10',    hover: 'hover:border-blue-400/50 hover:bg-blue-500/[0.04]',    ring: 'focus-visible:ring-blue-400/50',    arrowHover: 'group-hover:text-blue-500'    },
  { icon: 'text-emerald-500', bg: 'bg-emerald-500/10', hover: 'hover:border-emerald-400/50 hover:bg-emerald-500/[0.04]', ring: 'focus-visible:ring-emerald-400/50', arrowHover: 'group-hover:text-emerald-500' },
  { icon: 'text-violet-500',  bg: 'bg-violet-500/10',  hover: 'hover:border-violet-400/50 hover:bg-violet-500/[0.04]',  ring: 'focus-visible:ring-violet-400/50',  arrowHover: 'group-hover:text-violet-500'  },
  { icon: 'text-amber-500',   bg: 'bg-amber-500/10',   hover: 'hover:border-amber-400/50 hover:bg-amber-500/[0.04]',   ring: 'focus-visible:ring-amber-400/50',   arrowHover: 'group-hover:text-amber-500'   },
  { icon: 'text-rose-500',    bg: 'bg-rose-500/10',    hover: 'hover:border-rose-400/50 hover:bg-rose-500/[0.04]',    ring: 'focus-visible:ring-rose-400/50',    arrowHover: 'group-hover:text-rose-500'    },
  { icon: 'text-cyan-500',    bg: 'bg-cyan-500/10',    hover: 'hover:border-cyan-400/50 hover:bg-cyan-500/[0.04]',    ring: 'focus-visible:ring-cyan-400/50',    arrowHover: 'group-hover:text-cyan-500'    },
];

function getFileIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('قانون') || n.includes('تشريع') || n.includes('نظام')) return Scale;
  if (n.includes('عقد') || n.includes('نموذج') || n.includes('صيغة') || n.includes('اتفاق')) return FileSignature;
  if (n.includes('قضاء') || n.includes('حكم') || n.includes('قاعدة') || n.includes('مبدأ')) return Gavel;
  if (n.includes('بحث') || n.includes('مقال') || n.includes('دراسة')) return BookMarked;
  if (n.includes('مكتبة') || n.includes('مرجع') || n.includes('فهرس')) return Library;
  return FileText;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function PremiumLabel() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
      <Crown className="w-2.5 h-2.5" /> مدفوع
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4 rounded" />
          <Skeleton className="h-2.5 w-1/3 rounded" />
        </div>
        <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// بطاقة مجلد جذري
// ─────────────────────────────────────────────────────────────
function RootFolderCard({ folder, colorIdx, childCount, onClick, searchQuery, isLocked }: {
  folder: DriveFolderX; colorIdx: number; childCount: number;
  onClick: () => void; searchQuery?: string; isLocked: boolean;
}) {
  const c = ROOT_COLORS[colorIdx % ROOT_COLORS.length];
  return (
    <button onClick={onClick}
      className={cn('group relative w-full text-right p-4 rounded-xl border border-border bg-card transition-all duration-250 focus-visible:outline-none focus-visible:ring-2',
        isLocked ? 'hover:border-amber-400/50 hover:bg-amber-500/[0.04] focus-visible:ring-amber-400/50' : `${c.hover} ${c.ring}`)}>
      <div className="flex items-center gap-3">
        <div className={cn('flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors', isLocked ? 'bg-amber-500/10' : c.bg)}>
          {isLocked ? <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            : <><Folder className={cn('w-5 h-5', c.icon, 'group-hover:hidden')} /><FolderOpen className={cn('w-5 h-5', c.icon, 'hidden group-hover:block')} /></>}
        </div>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 justify-end flex-wrap">
            {isLocked && <PremiumLabel />}
            <span className="text-sm font-bold text-foreground leading-snug line-clamp-2">
              {searchQuery ? <Highlight text={folder.name} query={searchQuery} /> : folder.name}
            </span>
          </div>
          <span className={cn('text-[11px] font-medium mt-0.5 block opacity-80',
            isLocked ? 'text-amber-600 dark:text-amber-400' : c.icon)}>
            {isLocked ? 'محتوى مدفوع — اضغط للاشتراك' : `${childCount} ${childCount === 1 ? 'عنصر' : 'عناصر'}`}
          </span>
        </div>
        <ChevronLeft className={cn('flex-shrink-0 w-4 h-4 text-muted-foreground/50 group-hover:-translate-x-0.5 transition-all',
          isLocked ? 'group-hover:text-amber-500' : c.arrowHover)} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// بطاقة مجلد عادي
// ─────────────────────────────────────────────────────────────
function FolderCard({ folder, childCount, onClick, searchQuery, isLocked }: {
  folder: DriveFolderX; childCount: number; onClick: () => void; searchQuery?: string; isLocked: boolean;
}) {
  return (
    <button onClick={onClick}
      className={cn('group relative w-full text-right p-4 rounded-xl border border-border bg-card transition-all duration-250 focus-visible:outline-none focus-visible:ring-2',
        isLocked
          ? 'hover:border-amber-400/40 hover:bg-amber-500/[0.03] focus-visible:ring-amber-400/50'
          : 'hover:border-primary/40 hover:shadow-card hover:bg-primary/[0.03] focus-visible:ring-primary/50')}>
      <div className="flex items-center gap-3">
        <div className={cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
          isLocked ? 'bg-amber-500/10 group-hover:bg-amber-500/20' : 'bg-primary/10 group-hover:bg-primary/20')}>
          {isLocked ? <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            : <><Folder className="w-5 h-5 text-primary group-hover:hidden" /><FolderOpen className="w-5 h-5 text-primary hidden group-hover:block" /></>}
        </div>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 justify-end flex-wrap">
            {isLocked && <PremiumLabel />}
            <span className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
              {searchQuery ? <Highlight text={folder.name} query={searchQuery} /> : folder.name}
            </span>
          </div>
          {childCount > 0 && (
            <span className={cn('text-[11px] font-medium mt-0.5 block', isLocked ? 'text-amber-600/70' : 'text-primary/70')}>
              {isLocked ? 'محتوى مدفوع' : `${childCount} ${childCount === 1 ? 'عنصر' : 'عناصر'}`}
            </span>
          )}
        </div>
        <ChevronLeft className={cn('flex-shrink-0 w-4 h-4 text-muted-foreground/50 group-hover:-translate-x-0.5 transition-all',
          isLocked ? 'group-hover:text-amber-500' : 'group-hover:text-primary')} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// بطاقة ملف
// ─────────────────────────────────────────────────────────────
function FileCard({ file, onClick, searchQuery }: {
  file: DriveFileX; onClick: () => void; searchQuery?: string;
}) {
  const IconComponent = getFileIcon(file.name);
  const cleanName = file.name.replace(/\.pdf$/i, '');
  const isLocked = !!file.is_premium;
  return (
    <button onClick={onClick}
      className={cn('group relative w-full text-right p-4 rounded-xl border border-border bg-card transition-all duration-250 focus-visible:outline-none focus-visible:ring-2',
        isLocked
          ? 'hover:border-amber-400/40 hover:bg-amber-500/[0.03] focus-visible:ring-amber-400/50'
          : 'hover:border-emerald-400/40 hover:shadow-card hover:bg-emerald-500/[0.03] focus-visible:ring-emerald-400/50')}>
      <div className="flex items-center gap-3">
        <div className={cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
          isLocked ? 'bg-amber-500/10 group-hover:bg-amber-500/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20')}>
          {isLocked ? <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            : <IconComponent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        </div>
        <span className="flex-1 text-sm font-medium text-foreground leading-relaxed line-clamp-2 text-right">
          {searchQuery ? <Highlight text={cleanName} query={searchQuery} /> : cleanName}
        </span>
        {isLocked
          ? <PremiumLabel />
          : <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">PDF</span>
        }
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// عارض PDF — مع قيد لوضع المعاينة (بدون تحميل)
// ─────────────────────────────────────────────────────────────
function PdfViewer({ file, isPremiumUnlocked, onClose, onRequestAccess }: {
  file: DriveFileX; isPremiumUnlocked: boolean;
  onClose: () => void; onRequestAccess: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const embedSrc = file.embed_url || file.view_url || '';
  const cleanName = file.name.replace(/\.pdf$/i, '');
  // الملف مقيّد إذا كان مدفوعاً والمستخدم ليس مشتركاً
  const isPreviewOnly = !!file.is_premium && !isPremiumUnlocked;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/97 backdrop-blur-md animate-fade-in">
      {/* شريط العنوان */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card/90 shadow-card-md">
        <Button variant="ghost" size="icon" onClick={onClose}
          className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted shrink-0" title="إغلاق (Escape)">
          <X className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
            isPreviewOnly ? 'bg-amber-500/10' : 'bg-emerald-500/10')}>
            {isPreviewOnly
              ? <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              : <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
          </div>
          <span className="text-sm font-semibold text-foreground line-clamp-1">{cleanName}</span>
          {isPreviewOnly && <PremiumLabel />}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {file.view_url && (
            <a href={file.view_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors border border-border">
              <ExternalLink className="w-3.5 h-3.5" /><span className="hidden sm:inline">فتح خارجياً</span>
            </a>
          )}
          {/* زر التحميل — مخفي للمحتوى المدفوع غير المفتوح */}
          {file.download_url && !isPreviewOnly && (
            <a href={file.download_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-primary">
              <Download className="w-3.5 h-3.5" /><span>تحميل</span>
            </a>
          )}
          {isPreviewOnly && (
            <button onClick={onRequestAccess}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', boxShadow: '0 3px 10px rgba(217,119,6,0.4)' }}>
              <Crown className="w-3.5 h-3.5" /><span>اشترك للتحميل</span>
            </button>
          )}
        </div>
      </div>

      {/* iframe */}
      <div className="relative flex-1 overflow-hidden bg-muted/30">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-border shadow-card-md">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-semibold text-foreground">جارٍ تحميل المستند…</p>
            </div>
          </div>
        )}
        {embedSrc ? (
          <iframe src={embedSrc} className="w-full h-full border-0"
            title={file.name} onLoad={() => setLoading(false)} allow="autoplay" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <FileText className="w-8 h-8 text-muted-foreground/50" />
            <p className="font-semibold text-foreground">تعذّر عرض الملف هنا</p>
          </div>
        )}
        {/* شريط وضع المعاينة */}
        {isPreviewOnly && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-amber-200 dark:border-amber-800/50"
            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-800 dark:text-amber-400">وضع المعاينة المحدودة (5 صفحات)</p>
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-500">اشترك للوصول الكامل وتحميل الملف</p>
                </div>
              </div>
              <button onClick={onRequestAccess}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-black text-white"
                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                اشتراك
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// مودال كلمة مرور المكتبة — نفس منطق ExamStart تماماً
// ─────────────────────────────────────────────────────────────
function LibraryPasswordModal({ onSuccess, onSubscribe, onClose }: {
  onSuccess: () => void; onSubscribe: () => void; onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) return;
    setLoading(true); setError('');
    try {
      const fingerprint = getDeviceFingerprint();

      // 1. جلب subject_id الخاص بالمكتبة من platform_settings
      const subjectId = await getLibrarySubjectId();

      if (!subjectId) {
        // المسؤول لم يُعيّن subject_id للمكتبة بعد → نقبل أي كلمة مرور نشطة
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

      // 2. التحقق بـ subject_id المحدد — نفس منطق handleConfirmReviewPassword في ExamStart
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
              في هذا الوضع ستظهر لك <span className="font-black">الوثائق الكاملة</span> مع إمكانية التحميل — أدخل رمز التفعيل الخاص بك.
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

// ─────────────────────────────────────────────────────────────
// مودال الاشتراك — نفس نموذج ExamStart
// ─────────────────────────────────────────────────────────────
function LibrarySubscriptionModal({ fileName, onClose }: {
  fileName: string; onClose: () => void;
}) {
  const subMsg = useSubscriptionMessage();
  const { toast } = useToast();
  const [studentName, setStudentName]     = useState('');
  const [phone, setPhone]                 = useState('');
  const [wallet, setWallet]               = useState<string | null>(null);
  const [receiptFile, setReceiptFile]     = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [success, setSuccess]             = useState(false);

  const handleSend = async () => {
    if (!studentName.trim() || !phone.trim()) return;
    if (phone.trim().length < 7) {
      toast({ title: 'رقم الهاتف غير صحيح', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // 1. رفع الإيصال إن وُجد
      let receiptUrl: string | null = null;
      if (receiptFile) {
        const ext = receiptFile.name.split('.').pop();
        const fName = `receipts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('payment-receipts').upload(fName, receiptFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('payment-receipts').getPublicUrl(fName);
          receiptUrl = urlData?.publicUrl ?? null;
        }
      }

      // 2. جلب library_subject_id من الإعدادات
      const libSubjectId = await getLibrarySubjectId();

      // 3. إدراج الطلب في payment_requests (نفس منطق SubscribeButton)
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

      // 4. إرسال إشعار Telegram
      await supabase.functions.invoke('send-telegram', {
        body: {
          message: `🔔 <b>طلب اشتراك جديد (المكتبة)</b>\n\n👤 ${studentName.trim()}\n📱 ${phone.trim()}\n📄 الملف: ${fileName}${wallet ? `\n💳 المحفظة: ${wallet}` : ''}${receiptUrl ? `\n🖼 الإيصال: ${receiptUrl}` : ''}\n💰 المبلغ: ${subMsg.fee}\n\n⏳ في انتظار التأكيد من لوحة التحكم`,
        },
      });

      setSuccess(true);
    } catch (e: any) {
      toast({ title: 'فشل إرسال الطلب', description: e?.message || 'حاول مجدداً', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const allLines    = subMsg.note.split(/\n|(?<=\.)(?=\s*\S)/).map((l: string) => l.trim()).filter(Boolean);
  const featureLines = allLines.filter((l: string) => !l.endsWith('**'));
  const alertLines   = allLines.filter((l: string) => l.endsWith('**')).map((l: string) => l.slice(0, -2).trim());

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90dvh] flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-l from-blue-500 via-indigo-500 to-blue-700 shrink-0" />
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* رأس */}
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
              {/* رسوم + مزايا — نفس ExamStart */}
              <div className="space-y-2">
                <p className="text-xs font-black text-blue-700 dark:text-blue-400 text-right">
                  💰 الرسوم: <span className="text-base">{subMsg.fee}</span>
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

              {/* اختيار المحفظة */}
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
                    <label htmlFor="lib-receipt-upload"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all font-black text-sm text-slate-600 dark:text-slate-300">
                      📁 {receiptFile ? receiptFile.name : 'رفع صورة إيصال الإيداع'}
                    </label>
                    <input id="lib-receipt-upload" type="file" accept="image/*" className="hidden"
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

// ─────────────────────────────────────────────────────────────
// نتائج البحث
// ─────────────────────────────────────────────────────────────
function SearchResults({ results, query, onFolderClick, isPremiumUnlocked }: {
  results: SearchResult[]; query: string;
  onFolderClick: (folder: DriveFolderX) => void; isPremiumUnlocked: boolean;
}) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <FolderSearch className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="font-semibold text-foreground mb-1">لا توجد نتائج</p>
        <p className="text-sm text-muted-foreground">لم يُعثر على مجلد يطابق "<span className="text-foreground font-medium">{query}</span>"</p>
      </div>
    );
  }
  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-xs font-semibold text-muted-foreground">
        {results.length} {results.length === 1 ? 'نتيجة' : 'نتائج'} لـ "<span className="text-foreground">{query}</span>"
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {results.map((r) => (
          <div key={r.item.drive_id}>
            <FolderCard folder={r.item} childCount={0} onClick={() => onFolderClick(r.item)}
              searchQuery={query} isLocked={!!r.item.is_premium && !isPremiumUnlocked} />
            {r.path && <p className="text-[10px] text-muted-foreground/60 mt-1 pr-1 truncate">📂 {r.path}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// محتوى المجلد
// ─────────────────────────────────────────────────────────────
function FolderContent({ currentFolderId, allFolders, isPremiumUnlocked, onFolderClick, onFileClick }: {
  currentFolderId: string; allFolders: DriveFolderX[]; isPremiumUnlocked: boolean;
  onFolderClick: (folder: DriveFolderX) => void; onFileClick: (file: DriveFileX) => void;
}) {
  const subFolders = useMemo(
    () => allFolders.filter(f => f.parent_id === currentFolderId).sort((a, b) => a.order_index - b.order_index),
    [allFolders, currentFolderId]
  );
  const { data: files = [], isLoading: filesLoading } = useFolderFiles(currentFolderId);
  const filesX = files as DriveFileX[];
  const isEmpty = !filesLoading && subFolders.length === 0 && filesX.length === 0;

  const childCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    subFolders.forEach(sf => { map[sf.drive_id] = allFolders.filter(f => f.parent_id === sf.drive_id).length; });
    return map;
  }, [subFolders, allFolders]);

  return (
    <div className="space-y-6 animate-fade-in">
      {subFolders.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5" /> المجلدات
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {subFolders.map(folder => (
              <FolderCard key={folder.drive_id} folder={folder}
                childCount={childCountMap[folder.drive_id] ?? 0}
                onClick={() => onFolderClick(folder)}
                isLocked={!!folder.is_premium && !isPremiumUnlocked} />
            ))}
          </div>
        </section>
      )}
      {filesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filesX.length > 0 ? (
        <section>
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> الوثائق والملفات
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filesX.map(file => (
              <FileCard key={file.drive_id} file={file} onClick={() => onFileClick(file)} />
            ))}
          </div>
        </section>
      ) : null}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="w-8 h-8 text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-foreground mb-1">هذا القسم فارغ حالياً</p>
          <p className="text-sm text-muted-foreground">سيتم إضافة الوثائق قريباً</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// الصفحة الرئيسية
// ─────────────────────────────────────────────────────────────
export default function DriveLibrary() {
  const { data: allFolders = [], isLoading: foldersLoading } = useAllFolders();
  const foldersX = allFolders as DriveFolderX[];

  const [breadcrumbs, setBreadcrumbs]         = useState<Crumb[]>([]);
  const [openFile, setOpenFile]               = useState<DriveFileX | null>(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const searchRef                             = useRef<HTMLInputElement>(null);

  // ── حالة الاشتراك ──
  const [isPremiumUnlocked, setIsPremiumUnlocked]       = useState(false);
  const [showPasswordModal, setShowPasswordModal]       = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  // العنصر المعلّق (مجلد أو ملف) في انتظار التحقق
  const [pendingFolder, setPendingFolder] = useState<DriveFolderX | null>(null);
  const [pendingFile,   setPendingFile]   = useState<DriveFileX   | null>(null);

  // ── التحقق من كلمة المرور المحفوظة عند التحميل ──
  useEffect(() => {
    const saved = localStorage.getItem(LIBRARY_PWD_KEY);
    if (!saved) return;
    try {
      const { pwd, fp, subjectId: savedSubjectId } = JSON.parse(saved);
      if (fp !== getDeviceFingerprint()) { localStorage.removeItem(LIBRARY_PWD_KEY); return; }
      // تحقق من DB
      const query = (supabase as any).from('review_passwords')
        .select('id, expires_at')
        .eq('password', pwd)
        .eq('is_active', true);
      if (savedSubjectId) query.eq('subject_id', savedSubjectId);
      query.maybeSingle().then(({ data }: any) => {
        if (data && !(data.expires_at && new Date(data.expires_at) < new Date())) {
          setIsPremiumUnlocked(true);
        } else {
          localStorage.removeItem(LIBRARY_PWD_KEY);
        }
      });
    } catch { localStorage.removeItem(LIBRARY_PWD_KEY); }
  }, []);

  const currentFolderId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].drive_id : null;

  const rootFolders = useMemo(
    () => foldersX.filter(f => !f.parent_id || f.depth === 0).sort((a, b) => a.order_index - b.order_index),
    [foldersX]
  );
  const stats = useMemo(() => ({ totalFolders: foldersX.length, rootCount: rootFolders.length }), [foldersX, rootFolders]);
  const rootChildCount = useMemo(() => {
    const map: Record<string, number> = {};
    rootFolders.forEach(rf => { map[rf.drive_id] = foldersX.filter(f => f.parent_id === rf.drive_id).length; });
    return map;
  }, [rootFolders, foldersX]);

  const folderPathMap = useMemo(() => {
    const map: Record<string, string> = {};
    const buildPath = (folderId: string | null, depth = 0): string => {
      if (!folderId || depth > 10) return '';
      const folder = foldersX.find(f => f.drive_id === folderId);
      if (!folder) return '';
      const parentPath = buildPath(folder.parent_id, depth + 1);
      return parentPath ? `${parentPath} / ${folder.name}` : folder.name;
    };
    foldersX.forEach(f => { map[f.drive_id] = buildPath(f.parent_id); });
    return map;
  }, [foldersX]);

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) return [];
    const lower = q.toLowerCase();
    return foldersX
      .filter(f => f.name.toLowerCase().includes(lower))
      .map(f => ({ type: 'folder' as const, item: f, path: folderPathMap[f.drive_id] || '' }));
  }, [searchQuery, foldersX, folderPathMap]);

  const isSearching = searchQuery.trim().length >= 2;

  // ── فتح مجلد ──
  const handleFolderClick = (folder: DriveFolderX) => {
    if (folder.is_premium && !isPremiumUnlocked) {
      // نحفظ المجلد المعلّق ونفتح مودال كلمة المرور
      setPendingFolder(folder);
      setPendingFile(null);
      setShowPasswordModal(true);
      return;
    }
    setSearchQuery('');
    setBreadcrumbs(prev => [...prev, { drive_id: folder.drive_id, name: folder.name }]);
  };

  // ── فتح ملف ──
  const handleFileClick = (file: DriveFileX) => {
    if (file.is_premium && !isPremiumUnlocked) {
      // ملف مدفوع وغير مشترك:
      // نحفظ الملف معلّقاً ونفتح مودال كلمة المرور
      // (يفتح عارض PDF تلقائياً بعد نجاح التحقق)
      setPendingFile(file);
      setPendingFolder(null);
      setShowPasswordModal(true);
    } else {
      // مجاني أو مشترك → نفتح العارض مباشرة
      setOpenFile(file);
    }
  };

  // ── نجاح كلمة المرور ──
  const handlePasswordSuccess = () => {
    setIsPremiumUnlocked(true);
    setShowPasswordModal(false);

    // فتح العنصر المعلّق
    if (pendingFolder) {
      setSearchQuery('');
      setBreadcrumbs(prev => [...prev, { drive_id: pendingFolder.drive_id, name: pendingFolder.name }]);
      setPendingFolder(null);
    } else if (pendingFile) {
      setOpenFile(pendingFile);
      setPendingFile(null);
    }
  };

  // ── طلب الوصول من داخل عارض PDF ──
  const handleRequestAccessFromViewer = () => {
    const file = openFile;
    setOpenFile(null);
    setPendingFile(file);
    setPendingFolder(null);
    setShowPasswordModal(true);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) setBreadcrumbs([]);
    else setBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  // ── Ctrl+K ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const pendingName = pendingFile?.name?.replace(/\.pdf$/i, '') ?? pendingFolder?.name ?? 'المكتبة المدفوعة';

  return (
    <MainLayout>
      {/* ══ رأس الصفحة ══ */}
      <div className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30 shadow-card">
        <div className="container max-w-5xl py-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-black text-foreground leading-tight">المكتبة القانونية</h1>
                <p className="text-[11px] text-muted-foreground">قواعد قضائية · قوانين · أبحاث · صيغ ونماذج</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isPremiumUnlocked && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                  <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400">مشترك</span>
                </div>
              )}
              {!foldersLoading && stats.rootCount > 0 && (
                <div className="hidden sm:flex items-center gap-4 text-center shrink-0">
                  <div>
                    <p className="text-lg font-black text-primary leading-none">{stats.rootCount}</p>
                    <p className="text-[10px] text-muted-foreground">قسم</p>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div>
                    <p className="text-lg font-black text-foreground leading-none">{stats.totalFolders}</p>
                    <p className="text-[10px] text-muted-foreground">مجلد</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input ref={searchRef} type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المكتبة… (Ctrl+K)"
              className="w-full h-10 pr-10 pl-10 text-sm rounded-xl border bg-background/60 border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/60 text-right" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isSearching && (
            <nav aria-label="مسار التنقل" className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
              <button onClick={() => handleBreadcrumbClick(-1)}
                className={cn('flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0',
                  breadcrumbs.length === 0 ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
                <Home className="w-3 h-3 shrink-0" /><span>الرئيسية</span>
              </button>
              {breadcrumbs.map((crumb, idx) => (
                <span key={crumb.drive_id} className="flex items-center gap-1 shrink-0">
                  <ChevronLeft className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                  <button onClick={() => handleBreadcrumbClick(idx)}
                    className={cn('text-xs px-2.5 py-1 rounded-lg transition-colors max-w-[160px] truncate whitespace-nowrap',
                      idx === breadcrumbs.length - 1 ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
                    title={crumb.name}>{crumb.name}</button>
                </span>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* ══ المحتوى ══ */}
      <div className="container max-w-5xl py-6">
        {foldersLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {!foldersLoading && isSearching && (
          <SearchResults results={searchResults} query={searchQuery.trim()}
            onFolderClick={handleFolderClick} isPremiumUnlocked={isPremiumUnlocked} />
        )}

        {!foldersLoading && !isSearching && currentFolderId === null && (
          rootFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mb-5" />
              <h2 className="text-base font-bold text-foreground mb-2">المكتبة فارغة حالياً</h2>
              <p className="text-sm text-muted-foreground mb-4">سيتم إضافة الوثائق والقوانين قريباً.</p>
              <a href="https://t.me/MuenAlnaser" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                <MessageSquareText className="w-4 h-4" /> تواصل معنا لاقتراح محتوى
              </a>
            </div>
          ) : (
            <div className="animate-fade-in">
              <p className="text-xs font-semibold text-muted-foreground mb-4 flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5" /> أقسام المكتبة
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rootFolders.map((folder, idx) => (
                  <RootFolderCard key={folder.drive_id} folder={folder} colorIdx={idx}
                    childCount={rootChildCount[folder.drive_id] ?? 0}
                    onClick={() => handleFolderClick(folder)}
                    isLocked={!!folder.is_premium && !isPremiumUnlocked} />
                ))}
              </div>
            </div>
          )
        )}

        {!foldersLoading && !isSearching && currentFolderId !== null && (
          <FolderContent
            currentFolderId={currentFolderId}
            allFolders={foldersX}
            isPremiumUnlocked={isPremiumUnlocked}
            onFolderClick={handleFolderClick}
            onFileClick={handleFileClick}
          />
        )}
      </div>

      {/* ══ عارض PDF ══ */}
      {openFile && (
        <PdfViewer
          file={openFile}
          isPremiumUnlocked={isPremiumUnlocked}
          onClose={() => setOpenFile(null)}
          onRequestAccess={handleRequestAccessFromViewer}
        />
      )}

      {/* ══ مودال كلمة المرور ══ */}
      {showPasswordModal && (
        <LibraryPasswordModal
          onSuccess={handlePasswordSuccess}
          onSubscribe={() => {
            setShowPasswordModal(false);
            setShowSubscriptionModal(true);
          }}
          onClose={() => {
            setShowPasswordModal(false);
            setPendingFolder(null);
            setPendingFile(null);
          }}
        />
      )}

      {/* ══ مودال الاشتراك ══ */}
      {showSubscriptionModal && (
        <LibrarySubscriptionModal
          fileName={pendingName}
          onClose={() => {
            setShowSubscriptionModal(false);
            setPendingFolder(null);
            setPendingFile(null);
          }}
        />
      )}
    </MainLayout>
  );
}
