/**
 * Alnasser Tech Digital Solutions
 * App.tsx — مُحدَّث مع HelmetProvider لدعم SEO الكامل
 */

import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async"; // ← جديد
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// الصفحات الأساسية — تُحمَّل فوراً
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// الصفحات العامة — Lazy Loading
const Levels        = lazy(() => import("./pages/Levels"));
const LevelSubjects = lazy(() => import("./pages/LevelSubjects"));
const ExamStart     = lazy(() => import("./pages/ExamStart"));
const ExamPage      = lazy(() => import("./pages/ExamPage"));
const ExamResult    = lazy(() => import("./pages/ExamResult"));
const Privacy          = lazy(() => import("./pages/Privacy")); // ← جديد
const StudentProgress  = lazy(() => import("./pages/StudentProgress"));
const DiagnosticTest   = lazy(() => import("./pages/DiagnosticTest"));
const About            = lazy(() => import("./pages/About"));
const ChallengePage    = lazy(() => import("./pages/ChallengePage"));

// صفحات الإدارة — Lazy Loading
const AdminLogin            = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard        = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminQuestions        = lazy(() => import("./pages/admin/AdminQuestions"));
const AdminUsers            = lazy(() => import("./pages/admin/AdminUsers"));
const AdminDeletionRequests = lazy(() => import("./pages/admin/AdminDeletionRequests"));
const AdminStatistics       = lazy(() => import("./pages/admin/AdminStatistics"));
const AdminSettings         = lazy(() => import("./pages/admin/AdminSettings"));
const AdminLevels           = lazy(() => import("./pages/admin/AdminLevels"));
const AdminSubjects         = lazy(() => import("./pages/admin/AdminSubjects"));
const AdminReports          = lazy(() => import("./pages/admin/AdminReports"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
);

const App = () => (
  // HelmetProvider يُغلف كل التطبيق — ضروري لعمل react-helmet-async
  <HelmetProvider>
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner position="top-center" expand={false} richColors />

                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* ── الصفحات العامة ── */}
                    <Route path="/"               element={<Index />} />
                    <Route path="/levels"         element={<Levels />} />
                    <Route path="/levels/:levelId" element={<LevelSubjects />} />
                    <Route path="/exam/:subjectId" element={<ExamStart />} />
                    <Route path="/exam/:subjectId/start"  element={<ExamPage />} />
                    <Route path="/exam/:subjectId/result" element={<ExamResult />} />
                    <Route path="/about" element={<About />} />
          <Route path="/privacy"        element={<Privacy />} /> {/* ← جديد */}
                    <Route path="/progress"       element={<StudentProgress />} />
                    <Route path="/diagnostic"     element={<DiagnosticTest />} />
                    <Route path="/challenge/:sessionId" element={<ChallengePage />} />

                    {/* ── صفحات الإدارة ── */}
                    <Route path="/admin/login"             element={<AdminLogin />} />
                    <Route path="/admin"                   element={<AdminDashboard />} />
                    <Route path="/admin/questions"         element={<AdminQuestions />} />
                    <Route path="/admin/users"             element={<AdminUsers />} />
                    <Route path="/admin/deletion-requests" element={<AdminDeletionRequests />} />
                    <Route path="/admin/statistics"        element={<AdminStatistics />} />
                    <Route path="/admin/levels"            element={<AdminLevels />} />
                    <Route path="/admin/subjects"          element={<AdminSubjects />} />
                    <Route path="/admin/reports"           element={<AdminReports />} />
                    <Route path="/admin/settings"          element={<AdminSettings />} />

                    {/* ── 404 ── */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

export default App;
