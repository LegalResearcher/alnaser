/**
 * DriveLibrary.tsx
 * صفحة المكتبة التعليمية — منصة الناصر القانونية
 * Clean Light UI | هيكل شجري | عارض PDF مدمج
 */

import { useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  BookOpen,
  Home,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ────────────────────────────────────────────────────────────
// نوع عنصر مسار التنقل (Breadcrumb)
// ────────────────────────────────────────────────────────────
interface Crumb {
  drive_id: string;
  name: string;
}

// ────────────────────────────────────────────────────────────
// مكوّن: بطاقة المجلد
// ────────────────────────────────────────────────────────────
function FolderCard({
  folder,
  onClick,
}: {
  folder: DriveFolder;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-right p-4 rounded-xl border border-border bg-card',
        'hover:border-primary/40 hover:shadow-hover hover:bg-primary/[0.03]',
        'transition-all duration-250 ease-smooth focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary/50'
      )}
    >
      <div className="flex items-center gap-3">
        {/* أيقونة المجلد */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
          <Folder className="w-5 h-5 text-primary group-hover:hidden" />
          <FolderOpen className="w-5 h-5 text-primary hidden group-hover:block" />
        </div>

        {/* اسم المجلد */}
        <span className="flex-1 text-sm font-semibold text-foreground leading-relaxed line-clamp-2 text-right">
          {folder.name}
        </span>

        {/* سهم التنقل */}
        <ChevronLeft className="flex-shrink-0 w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all duration-200" />
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// مكوّن: بطاقة الملف
// ────────────────────────────────────────────────────────────
function FileCard({
  file,
  onClick,
}: {
  file: DriveFile;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-right p-4 rounded-xl border border-border bg-card',
        'hover:border-secondary/40 hover:shadow-hover hover:bg-secondary/[0.03]',
        'transition-all duration-250 ease-smooth focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-secondary/50'
      )}
    >
      <div className="flex items-center gap-3">
        {/* أيقونة الملف */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors duration-200">
          <FileText className="w-5 h-5 text-secondary" />
        </div>

        {/* اسم الملف */}
        <span className="flex-1 text-sm font-medium text-foreground leading-relaxed line-clamp-2 text-right">
          {file.name.replace(/\.pdf$/i, '')}
        </span>

        {/* شارة PDF */}
        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
          PDF
        </span>
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// مكوّن: Skeleton لبطاقات التحميل
// ────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <Skeleton className="h-4 flex-1 rounded" />
        <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// مكوّن: عارض PDF المدمج
// ────────────────────────────────────────────────────────────
function PdfViewer({
  file,
  onClose,
}: {
  file: DriveFile;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const embedSrc = file.embed_url || file.view_url || '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-fade-in">
      {/* شريط علوي */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card shadow-card">
        {/* زر الإغلاق */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* اسم الملف */}
        <span className="flex-1 text-sm font-semibold text-foreground text-center line-clamp-1 px-2">
          {file.name.replace(/\.pdf$/i, '')}
        </span>

        {/* زر التحميل */}
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

      {/* منطقة الـ iframe */}
      <div className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/40 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">جارٍ تحميل المستند…</span>
            </div>
          </div>
        )}
        <iframe
          src={embedSrc}
          className="w-full h-full border-0"
          title={file.name}
          onLoad={() => setLoading(false)}
          allow="autoplay"
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// مكوّن: محتوى المجلد المفتوح (مجلدات فرعية + ملفات)
// ────────────────────────────────────────────────────────────
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* المجلدات الفرعية */}
      {subFolders.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5" />
            المجلدات
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {subFolders.map((folder) => (
              <FolderCard
                key={folder.drive_id}
                folder={folder}
                onClick={() => onFolderClick(folder)}
              />
            ))}
          </div>
        </section>
      )}

      {/* الملفات */}
      {filesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : files.length > 0 ? (
        <section>
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            المحاضرات والملفات
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

      {/* حالة فارغة */}
      {isEmpty && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">هذا المجلد فارغ</p>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// الصفحة الرئيسية
// ────────────────────────────────────────────────────────────
export default function DriveLibrary() {
  const { data: allFolders = [], isLoading: foldersLoading } = useAllFolders();

  // مسار التنقل: مصفوفة من { drive_id, name }
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  // الملف المفتوح في العارض
  const [openFile, setOpenFile] = useState<DriveFile | null>(null);

  // المجلد الحالي (null = الجذر)
  const currentFolderId = breadcrumbs.length > 0
    ? breadcrumbs[breadcrumbs.length - 1].drive_id
    : null;

  // مجلدات المستوى الأول
  const rootFolders = useMemo(
    () =>
      allFolders
        .filter((f) => f.parent_id === null || f.depth === 0)
        .sort((a, b) => a.order_index - b.order_index),
    [allFolders]
  );

  // فتح مجلد
  const handleFolderClick = (folder: DriveFolder) => {
    setBreadcrumbs((prev) => [
      ...prev,
      { drive_id: folder.drive_id, name: folder.name },
    ]);
  };

  // التنقل عبر Breadcrumb
  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setBreadcrumbs([]);
    } else {
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
    }
  };

  return (
    <MainLayout>
      {/* ── رأس الصفحة ── */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="container max-w-5xl py-4">
          {/* عنوان الصفحة */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                المكتبة التعليمية
              </h1>
              <p className="text-xs text-muted-foreground">
                المحاضرات والمراجع القانونية
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav
            aria-label="مسار التنقل"
            className="flex items-center gap-1 flex-wrap"
          >
            {/* الجذر */}
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className={cn(
                'flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors duration-150',
                breadcrumbs.length === 0
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Home className="w-3 h-3" />
              <span>الرئيسية</span>
            </button>

            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.drive_id} className="flex items-center gap-1">
                <ChevronLeft className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-lg transition-colors duration-150 max-w-[140px] truncate',
                    idx === breadcrumbs.length - 1
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </nav>
        </div>
      </div>

      {/* ── المحتوى ── */}
      <div className="container max-w-5xl py-6">
        {/* حالة التحميل الأولي */}
        {foldersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : currentFolderId === null ? (
          /* ── الجذر: مجلدات المستوى الأول ── */
          rootFolders.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-5">
                <BookOpen className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-2">
                المكتبة فارغة
              </h2>
              <p className="text-sm text-muted-foreground">
                لم يتم إضافة أي محتوى بعد
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <p className="text-xs font-semibold text-muted-foreground mb-4 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" />
                المستويات والمواد
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rootFolders.map((folder) => (
                  <FolderCard
                    key={folder.drive_id}
                    folder={folder}
                    onClick={() => handleFolderClick(folder)}
                  />
                ))}
              </div>
            </div>
          )
        ) : (
          /* ── داخل مجلد ── */
          <FolderContent
            currentFolderId={currentFolderId}
            allFolders={allFolders}
            onFolderClick={handleFolderClick}
            onFileClick={setOpenFile}
          />
        )}
      </div>

      {/* ── عارض PDF ── */}
      {openFile && (
        <PdfViewer file={openFile} onClose={() => setOpenFile(null)} />
      )}
    </MainLayout>
  );
}
