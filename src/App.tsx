import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell, AdminShell } from "@/components/layouts/Shells";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import LearnerDashboard from "./pages/learner/Dashboard";
import Tracks from "./pages/learner/Tracks";
import TrackDetail from "./pages/learner/TrackDetail";
import LessonView from "./pages/learner/LessonView";
import Playground from "./pages/learner/Playground";
import Projects from "./pages/learner/Projects";
import ProjectDetail from "./pages/learner/ProjectDetail";
import Profile from "./pages/learner/Profile";
import PublicPortfolio from "./pages/PublicPortfolio";
import VerifyCertificate from "./pages/VerifyCertificate";
import AdminOverview from "./pages/admin/Overview";
import AdminLearners from "./pages/admin/Learners";
import AdminCurriculum from "./pages/admin/Curriculum";
import AdminSubmissions from "./pages/admin/Submissions";
import AdminCertificates from "./pages/admin/Certificates";
import AdminDatasets from "./pages/admin/Datasets";
import InterviewBank from "./pages/learner/InterviewBank";
import { MockInterviewList, MockInterviewSession } from "./pages/learner/MockInterview";
import AdminInterviewBank from "./pages/admin/InterviewBank";
import AdminMockReviews from "./pages/admin/MockReviews";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/p/:handle" element={<PublicPortfolio />} />
              <Route path="/verify/:code" element={<VerifyCertificate />} />

              <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route path="/dashboard" element={<LearnerDashboard />} />
                <Route path="/tracks" element={<Tracks />} />
                <Route path="/tracks/:slug" element={<TrackDetail />} />
                <Route path="/tracks/:slug/lessons/:lessonId" element={<LessonView />} />
                <Route path="/playground" element={<Playground />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:slug" element={<ProjectDetail />} />
                <Route path="/interview" element={<InterviewBank />} />
                <Route path="/mock-interview" element={<MockInterviewList />} />
                <Route path="/mock-interview/:id" element={<MockInterviewSession />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route element={<ProtectedRoute><AdminShell /></ProtectedRoute>}>
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/learners" element={<AdminLearners />} />
                <Route path="/admin/curriculum" element={<AdminCurriculum />} />
                <Route path="/admin/datasets" element={<AdminDatasets />} />
                <Route path="/admin/submissions" element={<AdminSubmissions />} />
                <Route path="/admin/interview" element={<AdminInterviewBank />} />
                <Route path="/admin/mock-interviews" element={<AdminMockReviews />} />
                <Route path="/admin/certificates" element={<AdminCertificates />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
