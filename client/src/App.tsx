import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import Dashboard from "./pages/dashboard";
import NewPica from "./pages/new-pica";
import CalendarPica from "./pages/calendar-pica";
import PicaProgress from "./pages/pica-progress";
import PersonInCharge from "./pages/person-in-charge";
import Department from "./pages/department";
import ProjectSite from "./pages/project-site";
import User from "./pages/user";
import Auth from "./pages/auth";
import NotFound from "./pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>
          <Switch>
            {/* Public routes */}
            <Route path="/auth" component={Auth} />
            
            {/* Routes accessible to anyone (even without login) */}
            <ProtectedRoute path="/" component={Dashboard} requireAuth={false} />
            <ProtectedRoute path="/dashboard" component={Dashboard} requireAuth={false} />
            <ProtectedRoute path="/calendar-pica" component={CalendarPica} requireAuth={false} />
            
            {/* Routes that require login and editing permissions */}
            <ProtectedRoute path="/new-pica" component={NewPica} canEdit={true} />
            <ProtectedRoute path="/pica-progress" component={PicaProgress} canEdit={true} />
            
            {/* Routes that require admin permissions */}
            <ProtectedRoute path="/person-in-charge" component={PersonInCharge} adminOnly={true} />
            <ProtectedRoute path="/department" component={Department} adminOnly={true} />
            <ProtectedRoute path="/project-site" component={ProjectSite} adminOnly={true} />
            <ProtectedRoute path="/user" component={User} adminOnly={true} />
            
            {/* 404 route */}
            <Route component={NotFound} />
          </Switch>
        </Layout>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
