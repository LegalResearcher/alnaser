import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ImageIcon, Loader2, CheckCircle2, XCircle, AlertTriangle, Trash2, Eye } from "lucide-react";

interface OptimizationResult {
  postId: string;
  title: string;
  status: 'success' | 'skipped' | 'error';
  message: string;
  originalSize?: number;
  newSize?: number;
}

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.8;

export const ImageMaintenanceTool = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isSeedingViews, setIsSeedingViews] = useState(false);
  const [deleteOriginals, setDeleteOriginals] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPost, setCurrentPost] = useState<string>("");
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [stats, setStats] = useState({ total: 0, optimized: 0, skipped: 0, errors: 0 });
  
  // حالات أداة المشاهدات المطورة
  const [seedProgress, setSeedProgress] = useState(0);
  const [minViewsInput, setMinViewsInput] = useState("");
  const [maxViewsInput, setMaxViewsInput] = useState("");

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  };

  const compressImage = async (imageUrl: string): Promise<{ blob: Blob; originalSize: number }> => {
    const response = await fetch(imageUrl);
    const originalBlob = await response.blob();
    const img = await loadImage(imageUrl);
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (width > MAX_WIDTH) {
      height = (height * MAX_WIDTH) / width;
      width = MAX_WIDTH;
    }
    if (height > MAX_HEIGHT) {
      width = (width * MAX_HEIGHT) / height;
      height = MAX_HEIGHT;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))), "image/webp", QUALITY);
    });
    return { blob, originalSize: originalBlob.size };
  };

  const extractFilePathFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(p => p === 'post-images');
      return bucketIndex !== -1 && bucketIndex < pathParts.length - 1 ? pathParts.slice(bucketIndex + 1).join('/') : null;
    } catch { return null; }
  };

  const runOptimization = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setStats({ total: 0, optimized: 0, skipped: 0, errors: 0 });
    try {
      const { data: posts, error } = await supabase.from("posts").select("id, title, image_url").not("image_url", "is", null).neq("image_url", "");
      if (error) throw error;
      const postsWithImages = posts?.filter(p => p.image_url) || [];
      const total = postsWithImages.length;
      setStats(s => ({ ...s, total }));
      for (let i = 0; i < total; i++) {
        const post = postsWithImages[i];
        setCurrentPost(post.title);
        setProgress(Math.round(((i + 1) / total) * 100));
        try {
          if (post.image_url.toLowerCase().endsWith('.webp')) {
            setStats(s => ({ ...s, skipped: s.skipped + 1 }));
            continue;
          }
          const { blob } = await compressImage(post.image_url);
          const newFileName = `optimized-${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;
          await supabase.storage.from("post-images").upload(newFileName, blob, { contentType: "image/webp" });
          const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(newFileName);
          await supabase.from("posts").update({ image_url: publicUrl }).eq("id", post.id);
          if (deleteOriginals) {
            const oldPath = extractFilePathFromUrl(post.image_url);
            if (oldPath) await supabase.storage.from("post-images").remove([oldPath]);
          }
          setStats(s => ({ ...s, optimized: s.optimized + 1 }));
        } catch { setStats(s => ({ ...s, errors: s.errors + 1 })); }
      }
      toast.success("اكتمل تحسين الصور");
    } finally { setIsRunning(false); setCurrentPost(""); }
  };

  const runCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const { data: files } = await supabase.storage.from("post-images").list("", { limit: 1000 });
      const { data: posts } = await supabase.from("posts").select("image_url").not("image_url", "is", null);
      if (!files || !posts) return;
      const usedFiles = new Set(posts.map(p => extractFilePathFromUrl(p.image_url)).filter(Boolean));
      const orphaned = files.filter(f => f.name && !usedFiles.has(f.name)).map(f => f.name);
      if (orphaned.length > 0) {
        await supabase.storage.from("post-images").remove(orphaned);
        toast.success(`تم حذف ${orphaned.length} ملف غير مستخدم`);
      } else { toast.info("لا توجد ملفات يتيمة"); }
    } finally { setIsCleaningUp(false); }
  };

  const seedRandomViews = async () => {
    const min = minViewsInput === "" ? 100 : parseInt(minViewsInput);
    const max = maxViewsInput === "" ? 1500 : parseInt(maxViewsInput);
    if (isNaN(min) || isNaN(max) || min > max) { toast.error("نطاق أرقام غير صحيح"); return; }
    setIsSeedingViews(true);
    setSeedProgress(0);
    try {
      const { data: posts } = await supabase.from("posts").select("id");
      if (!posts || posts.length === 0) return;
      const total = posts.length;
      const batchSize = 25;
      for (let i = 0; i < total; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        const updates = batch.map(p => supabase.from("posts").update({ views: Math.floor(Math.random() * (max - min + 1)) + min }).eq("id", p.id));
        await Promise.all(updates);
        setSeedProgress(Math.round(((i + batch.length) / total) * 100));
      }
      toast.success("تم تحديث المشاهدات بنجاح");
    } finally { setIsSeedingViews(false); setSeedProgress(0); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-southBlue"><ImageIcon className="h-5 w-5" /> أداة الصيانة الشاملة</CardTitle>
        <CardDescription>إدارة الصور، تنظيف الملفات، وتحديث المشاهدات</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-4 pb-6 border-b">
          <Button onClick={runOptimization} disabled={isRunning || isSeedingViews} className="bg-southBlue">
            {isRunning ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ImageIcon className="ml-2 h-4 w-4" />} تحسين الصور
          </Button>
          <Button onClick={runCleanup} disabled={isCleaningUp} variant="destructive"><Trash2 className="ml-2 h-4 w-4" /> تنظيف الملفات</Button>
          <div className="flex items-center gap-2">
            <Checkbox id="del" checked={deleteOriginals} onCheckedChange={(c) => setDeleteOriginals(c as boolean)} />
            <Label htmlFor="del" className="text-sm cursor-pointer">حذف الأصلي</Label>
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm"><Eye className="h-4 w-4" /> توليد مشاهدات عشوائية</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-[11px]">الحد الأدنى</Label>
              <Input type="number" placeholder="100" value={minViewsInput} onChange={(e) => setMinViewsInput(e.target.value)} className="h-9 bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">الحد الأقصى</Label>
              <Input type="number" placeholder="1500" value={maxViewsInput} onChange={(e) => setMaxViewsInput(e.target.value)} className="h-9 bg-white" />
            </div>
            <Button onClick={seedRandomViews} disabled={isSeedingViews || isRunning} className="bg-amber-600 hover:bg-amber-700 text-white h-9">
              {isSeedingViews ? "جاري التحديث..." : "تحديث المشاهدات"}
            </Button>
          </div>
          {(isSeedingViews || isRunning) && (
            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between text-[10px] text-gray-500"><span>جاري المعالجة...</span><span>{isSeedingViews ? seedProgress : progress}%</span></div>
              <Progress value={isSeedingViews ? seedProgress : progress} className="h-1" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
