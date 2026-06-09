/**
 * DriveLibrary.tsx — المكتبة القانونية
 * منصة الناصر القانونية
 * Version 2.0 — World-Class Upgrade
 *
 * التحسينات:
 *  1. بحث فوري عبر كل المجلدات والملفات
 *  2. إحصائيات المحتوى في رأس الصفحة
 *  3. أيقونات ملفات ذكية حسب نوع المحتوى
 *  4. عداد الأبناء في كل بطاقة مجلد
 *  5. Breadcrumb مع overflow-x-auto للموبايل
 *  6. عارض PDF مع زر فتح خارجي + Escape للإغلاق
 *  7. حالة فارغة موجِّهة للمستخدم
 *  8. تمييز بصري للأقسام الجذرية بألوان مختلفة
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  useAllFolders,
  useFolderFiles,
  DriveFolder,
  DriveFile,
} from '@/hooks/useDriveLibrary';
import { cn } from '@/lib/utils';
import {
  Folder,
  FolderOpen,
  FileText,
  Scale,
  BookMarked,
  FileSignature,
  Gavel,
  Library,
  ChevronLeft,
  Download,
  ExternalLink,
  X,
  Search,
  BookOpen,
  Home,
  Loader2,
  FolderSearch,
  MessageSquareText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ─────────────────────────────────────────────────────────────
// أنواع
// ─────────────────────────────────────────────────────────────
interface Crumb {
  drive_id: string;
  name: string;
}

interface SearchResult {
  type: 'folder';
  item: DriveFolder;
  path: string; // مسار المجلد الأب
}

// ─────────────────────────────────────────────────────────────
// ألوان الأقسام الجذرية (تتكرر دورياً)
// ─────────────────────────────────────────────────────────────
const ROOT_COLORS = [
  { icon: 'text-blue-500',    bg: 'bg-blue-500/10',    hover: 'hover:border-blue-400/50 hover:bg-blue-500/[0.04]',    ring: 'focus-visible:ring-blue-400/50',    arrowHover: 'group-hover:text-blue-500'    },
  { icon: 'text-emerald-500', bg: 'bg-emerald-500/10', hover: 'hover:border-emerald-400/50 hover:bg-emerald-500/[0.04]', ring: 'focus-visible:ring-emerald-400/50', arrowHover: 'group-hover:text-emerald-500' },
  { icon: 'text-violet-500',  bg: 'bg-violet-500/10',  hover: 'hover:border-violet-400/50 hover:bg-violet-500/[0.04]',  ring: 'focus-visible:ring-violet-400/50',  arrowHover: 'group-hover:text-violet-500'  },
  { icon: 'text-amber-500',   bg: 'bg-amber-500/10',   hover: 'hover:border-amber-400/50 hover:bg-amber-500/[0.04]',   ring: 'focus-visible:ring-amber-400/50',   arrowHover: 'group-hover:text-amber-500'   },
  { icon: 'text-rose-500',    bg: 'bg-rose-500/10',    hover: 'hover:border-rose-400/50 hover:bg-rose-500/[0.04]',    ring: 'focus-visible:ring-rose-400/50',    arrowHover: 'group-hover:text-rose-500'    },
  { icon: 'text-cyan-500',    bg: 'bg-cyan-500/10',    hover: 'hover:border-cyan-400/50 hover:bg-cyan-500/[0.04]',    ring: 'focus-visible:ring-cyan-400/50',    arrowHover: 'group-hover:text-cyan-500'    },
];

// ─────────────────────────────────────────────────────────────
// أيقونة ذكية حسب اسم الملف / المجلد
// ─────────────────────────────────────────────────────────────
function getFileIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('قانون') || n.includes('تشريع') || n.includes('نظام'))
    return Scale;
  if (n.includes('عقد') || n.includes('نموذج') || n.includes('صيغة') || n.includes('اتفاق'))
    return FileSignature;
  if (n.includes('قضاء') || n.includes('حكم') || n.includes('قاعدة') || n.includes('مبدأ'))
    return Gavel;
  if (n.includes('بحث') || n.includes('مقال') || n.includes('دراسة'))
    return BookMarked;
  if (n.includes('مكتبة') || n.includes('مرجع') || n.includes('فهرس'))
    return Library;
  return FileText;
}

// ─────────────────────────────────────────────────────────────
// تمييز نص البحث
// ─────────────────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// مكوّن: بطاقة مجلد جذري (مع لون + عداد أبناء)
// ─────────────────────────────────────────────────────────────
function RootFolderCard({
  folder,
  colorIdx,
  childCount,
  onClick,
  searchQuery,
}: {
  folder: DriveFolder;
  colorIdx: number;
  childCount: number;
  onClick: () => void;
  searchQuery?: string;
}) {
  const c = ROOT_COLORS[colorIdx % ROOT_COLORS.length];
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-right p-4 rounded-xl border border-border bg-card',
        c.hover,
        'transition-all duration-250 ease-smooth focus-visible:outline-none',
        c.ring, 'focus-visible:ring-2'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200', c.bg)}>
          <Folder className={cn('w-5 h-5', c.icon, 'group-hover:hidden')} />
          <FolderOpen className={cn('w-5 h-5', c.icon, 'hidden group-hover:block')} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <span className="block text-sm font-bold text-foreground leading-snug line-clamp-2">
            {searchQuery ? <Highlight text={folder.name} query={searchQuery} /> : folder.name}
          </span>
          {childCount > 0 && (
            <span className={cn('text-[11px] font-medium mt-0.5 block', c.icon, 'opacity-80')}>
              {childCount} {childCount === 1 ? 'عنصر' : 'عناصر'}
            </span>
          )}
        </div>
        <ChevronLeft className={cn('flex-shrink-0 w-4 h-4 text-muted-foreground/50 group-hover:-translate-x-0.5 transition-all duration-200', c.arrowHover)} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// مكوّن: بطاقة مجلد عادي
// ─────────────────────────────────────────────────────────────
function FolderCard({
  folder,
  childCount,
  onClick,
  searchQuery,
}: {
  folder: DriveFolder;
  childCount: number;
  onClick: () => void;
  searchQuery?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-right p-4 rounded-xl border border-border bg-card',
        'hover:border-primary/40 hover:shadow-card hover:bg-primary/[0.03]',
        'transition-all duration-250 ease-smooth focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
          <Folder className="w-5 h-5 text-primary group-hover:hidden" />
          <FolderOpen className="w-5 h-5 text-primary hidden group-hover:block" />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <span className="block text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {searchQuery ? <Highlight text={folder.name} query={searchQuery} /> : folder.name}
          </span>
          {childCount > 0 && (
            <span className="text-[11px] font-medium text-primary/70 mt-0.5 block">
              {childCount} {childCount === 1 ? 'عنصر' : 'عناصر'}
            </span>
          )}
        </div>
        <ChevronLeft className="flex-shrink-0 w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:-translate-x-0.5 transition-all duration-200" />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// مكوّن: بطاقة ملف
// ─────────────────────────────────────────────────────────────
function FileCard({
  file,
  onClick,
  searchQuery,
}: {
  file: DriveFile;
  onClick: () => void;
  searchQuery?: string;
}) {
  const IconComponent = getFileIcon(file.name);
  const cleanName = file.name.replace(/\.pdf$/i, '');
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-right p-4 rounded-xl border border-border bg-card',
        'hover:border-emerald-400/40 hover:shadow-card hover:bg-emerald-500/[0.03]',
        'transition-all duration-250 ease-smooth focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-emerald-400/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors duration-200">
          <IconComponent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="flex-1 text-sm font-medium text-foreground leading-relaxed line-clamp-2 text-right">
          {searchQuery ? <Highlight text={cleanName} query={searchQuery} /> : cleanName}
        </span>
        <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          PDF
        </span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// مكوّن: Skeleton
// ─────────────────────────────────────────────────────────────
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
// مكوّن: عارض PDF
// ─────────────────────────────────────────────────────────────
function PdfViewer({ file, onClose }: { file: DriveFile; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const embedSrc = file.embed_url || file.view_url || '';
  const cleanName = file.name.replace(/\.pdf$/i, '');

  // إغلاق بـ Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/97 backdrop-blur-md animate-fade-in">
      {/* شريط العنوان */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card/90 shadow-card-md">
        {/* إغلاق */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          title="إغلاق (Escape)"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* اسم الملف */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-foreground line-clamp-1">
            {cleanName}
          </span>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-2 shrink-0">
          {/* فتح خارجي */}
          {(file.view_url) && (
            <a
              href={file.view_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
                'bg-muted text-foreground hover:bg-muted/80',
                'transition-colors duration-200 border border-border'
              )}
              title="فتح في تبويب جديد"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">فتح خارجياً</span>
            </a>
          )}
          {/* تحميل */}
          {file.download_url && (
            <a
              href={file.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'transition-colors duration-200 shadow-primary'
              )}
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل</span>
            </a>
          )}
        </div>
      </div>

      {/* iframe */}
      <div className="relative flex-1 overflow-hidden bg-muted/30">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-border shadow-card-md">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground mb-1">جارٍ تحميل المستند</p>
                <p className="text-xs text-muted-foreground">قد يستغرق بعض الوقت…</p>
              </div>
            </div>
          </div>
        )}
        {embedSrc ? (
          <iframe
            src={embedSrc}
            className="w-full h-full border-0"
            title={file.name}
            onLoad={() => setLoading(false)}
            allow="autoplay"
          />
        ) : (
          // حالة: لا يوجد رابط عرض
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">تعذّر عرض الملف هنا</p>
              <p className="text-sm text-muted-foreground mb-4">يمكنك فتحه في متصفحك أو تحميله مباشرة.</p>
              {file.download_url && (
                <a
                  href={file.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  تحميل الملف
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// مكوّن: نتائج البحث
// ─────────────────────────────────────────────────────────────
function SearchResults({
  results,
  query,
  onFolderClick,
}: {
  results: SearchResult[];
  query: string;
  onFolderClick: (folder: DriveFolder) => void;
}) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <FolderSearch className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="font-semibold text-foreground mb-1">لا توجد نتائج</p>
        <p className="text-sm text-muted-foreground">
          لم يُعثر على مجلد يطابق "
          <span className="text-foreground font-medium">{query}</span>"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-xs font-semibold text-muted-foreground">
        {results.length} {results.length === 1 ? 'نتيجة' : 'نتائج'} لـ "
        <span className="text-foreground">{query}</span>"
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {results.map((r) => (
          <div key={r.item.drive_id}>
            <FolderCard
              folder={r.item}
              childCount={0}
              onClick={() => onFolderClick(r.item)}
              searchQuery={query}
            />
            {r.path && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 pr-1 truncate">
                📂 {r.path}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// مكوّن: محتوى مجلد مفتوح
// ─────────────────────────────────────────────────────────────
function FolderContent({
  currentFolderId,
  allFolders,
  onFolderClick,
  onFileClick,
}: {
  currentFolderId: string;
  allFolders: DriveFolder[];
  onFolderClick: (folder: DriveFolder) => void;
  onFileClick: (file: DriveFile) => void;
}) {
  const subFolders = useMemo(
    () =>
      allFolders
        .filter((f) => f.parent_id === currentFolderId)
        .sort((a, b) => a.order_index - b.order_index),
    [allFolders, currentFolderId]
  );

  const { data: files = [], isLoading: filesLoading } = useFolderFiles(currentFolderId);
  const isEmpty = !filesLoading && subFolders.length === 0 && files.length === 0;

  // حساب عدد أبناء كل مجلد فرعي
  const childCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    subFolders.forEach((sf) => {
      map[sf.drive_id] = allFolders.filter((f) => f.parent_id === sf.drive_id).length;
    });
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
            {subFolders.map((folder) => (
              <FolderCard
                key={folder.drive_id}
                folder={folder}
                childCount={childCountMap[folder.drive_id] ?? 0}
                onClick={() => onFolderClick(folder)}
              />
            ))}
          </div>
        </section>
      )}

      {filesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : files.length > 0 ? (
        <section>
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> الوثائق والملفات
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {files.map((file) => (
              <FileCard
                key={file.drive_id}
                file={file}
                onClick={() => onFileClick(file)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-foreground mb-1">هذا القسم فارغ حالياً</p>
          <p className="text-sm text-muted-foreground">سيتم إضافة الوثائق قريباً، تحقق لاحقاً.</p>
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
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);
  const [openFile, setOpenFile] = useState<DriveFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const currentFolderId =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].drive_id : null;

  // ── مجلدات الجذر ──
  const rootFolders = useMemo(
    () =>
      allFolders
        .filter((f) => f.parent_id === null || f.depth === 0)
        .sort((a, b) => a.order_index - b.order_index),
    [allFolders]
  );

  // ── إحصائيات ──
  const stats = useMemo(() => {
    const totalFolders = allFolders.length;
    const rootCount = rootFolders.length;
    return { totalFolders, rootCount };
  }, [allFolders, rootFolders]);

  // ── عداد أبناء الجذر ──
  const rootChildCount = useMemo(() => {
    const map: Record<string, number> = {};
    rootFolders.forEach((rf) => {
      map[rf.drive_id] = allFolders.filter((f) => f.parent_id === rf.drive_id).length;
    });
    return map;
  }, [rootFolders, allFolders]);

  // ── بناء خريطة المسارات لنتائج البحث ──
  const folderPathMap = useMemo(() => {
    const map: Record<string, string> = {};
    const buildPath = (folderId: string | null, depth = 0): string => {
      if (!folderId || depth > 10) return '';
      const folder = allFolders.find((f) => f.drive_id === folderId);
      if (!folder) return '';
      const parentPath = buildPath(folder.parent_id, depth + 1);
      return parentPath ? `${parentPath} / ${folder.name}` : folder.name;
    };
    allFolders.forEach((f) => {
      map[f.drive_id] = buildPath(f.parent_id);
    });
    return map;
  }, [allFolders]);

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) return [];
    const lower = q.toLowerCase();
    const results: SearchResult[] = [];
    allFolders.forEach((folder) => {
      if (folder.name.toLowerCase().includes(lower)) {
        results.push({ type: 'folder', item: folder, path: folderPathMap[folder.drive_id] || '' });
      }
    });
    return results;
  }, [searchQuery, allFolders, folderPathMap]);

  const isSearching = searchQuery.trim().length >= 2;

  const handleFolderClick = (folder: DriveFolder) => {
    setSearchQuery('');
    setBreadcrumbs((prev) => [...prev, { drive_id: folder.drive_id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) setBreadcrumbs([]);
    else setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  // ── Ctrl+K / Cmd+K لفتح البحث ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <MainLayout>
      {/* ══════════════════════════════════════
          رأس الصفحة (sticky)
      ══════════════════════════════════════ */}
      <div className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30 shadow-card">
        <div className="container max-w-5xl py-4 space-y-3">

          {/* صف العنوان + الإحصائيات */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-black text-foreground leading-tight">
                  المكتبة القانونية
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  قواعد قضائية · قوانين · أبحاث · صيغ ونماذج
                </p>
              </div>
            </div>

            {/* إحصائيات سريعة */}
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

          {/* حقل البحث */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المكتبة… (Ctrl+K)"
              className={cn(
                'w-full h-10 pr-10 pl-10 text-sm rounded-xl border bg-background/60',
                'border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                'outline-none transition-all duration-200 placeholder:text-muted-foreground/60',
                'text-right'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Breadcrumb — overflow scroll على الموبايل */}
          {!isSearching && (
            <nav
              aria-label="مسار التنقل"
              className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5"
            >
              <button
                onClick={() => handleBreadcrumbClick(-1)}
                className={cn(
                  'flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0',
                  breadcrumbs.length === 0
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Home className="w-3 h-3 shrink-0" />
                <span>الرئيسية</span>
              </button>

              {breadcrumbs.map((crumb, idx) => (
                <span key={crumb.drive_id} className="flex items-center gap-1 shrink-0">
                  <ChevronLeft className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                  <button
                    onClick={() => handleBreadcrumbClick(idx)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-lg transition-colors duration-150 max-w-[160px] truncate whitespace-nowrap',
                      idx === breadcrumbs.length - 1
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                    title={crumb.name}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          المحتوى الرئيسي
      ══════════════════════════════════════ */}
      <div className="container max-w-5xl py-6">

        {/* ── حالة التحميل ── */}
        {foldersLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* ── نتائج البحث ── */}
        {!foldersLoading && isSearching && (
          <SearchResults
            results={searchResults}
            query={searchQuery.trim()}
            onFolderClick={handleFolderClick}
          />
        )}

        {/* ── الجذر: مجلدات القسم الأول ── */}
        {!foldersLoading && !isSearching && currentFolderId === null && (
          rootFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-5">
                <BookOpen className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h2 className="text-base font-bold text-foreground mb-2">المكتبة فارغة حالياً</h2>
              <p className="text-sm text-muted-foreground mb-4">
                سيتم إضافة الوثائق والقوانين قريباً.
              </p>
              <a
                href="https://t.me/MuenAlnaser"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
              >
                <MessageSquareText className="w-4 h-4" />
                تواصل معنا لاقتراح محتوى
              </a>
            </div>
          ) : (
            <div className="animate-fade-in">
              <p className="text-xs font-semibold text-muted-foreground mb-4 flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5" />
                أقسام المكتبة
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rootFolders.map((folder, idx) => (
                  <RootFolderCard
                    key={folder.drive_id}
                    folder={folder}
                    colorIdx={idx}
                    childCount={rootChildCount[folder.drive_id] ?? 0}
                    onClick={() => handleFolderClick(folder)}
                  />
                ))}
              </div>
            </div>
          )
        )}

        {/* ── داخل مجلد ── */}
        {!foldersLoading && !isSearching && currentFolderId !== null && (
          <FolderContent
            currentFolderId={currentFolderId}
            allFolders={allFolders}
            onFolderClick={handleFolderClick}
            onFileClick={setOpenFile}
          />
        )}
      </div>

      {/* ── عارض PDF ── */}
      {openFile && <PdfViewer file={openFile} onClose={() => setOpenFile(null)} />}
    </MainLayout>
  );
}
