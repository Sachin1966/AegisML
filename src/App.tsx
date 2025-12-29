import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import ExperimentControl from "./pages/ExperimentControl";
import InternalSignalDashboard from "./pages/InternalSignalDashboard";
import SelfAwarenessDashboard from "./pages/SelfAwarenessDashboard";
import EvaluationMetrics from "./pages/EvaluationMetrics";
import Explainability from "./pages/Explainability";
import ExperimentHistory from "./pages/ExperimentHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<ExperimentControl />} />
              <Route path="/signals" element={<InternalSignalDashboard />} />
              <Route path="/awareness" element={<SelfAwarenessDashboard />} />
              <Route path="/metrics" element={<EvaluationMetrics />} />
              <Route path="/explainability" element={<Explainability />} />
              <Route path="/history" element={<ExperimentHistory />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
