/**
 * AdminLibrary.tsx — إدارة المكتبة القانونية
 * منصة الناصر القانونية
 *
 * الميزات:
 *  1. شجرة مجلدات قابلة للتوسيع/الطي
 *  2. إضافة / تعديل / حذف مجلدات وملفات
 *  3. تحديد مجاني/مدفوع لكل عنصر (toggle سريع)
 *  4. ترتيب العناصر بالسحب والإفلات (DnD بسيط عبر أزرار ↑↓)
 *  5. عرض الملفات داخل كل مجلد
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { clearAppCache } from '@/hooks/useCachedQuery';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Folder, FolderOpen, FolderPlus, FilePlus, FileText,
  Pencil, Trash2, ChevronDown, ChevronLeft, Crown,
  Lock, Unlock, ArrowUp, ArrowDown, X, Check, Loader2,
  Library, Save, Link as LinkIcon, Plus, GripVertical,
  Eye, Download,
  Users, CheckSquare, Square,
} from 'lucide-react';


// ─────────────────────────────────────────────────────────────
// أنواع
// ─────────────────────────────────────────────────────────────
interface DriveFolder {
  id: number;
  drive_id: string;
  name: string;
  parent_id: string | null;
  depth: number;
  order_index: number;
  is_premium: boolean;
}

interface DriveFile {
  id: number;
  drive_id: string;
  name: string;
  folder_id: string;
  mime_type: string | null;
  view_url: string | null;
  embed_url: string | null;
  download_url: string | null;
  order_index: number;
  is_premium: boolean;
  view_count: number;
  download_count: number;
}

// ─────────────────────────────────────────────────────────────
// مكوّن: شارة المدفوع / المجاني
// ─────────────────────────────────────────────────────────────
function PremiumBadge({ isPremium }: { isPremium: boolean }) {
  return isPremium ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
      <Crown className="w-2.5 h-2.5" /> مدفوع
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
      مجاني
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// مودال إضافة/تعديل مجلد
// ─────────────────────────────────────────────────────────────
function FolderModal({
  mode,
  initial,
  parentId,
  parentName,
  allFolders,
  onSave,
  onClose,
}: {
  mode: 'add' | 'edit';
  initial?: DriveFolder;
  parentId: string | null;
  parentName: string;
  allFolders: DriveFolder[];
  onSave: (data: Partial<DriveFolder>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [driveId, setDriveId] = useState(initial?.drive_id ?? `folder_${Date.now()}`);
  const [isPremium, setIsPremium] = useState(initial?.is_premium ?? false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !driveId.trim()) return;
    setLoading(true);
    await onSave({ name: name.trim(), drive_id: driveId.trim(), is_premium: isPremium });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="h-1 bg-gradient-to-r from-primary via-blue-500 to-primary" />
        <div className="p-6 space-y-4">
          {/* رأس */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Folder className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base">
                  {mode === 'add' ? 'إضافة مجلد جديد' : 'تعديل المجلد'}
                </h3>
                {parentName && (
                  <p className="text-[11px] text-slate-400">داخل: {parentName}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* الحقول */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">اسم المجلد</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: القوانين التجارية"
                dir="rtl"
                className="w-full h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm font-semibold focus:outline-none focus:border-primary transition-all text-right"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">معرّف المجلد (drive_id)</label>
              <input
                type="text"
                value={driveId}
                onChange={(e) => setDriveId(e.target.value)}
                placeholder="folder_unique_id"
                dir="ltr"
                className="w-full h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm font-mono focus:outline-none focus:border-primary transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1 pr-1">معرّف فريد — يمكن أن يكون ID من Google Drive أو أي نص فريد</p>
            </div>

            {/* toggle المدفوع */}
            <button
              type="button"
              onClick={() => setIsPremium(!isPremium)}
              className={cn(
                'w-full h-12 rounded-2xl flex items-center justify-between px-4 border-2 transition-all',
                isPremium
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              )}
            >
              <span className="text-sm font-black">
                {isPremium ? '🔒 مجلد مدفوع (مقيّد)' : '🔓 مجلد مجاني (متاح للجميع)'}
              </span>
              <div className={cn(
                'w-10 h-6 rounded-full transition-all relative',
                isPremium ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
              )}>
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                  isPremium ? 'right-0.5' : 'left-0.5'
                )} />
              </div>
            </button>
          </div>

          {/* أزرار */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !name.trim() || !driveId.trim()}
              className="flex-1 h-11 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> حفظ</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// مودال إضافة/تعديل ملف
// ─────────────────────────────────────────────────────────────
function FileModal({
  mode,
  initial,
  folderId,
  folderName,
  onSave,
  onClose,
}: {
  mode: 'add' | 'edit';
  initial?: DriveFile;
  folderId: string;
  folderName: string;
  onSave: (data: Partial<DriveFile>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [driveId, setDriveId] = useState(initial?.drive_id ?? `file_${Date.now()}`);
  const [viewUrl, setViewUrl] = useState(initial?.view_url ?? '');
  const [embedUrl, setEmbedUrl] = useState(initial?.embed_url ?? '');
  const [downloadUrl, setDownloadUrl] = useState(initial?.download_url ?? '');
  const [isPremium, setIsPremium] = useState(initial?.is_premium ?? false);
  const [loading, setLoading] = useState(false);

  // توليد embed_url من view_url تلقائياً إذا كان Google Drive
  const handleViewUrlChange = (val: string) => {
    setViewUrl(val);
    // تحويل رابط view إلى embed لـ Google Drive
    const match = val.match(/\/d\/([\w-]+)/);
    if (match) {
      setEmbedUrl(`https://drive.google.com/file/d/${match[1]}/preview`);
      if (!downloadUrl)
        setDownloadUrl(`https://drive.google.com/uc?export=download&id=${match[1]}`);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !driveId.trim()) return;
    setLoading(true);
    await onSave({
      name: name.trim(),
      drive_id: driveId.trim(),
      folder_id: folderId,
      view_url: viewUrl.trim() || null,
      embed_url: embedUrl.trim() || null,
      download_url: downloadUrl.trim() || null,
      mime_type: 'application/pdf',
      is_premium: isPremium,
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-4">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
        <div className="p-6 space-y-4">
          {/* رأس */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base">
                  {mode === 'add' ? 'إضافة ملف جديد' : 'تعديل الملف'}
                </h3>
                <p className="text-[11px] text-slate-400">في: {folderName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">اسم الملف</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="مثال: قانون العقوبات 2024.pdf" dir="rtl"
                className="w-full h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm font-semibold focus:outline-none focus:border-emerald-400 transition-all text-right" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">معرّف الملف (drive_id)</label>
              <input type="text" value={driveId} onChange={(e) => setDriveId(e.target.value)}
                placeholder="file_unique_id" dir="ltr"
                className="w-full h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm font-mono focus:outline-none focus:border-emerald-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                <LinkIcon className="w-3 h-3 inline ml-1" />رابط العرض (view_url)
              </label>
              <input type="url" value={viewUrl} onChange={(e) => handleViewUrlChange(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view" dir="ltr"
                className="w-full h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm font-mono text-xs focus:outline-none focus:border-emerald-400 transition-all" />
              <p className="text-[10px] text-slate-400 mt-1 pr-1">الصق رابط Google Drive وسيتم توليد باقي الروابط تلقائياً</p>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">رابط التضمين (embed_url)</label>
              <input type="url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../preview" dir="ltr"
                className="w-full h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm font-mono text-xs focus:outline-none focus:border-emerald-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">رابط التحميل (download_url)</label>
              <input type="url" value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://drive.google.com/uc?export=download&id=..." dir="ltr"
                className="w-full h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm font-mono text-xs focus:outline-none focus:border-emerald-400 transition-all" />
            </div>

            {/* toggle المدفوع */}
            <button type="button" onClick={() => setIsPremium(!isPremium)}
              className={cn(
                'w-full h-12 rounded-2xl flex items-center justify-between px-4 border-2 transition-all',
                isPremium
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              )}>
              <span className="text-sm font-black">
                {isPremium ? '🔒 ملف مدفوع (مقيّد)' : '🔓 ملف مجاني (متاح للجميع)'}
              </span>
              <div className={cn('w-10 h-6 rounded-full transition-all relative', isPremium ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600')}>
                <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', isPremium ? 'right-0.5' : 'left-0.5')} />
              </div>
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              إلغاء
            </button>
            <button onClick={handleSubmit} disabled={loading || !name.trim() || !driveId.trim()}
              className="flex-1 h-11 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> حفظ</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// مكوّن: صف ملف داخل المجلد — مع DnD + تحديد جماعي
// ─────────────────────────────────────────────────────────────
function FileRow({
  file, isFirst, isLast,
  onEdit, onDelete, onTogglePremium, onMoveUp, onMoveDown,
  selected, onToggleSelect,
  onDragStart, onDragOver, onDrop,
}: {
  file: DriveFile; isFirst: boolean; isLast: boolean;
  onEdit: () => void; onDelete: () => void;
  onTogglePremium: () => void; onMoveUp: () => void; onMoveDown: () => void;
  selected: boolean; onToggleSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const cleanName = file.name.replace(/\.pdf$/i, '');
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); onDragOver(e); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { setDragOver(false); onDrop(e); }}
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all group cursor-grab active:cursor-grabbing',
        dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-300/50',
        selected && 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10',
      )}
    >
      {/* مقبض السحب */}
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
      {/* checkbox */}
      <button onClick={onToggleSelect} className="shrink-0">
        {selected
          ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          : <Square className="w-4 h-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />}
      </button>
      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
        <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground truncate text-right">{cleanName}</span>
      {/* عدادات المشاهدة والتحميل */}
      {(file.view_count > 0 || file.download_count > 0) && (
        <div className="flex items-center gap-1.5 shrink-0">
          {file.view_count > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-1.5 py-0.5 rounded-lg">
              <Eye className="w-2.5 h-2.5" />{file.view_count}
            </span>
          )}
          {file.download_count > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded-lg">
              <Download className="w-2.5 h-2.5" />{file.download_count}
            </span>
          )}
        </div>
      )}
      <PremiumBadge isPremium={file.is_premium} />
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onMoveUp} disabled={isFirst} title="لأعلى"
          className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center disabled:opacity-30 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
          <ArrowUp className="w-3 h-3" />
        </button>
        <button onClick={onMoveDown} disabled={isLast} title="لأسفل"
          className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center disabled:opacity-30 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
          <ArrowDown className="w-3 h-3" />
        </button>
        <button onClick={onTogglePremium} title={file.is_premium ? 'تحويل لمجاني' : 'تحويل لمدفوع'}
          className={cn('w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
            file.is_premium
              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600')}>
          {file.is_premium ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>
        <button onClick={onEdit} title="تعديل"
          className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={onDelete} title="حذف"
          className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// مكوّن: عقدة المجلد (تكرارية) — مع DnD + فلتر + تحديد جماعي
// ─────────────────────────────────────────────────────────────
function FolderNode({
  folder, allFolders, depth, isFirst, isLast,
  onAddSubFolder, onEditFolder, onDeleteFolder, onToggleFolderPremium,
  onMoveFolderUp, onMoveFolderDown,
  onAddFile, onEditFile, onDeleteFile, onToggleFilePremium,
  onMoveFileUp, onMoveFileDown,
  selectedFiles, onToggleFileSelect,
  onDragStartFile, onDropFile,
  onDragStartFolder, onDropFolder,
  premiumFilter,
}: {
  folder: DriveFolder; allFolders: DriveFolder[];
  depth: number;
  isFirst: boolean; isLast: boolean;
  onAddSubFolder: (pid: string, pname: string) => void;
  onEditFolder: (f: DriveFolder) => void;
  onDeleteFolder: (f: DriveFolder) => void;
  onToggleFolderPremium: (f: DriveFolder) => void;
  onMoveFolderUp: (f: DriveFolder) => void;
  onMoveFolderDown: (f: DriveFolder) => void;
  onAddFile: (fid: string, fname: string) => void;
  onEditFile: (file: DriveFile, fname: string) => void;
  onDeleteFile: (file: DriveFile) => void;
  onToggleFilePremium: (file: DriveFile) => void;
  onMoveFileUp: (file: DriveFile, fid: string) => void;
  onMoveFileDown: (file: DriveFile, fid: string) => void;
  selectedFiles: Set<number>;
  onToggleFileSelect: (id: number) => void;
  onDragStartFile: (file: DriveFile, srcFolderId: string) => void;
  onDropFile: (targetFolderId: string) => void;
  onDragStartFolder: (f: DriveFolder) => void;
  onDropFolder: (target: DriveFolder) => void;
  premiumFilter: 'all' | 'premium' | 'free';
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const [folderDragOver, setFolderDragOver] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);

  const subFolders = useMemo(
    () => allFolders.filter(f => f.parent_id === folder.drive_id).sort((a, b) => a.order_index - b.order_index),
    [allFolders, folder.drive_id]
  );

  // جلب الملفات عند الفتح فقط (lazy loading)
  const { data: rawFiles = [], isLoading: filesLoading } = useQuery<DriveFile[]>({
    queryKey: ['admin-folder-files', folder.drive_id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('drive_files')
        .select('*')
        .eq('folder_id', folder.drive_id)
        .order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: expanded,
    staleTime: 1000 * 60 * 5,
  });

  // تطبيق فلتر الحالة على الملفات
  const files = useMemo(() => {
    if (premiumFilter === 'premium') return rawFiles.filter(f => f.is_premium);
    if (premiumFilter === 'free')    return rawFiles.filter(f => !f.is_premium);
    return rawFiles;
  }, [rawFiles, premiumFilter]);

  const indentPx = depth * 20;

  return (
    <div>
      {/* صف المجلد */}
      <div
        draggable
        onDragStart={(e) => { e.stopPropagation(); onDragStartFolder(folder); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setFolderDragOver(true); }}
        onDragLeave={() => setFolderDragOver(false)}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setFolderDragOver(false); onDropFolder(folder); }}
        className={cn(
          'group flex items-center gap-2 py-2.5 pr-3 pl-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing',
          folderDragOver ? 'border-primary bg-primary/5 scale-[1.005]' : (
            folder.is_premium
              ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 hover:border-amber-300/60'
              : 'border-border bg-card hover:bg-primary/[0.03] hover:border-primary/20'
          )
        )}
        style={{ marginRight: `${indentPx}px` }}
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
        <button onClick={() => setExpanded(!expanded)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          {hasChildren
            ? (expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)
            : <span className="w-4 h-4" />}
        </button>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: folder.is_premium ? 'rgba(245,158,11,0.12)' : 'rgba(var(--primary-rgb),0.1)' }}>
          {expanded
            ? <FolderOpen className={cn('w-4 h-4', folder.is_premium ? 'text-amber-600 dark:text-amber-400' : 'text-primary')} />
            : <Folder    className={cn('w-4 h-4', folder.is_premium ? 'text-amber-600 dark:text-amber-400' : 'text-primary')} />}
        </div>
        <span className="flex-1 text-sm font-bold text-foreground truncate text-right">{folder.name}</span>
        <PremiumBadge isPremium={folder.is_premium} />
        {(subFolders.length > 0 || rawFiles.length > 0) && (
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-lg">
            {subFolders.length + rawFiles.length}
          </span>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onMoveFolderUp(folder)} disabled={isFirst} title="لأعلى"
            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ArrowUp className="w-3 h-3" />
          </button>
          <button onClick={() => onMoveFolderDown(folder)} disabled={isLast} title="لأسفل"
            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ArrowDown className="w-3 h-3" />
          </button>
          <button onClick={() => onToggleFolderPremium(folder)} title={folder.is_premium ? 'تحويل لمجاني' : 'تحويل لمدفوع'}
            className={cn('w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
              folder.is_premium
                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700')}>
            {folder.is_premium ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
          <button onClick={() => onAddFile(folder.drive_id, folder.name)} title="إضافة ملف"
            className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-200 transition-colors">
            <FilePlus className="w-3 h-3" />
          </button>
          <button onClick={() => onAddSubFolder(folder.drive_id, folder.name)} title="إضافة مجلد فرعي"
            className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-200 transition-colors">
            <FolderPlus className="w-3 h-3" />
          </button>
          <button onClick={() => onEditFolder(folder)} title="تعديل"
            className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-200 transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={() => onDeleteFolder(folder)} title="حذف"
            className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-1 space-y-1" style={{ marginRight: `${indentPx + 20}px` }}>
          {subFolders.map((sf, idx) => (
            <FolderNode
              key={sf.drive_id} folder={sf} allFolders={allFolders} filesMap={filesMap}
              depth={0} isFirst={idx === 0} isLast={idx === subFolders.length - 1}
              onAddSubFolder={onAddSubFolder} onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder} onToggleFolderPremium={onToggleFolderPremium}
              onMoveFolderUp={onMoveFolderUp} onMoveFolderDown={onMoveFolderDown}
              onAddFile={onAddFile} onEditFile={onEditFile}
              onDeleteFile={onDeleteFile} onToggleFilePremium={onToggleFilePremium}
              onMoveFileUp={onMoveFileUp} onMoveFileDown={onMoveFileDown}
              selectedFiles={selectedFiles} onToggleFileSelect={onToggleFileSelect}
              onDragStartFile={onDragStartFile} onDropFile={onDropFile}
              onDragStartFolder={onDragStartFolder} onDropFolder={onDropFolder}
              premiumFilter={premiumFilter}
            />
          ))}

          {/* منطقة إفلات الملفات */}
          <div
            onDragOver={(e) => { e.preventDefault(); setFileDragOver(true); }}
            onDragLeave={() => setFileDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setFileDragOver(false); onDropFile(folder.drive_id); }}
            className={cn(
              'transition-all rounded-xl',
              fileDragOver && 'ring-2 ring-primary ring-dashed bg-primary/5 p-1'
            )}
          >
            {files.map((file, idx) => (
              <div key={file.drive_id} className="mb-1">
                <FileRow
                  file={file}
                  isFirst={idx === 0} isLast={idx === files.length - 1}
                  onEdit={() => onEditFile(file, folder.name)}
                  onDelete={() => onDeleteFile(file)}
                  onTogglePremium={() => onToggleFilePremium(file)}
                  onMoveUp={() => onMoveFileUp(file, folder.drive_id)}
                  onMoveDown={() => onMoveFileDown(file, folder.drive_id)}
                  selected={selectedFiles.has(file.id)}
                  onToggleSelect={() => onToggleFileSelect(file.id)}
                  onDragStart={(e) => { e.stopPropagation(); onDragStartFile(file, folder.drive_id); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onDropFile(folder.drive_id); }}
                />
              </div>
            ))}
          </div>

          {subFolders.length === 0 && rawFiles.length === 0 && (
            <div className="flex items-center gap-2 py-2 px-3 rounded-xl border border-dashed border-border">
              <span className="text-xs text-muted-foreground">مجلد فارغ —</span>
              <button onClick={() => onAddFile(folder.drive_id, folder.name)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">أضف ملفاً</button>
              <span className="text-xs text-muted-foreground">أو</span>
              <button onClick={() => onAddSubFolder(folder.drive_id, folder.name)}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">أضف مجلداً فرعياً</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// الصفحة الرئيسية
// ─────────────────────────────────────────────────────────────
export default function AdminLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── library_subject_id ──
  const [librarySubjectId, setLibrarySubjectId] = useState('');
  const [librarySubjectSaving, setLibrarySubjectSaving] = useState(false);

  useQuery({
    queryKey: ['library_subject_id'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('platform_settings').select('value').eq('key', 'library_subject_id').maybeSingle();
      setLibrarySubjectId(data?.value ?? '');
      return data?.value ?? '';
    },
  });

  const saveLibrarySubjectId = async () => {
    setLibrarySubjectSaving(true);
    await (supabase as any).from('platform_settings')
      .upsert({ key: 'library_subject_id', value: librarySubjectId.trim() }, { onConflict: 'key' });
    setLibrarySubjectSaving(false);
    toast({ title: '✅ تم الحفظ', description: 'تم تحديث إعداد المكتبة' });
  };

  // ── جلب البيانات ──
  const { data: allFolders = [], isLoading: foldersLoading } = useQuery<DriveFolder[]>({
    queryKey: ['admin-drive-folders'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('drive_folders').select('*').order('order_index');
      if (error) throw error;
      return data;
    },
  });

  const { data: allFiles = [], isLoading: filesLoading } = useQuery<DriveFile[]>({
    queryKey: ['admin-drive-files'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('drive_files').select('*').order('order_index');
      if (error) throw error;
      return data;
    },
  });

  // ── إحصائيات المشتركين النشطين ──
  const { data: activeSubscribers = 0 } = useQuery<number>({
    queryKey: ['library-active-subscribers'],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from('review_passwords')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('first_used_at', 'is', null);
      return count ?? 0;
    },
  });

  // ── إحصائيات المشاهدات والتحميلات الكلية ──
  const { data: totalViews = 0 } = useQuery<number>({
    queryKey: ['library-total-views'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('drive_files')
        .select('view_count');
      return (data ?? []).reduce((sum: number, f: any) => sum + (f.view_count ?? 0), 0);
    },
  });

  const { data: totalDownloads = 0 } = useQuery<number>({
    queryKey: ['library-total-downloads'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('drive_files')
        .select('download_count');
      return (data ?? []).reduce((sum: number, f: any) => sum + (f.download_count ?? 0), 0);
    },
  });

  const filesMap = useMemo(() => {
    const map: Record<string, DriveFile[]> = {};
    allFiles.forEach(f => {
      if (!map[f.folder_id]) map[f.folder_id] = [];
      map[f.folder_id].push(f);
    });
    return map;
  }, [allFiles]);

  const rootFolders = useMemo(
    () => allFolders.filter(f => !f.parent_id || f.depth === 0).sort((a, b) => a.order_index - b.order_index),
    [allFolders]
  );

  // ── حالة الفلتر ──
  const [premiumFilter, setPremiumFilter] = useState<'all' | 'premium' | 'free'>('all');

  // ── حالة التحديد الجماعي ──
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleFileSelect = useCallback((id: number) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearSelection = () => setSelectedFiles(new Set());

  const handleBulkSetPremium = async (toPremium: boolean) => {
    if (selectedFiles.size === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedFiles);
      const { error } = await (supabase as any)
        .from('drive_files').update({ is_premium: toPremium }).in('id', ids);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['drive-files'] });
      toast({ title: toPremium ? '🔒 تم التحويل للمدفوع' : '🔓 تم التحويل للمجاني', description: `${ids.length} ملف` });
      clearSelection();
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' });
    }
    setBulkLoading(false);
  };

  // ── DnD: السحب والإفلات ──
  const dragFile   = useRef<{ file: DriveFile; srcFolderId: string } | null>(null);
  const dragFolder = useRef<DriveFolder | null>(null);

  const handleDragStartFile = useCallback((file: DriveFile, srcFolderId: string) => {
    dragFile.current = { file, srcFolderId };
    dragFolder.current = null;
  }, []);

  const handleDropFile = useCallback(async (targetFolderId: string) => {
    if (!dragFile.current) return;
    const { file, srcFolderId } = dragFile.current;
    dragFile.current = null;
    if (srcFolderId === targetFolderId) return;
    try {
      const maxOrder = (filesMap[targetFolderId] ?? [])
        .reduce((max, f) => Math.max(max, f.order_index), -1) + 1;
      const { error } = await (supabase as any)
        .from('drive_files').update({ folder_id: targetFolderId, order_index: maxOrder }).eq('id', file.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['drive-files'] });
      const targetName = allFolders.find(f => f.drive_id === targetFolderId)?.name ?? targetFolderId;
      toast({ title: '📁 تم النقل', description: `"${file.name.replace(/\.pdf$/i, '')}" → ${targetName}` });
    } catch (e: any) {
      toast({ title: '❌ فشل النقل', description: e.message, variant: 'destructive' });
    }
  }, [filesMap, allFolders]);

  const handleDragStartFolder = useCallback((f: DriveFolder) => {
    dragFolder.current = f;
    dragFile.current = null;
  }, []);

  const handleDropFolder = useCallback(async (target: DriveFolder) => {
    const src = dragFolder.current;
    dragFolder.current = null;
    if (!src || src.id === target.id || src.parent_id !== target.parent_id) return;
    try {
      await (supabase as any).from('drive_folders').update({ order_index: target.order_index }).eq('id', src.id);
      await (supabase as any).from('drive_folders').update({ order_index: src.order_index }).eq('id', target.id);
      queryClient.invalidateQueries({ queryKey: ['admin-drive-folders'] });
      queryClient.invalidateQueries({ queryKey: ['drive-folders-all'] });
    } catch (e: any) {
      toast({ title: '❌ فشل إعادة الترتيب', description: e.message, variant: 'destructive' });
    }
  }, []);

  // ── النوافذ المنبثقة ──
  const [folderModal, setFolderModal] = useState<{
    mode: 'add' | 'edit'; parentId: string | null; parentName: string; initial?: DriveFolder;
  } | null>(null);

  const [fileModal, setFileModal] = useState<{
    mode: 'add' | 'edit'; folderId: string; folderName: string; initial?: DriveFile;
  } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'folder' | 'file'; id: number; name: string;
  } | null>(null);

  // ── invalidate helpers ──
  const invalidateFolders = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-drive-folders'] });
    queryClient.invalidateQueries({ queryKey: ['drive-folders-all'] });
  };
  const invalidateFiles = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-drive-files'] });
    queryClient.invalidateQueries({ queryKey: ['drive-files'] });
  };

  // ── حفظ مجلد ──
  const handleSaveFolder = useCallback(async (data: Partial<DriveFolder>) => {
    if (!folderModal) return;
    try {
      if (folderModal.mode === 'add') {
        const maxOrder = allFolders
          .filter(f => f.parent_id === folderModal.parentId)
          .reduce((max, f) => Math.max(max, f.order_index), -1) + 1;
        const { error } = await (supabase as any).from('drive_folders').insert({
          drive_id: data.drive_id, name: data.name,
          parent_id: folderModal.parentId,
          depth: folderModal.parentId ? 1 : 0,
          order_index: maxOrder, is_premium: data.is_premium ?? false,
        });
        if (error) throw error;
        toast({ title: '✅ تمت الإضافة', description: `تم إضافة المجلد "${data.name}"` });
      } else {
        const { error } = await (supabase as any).from('drive_folders')
          .update({ name: data.name, drive_id: data.drive_id, is_premium: data.is_premium })
          .eq('id', folderModal.initial!.id);
        if (error) throw error;
        toast({ title: '✅ تم التعديل', description: `تم تحديث "${data.name}"` });
      }
      invalidateFolders();
      setFolderModal(null);
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' });
    }
  }, [folderModal, allFolders]);

  // ── حفظ ملف ──
  const handleSaveFile = useCallback(async (data: Partial<DriveFile>) => {
    if (!fileModal) return;
    try {
      if (fileModal.mode === 'add') {
        const maxOrder = (filesMap[fileModal.folderId] ?? [])
          .reduce((max, f) => Math.max(max, f.order_index), -1) + 1;
        const { error } = await (supabase as any).from('drive_files').insert({
          drive_id: data.drive_id, name: data.name,
          folder_id: fileModal.folderId,
          mime_type: data.mime_type ?? 'application/pdf',
          view_url: data.view_url, embed_url: data.embed_url,
          download_url: data.download_url,
          order_index: maxOrder, is_premium: data.is_premium ?? false,
        });
        if (error) throw error;
        toast({ title: '✅ تمت الإضافة', description: `تم إضافة "${data.name}"` });
      } else {
        const { error } = await (supabase as any).from('drive_files')
          .update({
            name: data.name, drive_id: data.drive_id,
            view_url: data.view_url, embed_url: data.embed_url,
            download_url: data.download_url, is_premium: data.is_premium,
          }).eq('id', fileModal.initial!.id);
        if (error) throw error;
        toast({ title: '✅ تم التعديل', description: `تم تحديث "${data.name}"` });
      }
      invalidateFiles();
      setFileModal(null);
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' });
    }
  }, [fileModal, filesMap]);

  // ── حذف ──
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const table = deleteConfirm.type === 'folder' ? 'drive_folders' : 'drive_files';
      const { error } = await (supabase as any).from(table).delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      toast({ title: '🗑 تم الحذف', description: `تم حذف "${deleteConfirm.name}"` });
      clearAppCache();
      if (deleteConfirm.type === 'folder') invalidateFolders(); else invalidateFiles();
      setDeleteConfirm(null);
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' });
    }
  };

  // ── toggle مدفوع ──
  const handleToggleFolderPremium = async (folder: DriveFolder) => {
    try {
      const { error } = await (supabase as any).from('drive_folders')
        .update({ is_premium: !folder.is_premium }).eq('id', folder.id);
      if (error) throw error;
      invalidateFolders();
      toast({ title: folder.is_premium ? '🔓 صار مجانياً' : '🔒 صار مدفوعاً', description: folder.name });
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' });
    }
  };

  const handleToggleFilePremium = async (file: DriveFile) => {
    try {
      const { error } = await (supabase as any).from('drive_files')
        .update({ is_premium: !file.is_premium }).eq('id', file.id);
      if (error) throw error;
      invalidateFiles();
      toast({ title: file.is_premium ? '🔓 صار مجانياً' : '🔒 صار مدفوعاً', description: file.name });
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' });
    }
  };

  // ── ترتيب المجلدات ──
  const swapFolderOrder = async (a: DriveFolder, b: DriveFolder) => {
    try {
      await (supabase as any).from('drive_folders').update({ order_index: b.order_index }).eq('id', a.id);
      await (supabase as any).from('drive_folders').update({ order_index: a.order_index }).eq('id', b.id);
      invalidateFolders();
    } catch (e: any) { toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' }); }
  };

  const handleMoveFolderUp = (folder: DriveFolder) => {
    const siblings = allFolders.filter(f => f.parent_id === folder.parent_id).sort((a, b) => a.order_index - b.order_index);
    const idx = siblings.findIndex(f => f.id === folder.id);
    if (idx > 0) swapFolderOrder(folder, siblings[idx - 1]);
  };

  const handleMoveFolderDown = (folder: DriveFolder) => {
    const siblings = allFolders.filter(f => f.parent_id === folder.parent_id).sort((a, b) => a.order_index - b.order_index);
    const idx = siblings.findIndex(f => f.id === folder.id);
    if (idx < siblings.length - 1) swapFolderOrder(folder, siblings[idx + 1]);
  };

  // ── ترتيب الملفات ──
  const swapFileOrder = async (a: DriveFile, b: DriveFile) => {
    try {
      await (supabase as any).from('drive_files').update({ order_index: b.order_index }).eq('id', a.id);
      await (supabase as any).from('drive_files').update({ order_index: a.order_index }).eq('id', b.id);
      invalidateFiles();
    } catch (e: any) { toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' }); }
  };

  const handleMoveFileUp = (file: DriveFile, folderId: string) => {
    const siblings = (filesMap[folderId] ?? []).sort((a, b) => a.order_index - b.order_index);
    const idx = siblings.findIndex(f => f.id === file.id);
    if (idx > 0) swapFileOrder(file, siblings[idx - 1]);
  };

  const handleMoveFileDown = (file: DriveFile, folderId: string) => {
    const siblings = (filesMap[folderId] ?? []).sort((a, b) => a.order_index - b.order_index);
    const idx = siblings.findIndex(f => f.id === file.id);
    if (idx < siblings.length - 1) swapFileOrder(file, siblings[idx + 1]);
  };

  // ── إحصائيات ──
  const premiumFolders  = allFolders.filter(f => f.is_premium).length;
  const premiumFiles    = allFiles.filter(f => f.is_premium).length;
  const isLoading       = foldersLoading || filesLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── رأس الصفحة ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Library className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">إدارة المكتبة</h1>
              <p className="text-sm text-slate-500">المجلدات والملفات · المجاني والمدفوع</p>
            </div>
          </div>
          <button
            onClick={() => setFolderModal({ mode: 'add', parentId: null, parentName: 'الجذر' })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}
          >
            <FolderPlus className="w-4 h-4" /> إضافة قسم رئيسي
          </button>
        </div>

        {/* ── بطاقات الإحصائيات (7 بطاقات) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي المجلدات', value: allFolders.length,   color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/30'    },
            { label: 'مجلدات مدفوعة',  value: premiumFolders,        color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/30'  },
            { label: 'إجمالي الملفات', value: allFiles.length,       color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            { label: 'ملفات مدفوعة',   value: premiumFiles,          color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-950/30'    },
          ].map(stat => (
            <div key={stat.label} className={cn('rounded-2xl p-4 border border-border', stat.bg)}>
              <p className={cn('text-2xl font-black', stat.color)}>{isLoading ? '…' : stat.value}</p>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── بطاقات التفاعل ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'مشتركون نشطون',   value: activeSubscribers, color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950/30',  icon: <Users className="w-4 h-4" />,      desc: 'كلمة مرور مستخدمة' },
            { label: 'إجمالي المشاهدات', value: totalViews,        color: 'text-sky-600',     bg: 'bg-sky-50 dark:bg-sky-950/30',        icon: <Eye className="w-4 h-4" />,        desc: 'فتح ملف' },
            { label: 'إجمالي التحميلات', value: totalDownloads,    color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-950/30',      icon: <Download className="w-4 h-4" />,   desc: 'تحميل ملف' },
          ].map(stat => (
            <div key={stat.label} className={cn('rounded-2xl p-4 border border-border flex items-center gap-4', stat.bg)}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 opacity-80', stat.color,
                stat.bg.replace('bg-', 'bg-').replace('50', '100').replace('950/30', '900/40'))}>
                {stat.icon}
              </div>
              <div>
                <p className={cn('text-2xl font-black', stat.color)}>{isLoading ? '…' : stat.value.toLocaleString('ar-EG')}</p>
                <p className="text-xs text-muted-foreground font-semibold">{stat.label}</p>
                <p className="text-[10px] text-muted-foreground/60">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── إعداد subject_id ── */}
        <div className="bg-card rounded-3xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm">إعداد الاشتراك للمكتبة</h2>
              <p className="text-[11px] text-slate-500">أدخل ID المادة التي تُربط بها كلمات مرور المكتبة</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={librarySubjectId}
              onChange={(e) => setLibrarySubjectId(e.target.value)}
              placeholder="مثال: uuid-المادة من جدول subjects" dir="ltr"
              className="flex-1 h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm font-mono focus:outline-none focus:border-amber-400 transition-all"
            />
            <button onClick={saveLibrarySubjectId} disabled={librarySubjectSaving}
              className="px-5 h-11 rounded-2xl font-black text-sm text-white flex items-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #92400e, #d97706)' }}>
              {librarySubjectSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 pr-1">
            اتركه فارغاً ليقبل أي كلمة مرور نشطة في المنصة · أو اربطه بمادة محددة للتحكم الدقيق
          </p>
        </div>

        {/* ── شجرة المجلدات ── */}
        <div className="bg-card rounded-3xl border border-border p-5 shadow-sm">
          {/* رأس الشجرة + أدوات الفلتر والتحديد الجماعي */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Folder className="w-4 h-4 text-primary" /> شجرة المكتبة
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* فلتر الحالة */}
              <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                {(['all', 'free', 'premium'] as const).map(f => (
                  <button key={f}
                    onClick={() => setPremiumFilter(f)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-black transition-all',
                      premiumFilter === f
                        ? f === 'premium'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : f === 'free'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}>
                    {f === 'all' ? 'الكل' : f === 'premium' ? '🔒 مدفوع' : '🔓 مجاني'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="w-3 h-3 text-amber-500" /> مدفوع
                <Unlock className="w-3 h-3 text-emerald-500 mr-2" /> مجاني
              </div>
            </div>
          </div>

          {/* شريط الإجراءات الجماعية */}
          {selectedFiles.size > 0 && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700 animate-in slide-in-from-top-2 duration-200">
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-sm font-black text-blue-700 dark:text-blue-400 flex-1">
                {selectedFiles.size} ملف محدد
              </span>
              <button
                onClick={() => handleBulkSetPremium(true)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 transition-colors disabled:opacity-50">
                <Lock className="w-3 h-3" /> تحويل لمدفوع
              </button>
              <button
                onClick={() => handleBulkSetPremium(false)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors disabled:opacity-50">
                <Unlock className="w-3 h-3" /> تحويل لمجاني
              </button>
              <button onClick={clearSelection}
                className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
              {bulkLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            </div>
          )}

          {/* تلميح DnD */}
          {!isLoading && rootFolders.length > 0 && (
            <div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground/60">
              <GripVertical className="w-3 h-3" />
              <span>اسحب المجلدات والملفات لإعادة الترتيب أو نقل الملفات بين المجلدات</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : rootFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Library className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="font-bold text-foreground mb-1">المكتبة فارغة</p>
              <p className="text-sm text-muted-foreground mb-4">ابدأ بإضافة قسم رئيسي للمكتبة</p>
              <button
                onClick={() => setFolderModal({ mode: 'add', parentId: null, parentName: 'الجذر' })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)' }}>
                <Plus className="w-4 h-4" /> إضافة قسم أول
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {rootFolders.map((folder, idx) => (
                <FolderNode
                  key={folder.drive_id} folder={folder} allFolders={allFolders}
                  filesMap={filesMap} depth={0}
                  isFirst={idx === 0} isLast={idx === rootFolders.length - 1}
                  onAddSubFolder={(pid, pname) => setFolderModal({ mode: 'add', parentId: pid, parentName: pname })}
                  onEditFolder={(f) => setFolderModal({ mode: 'edit', parentId: f.parent_id, parentName: '', initial: f })}
                  onDeleteFolder={(f) => setDeleteConfirm({ type: 'folder', id: f.id, name: f.name })}
                  onToggleFolderPremium={handleToggleFolderPremium}
                  onMoveFolderUp={handleMoveFolderUp} onMoveFolderDown={handleMoveFolderDown}
                  onAddFile={(fid, fname) => setFileModal({ mode: 'add', folderId: fid, folderName: fname })}
                  onEditFile={(file, fname) => setFileModal({ mode: 'edit', folderId: file.folder_id, folderName: fname, initial: file })}
                  onDeleteFile={(f) => setDeleteConfirm({ type: 'file', id: f.id, name: f.name })}
                  onToggleFilePremium={handleToggleFilePremium}
                  onMoveFileUp={handleMoveFileUp} onMoveFileDown={handleMoveFileDown}
                  selectedFiles={selectedFiles} onToggleFileSelect={toggleFileSelect}
                  onDragStartFile={handleDragStartFile} onDropFile={handleDropFile}
                  onDragStartFolder={handleDragStartFolder} onDropFolder={handleDropFolder}
                  premiumFilter={premiumFilter}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── مودال مجلد ── */}
      {folderModal && (
        <FolderModal
          mode={folderModal.mode} initial={folderModal.initial}
          parentId={folderModal.parentId} parentName={folderModal.parentName}
          allFolders={allFolders} onSave={handleSaveFolder}
          onClose={() => setFolderModal(null)}
        />
      )}

      {/* ── مودال ملف ── */}
      {fileModal && (
        <FileModal
          mode={fileModal.mode} initial={fileModal.initial}
          folderId={fileModal.folderId} folderName={fileModal.folderName}
          onSave={handleSaveFile} onClose={() => setFileModal(null)}
        />
      )}

      {/* ── مودال تأكيد الحذف ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600" />
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100">تأكيد الحذف</h3>
                  <p className="text-xs text-slate-400">هذا الإجراء لا يمكن التراجع عنه</p>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-4 text-right">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  هل أنت متأكد من حذف <span className="font-black">"{deleteConfirm.name}"</span>؟
                </p>
                {deleteConfirm.type === 'folder' && (
                  <p className="text-xs text-red-500 mt-1">سيتم حذف المجلد فقط — الملفات الداخلية تحتاج حذفاً منفصلاً</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 h-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  إلغاء
                </button>
                <button onClick={handleConfirmDelete}
                  className="flex-1 h-11 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #e11d48)' }}>
                  <Trash2 className="w-4 h-4" /> حذف نهائياً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
