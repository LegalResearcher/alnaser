import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

import Index from "./pages/Index";
import Levels from "./pages/Levels";
import LevelSubjects from "./pages/LevelSubjects";
import ExamStart from "./pages/ExamStart";
import ExamPage from "./pages/ExamPage";
import ExamResult from "./pages/ExamResult";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDeletionRequests from "./pages/admin/AdminDeletionRequests";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLevels from "./pages/admin/AdminLevels";
import AdminSubjects from "./pages/admin/AdminSubjects";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/levels" element={<Levels />} />
            <Route path="/levels/:levelId" element={<LevelSubjects />} />
            <Route path="/exam/:subjectId" element={<ExamStart />} />
            <Route path="/exam/:subjectId/start" element={<ExamPage />} />
            <Route path="/exam/:subjectId/result" element={<ExamResult />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/questions" element={<AdminQuestions />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/deletion-requests" element={<AdminDeletionRequests />} />
            <Route path="/admin/statistics" element={<AdminStatistics />} />
            <Route path="/admin/levels" element={<AdminLevels />} />
            <Route path="/admin/subjects" element={<AdminSubjects />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
