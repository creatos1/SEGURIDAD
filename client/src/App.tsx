
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { TourProvider } from "./hooks/use-tour";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";
import TourGuide from "./components/onboarding/tours";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/routes" component={DashboardPage} />
      <ProtectedRoute path="/drivers" component={DashboardPage} />
      <ProtectedRoute path="/vehicles" component={DashboardPage} />
      <ProtectedRoute path="/favorites" component={DashboardPage} />
      <ProtectedRoute path="/ratings" component={DashboardPage} />
      <ProtectedRoute path="/history" component={DashboardPage} />
      <ProtectedRoute path="/vehicle" component={DashboardPage} />
      <ProtectedRoute path="/schedule" component={DashboardPage} />
      <ProtectedRoute path="/my-ratings" component={DashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TourProvider>
          <Router />
          <TourGuide />
          <Toaster />
        </TourProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
