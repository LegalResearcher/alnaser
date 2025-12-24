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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
