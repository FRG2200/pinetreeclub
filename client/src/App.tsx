import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import AuthPage from "@/pages/auth";
import LandingPage from "@/pages/landing";
import InspirationPage from "@/pages/inspiration";
import ModelRankingPage from "@/pages/model-ranking";
import AppsPage from "@/pages/apps";
import TextToImagePage from "@/pages/text-to-image";
import ImageEditPage from "@/pages/image-edit";
import TextToVideoPage from "@/pages/text-to-video";
import ImageToVideoPage from "@/pages/image-to-video";
import RefImageToVideoPage from "@/pages/ref-image-to-video";
import VideoToVideoPage from "@/pages/video-to-video";
import LibraryPage from "@/pages/library";
import ProfilePage from "@/pages/profile";
import CreditsTasksPage from "@/pages/credits-tasks";
import PricingPage from "@/pages/pricing";
import CreatePage from "@/pages/create";
import AdminWhitelistPage from "@/pages/admin-whitelist";
import AdminUsersPage from "@/pages/admin-users";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route component={LandingPage} />
    </Switch>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground font-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <PublicRouter />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={InspirationPage} />
        <Route path="/inspiration" component={InspirationPage} />
        <Route path="/model-ranking" component={ModelRankingPage} />
        <Route path="/apps" component={AppsPage} />
        <Route path="/text-to-image" component={TextToImagePage} />
        <Route path="/image-edit" component={ImageEditPage} />
        <Route path="/text-to-video" component={TextToVideoPage} />
        <Route path="/image-to-video" component={ImageToVideoPage} />
        <Route path="/ref-image-to-video" component={RefImageToVideoPage} />
        <Route path="/video-to-video" component={VideoToVideoPage} />
        <Route path="/library" component={LibraryPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/credits-tasks" component={CreditsTasksPage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/create" component={CreatePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/admin/whitelist" component={AdminWhitelistPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthGate>
          <Router />
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
