import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

// استيراد المكونات الأساسية فوراً لسرعة الظهور الأول
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// استخدام التحميل الذكي (Lazy Loading) لصفحات المنصة
// هذا يجعل الموقع "يطير" في الأداء لأنه يحمل ما تحتاجه فقط
const Levels = lazy(() => import("./pages/Levels"));
const LevelSubjects = lazy(() => import("./pages/LevelSubjects"));
const ExamStart = lazy(() => import("./pages/ExamStart"));
const ExamPage = lazy(() => import("./pages/ExamPage"));
const ExamResult = lazy(() => import("./pages/ExamResult"));

// تحميل صفحات الإدارة ذكياً (تحميل منفصل للمسؤولين فقط)
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminQuestions = lazy(() => import("./pages/admin/AdminQuestions"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminDeletionRequests = lazy(() => import("./pages/admin/AdminDeletionRequests"));
const AdminStatistics = lazy(() => import("./pages/admin/AdminStatistics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminLevels = lazy(() => import("./pages/admin/AdminLevels"));
const AdminSubjects = lazy(() => import("./pages/admin/AdminSubjects"));

/**
 * إعدادات محرك البيانات (Query Client)
 * تم ضبطها بمعايير عالمية لتقليل استهلاك موارد السيرفر 
 * وزيادة سرعة استجابة التطبيق.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // البيانات تعتبر "طازجة" لـ 5 دقائق
      gcTime: 1000 * 60 * 60,   // الاحتفاظ بالبيانات في الذاكرة لـ 60 دقيقة
      refetchOnWindowFocus: false, // منع إعادة الجلب المزعج عند تبديل التبويبات
      retry: 1, // محاولة واحدة عند فشل الاتصال لضمان UX سريع
    },
  },
});

// مكون شاشة التحميل البسيطة (Loading Spinner)
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
);

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" expand={false} richColors />
          
          {/* Suspense: يضمن عرض شاشة تحميل أنيقة أثناء جلب الصفحة المطلوبة */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* المسارات العامة (Public Routes) */}
              <Route path="/" element={<Index />} />
              <Route path="/levels" element={<Levels />} />
              <Route path="/levels/:levelId" element={<LevelSubjects />} />
              <Route path="/exam/:subjectId" element={<ExamStart />} />
              <Route path="/exam/:subjectId/start" element={<ExamPage />} />
              <Route path="/exam/:subjectId/result" element={<ExamResult />} />

              {/* مسارات الإدارة (Admin Routes) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/questions" element={<AdminQuestions />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/deletion-requests" element={<AdminDeletionRequests />} />
              <Route path="/admin/statistics" element={<AdminStatistics />} />
              <Route path="/admin/levels" element={<AdminLevels />} />
              <Route path="/admin/subjects" element={<AdminSubjects />} />
              <Route path="/admin/settings" element={<AdminSettings />} />

              {/* مسار الخطأ (404) */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
