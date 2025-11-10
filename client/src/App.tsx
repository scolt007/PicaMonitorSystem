import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";

// Pages
import Dashboard from "./pages/dashboard";
import NewPica from "./pages/new-pica";
import CalendarPica from "./pages/calendar-pica";
import PicaProgress from "./pages/pica-progress";
import PersonInCharge from "./pages/person-in-charge";

import Department from "./pages/department";
import ProjectJob from "./pages/project-job";
import User from "./pages/user";
import Auth from "./pages/auth";
import NotFound from "./pages/not-found";

// Routes wrapper component that checks authentication
function RoutesWithAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If still loading auth state, show nothing
  if (isLoading) {
    return null;
  }
  
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={Auth} />
      
      {/* Redirect to auth if not authenticated */}
      <Route path="/">
        {() => {
          if (!isAuthenticated) {
            return <Redirect to="/auth" />;
          }
          return (
            <Layout>
              <Dashboard />
            </Layout>
          );
        }}
      </Route>
      
      {/* All other routes require authentication */}
      <Route path="/dashboard">
        {() => {
          if (!isAuthenticated) {
            return <Redirect to="/auth" />;
          }
          return (
            <Layout>
              <Dashboard />
            </Layout>
          );
        }}
      </Route>
      
      <Route path="/calendar-pica">
        {() => {
          if (!isAuthenticated) {
            return <Redirect to="/auth" />;
          }
          return (
            <Layout>
              <CalendarPica />
            </Layout>
          );
        }}
      </Route>
      
      {/* Routes that require login and editing permissions */}
      <ProtectedRoute path="/new-pica" component={(params) => (
        <Layout>
          <NewPica {...params} />
        </Layout>
      )} canEdit={true} />
      
      <ProtectedRoute path="/pica-progress" component={(params) => (
        <Layout>
          <PicaProgress {...params} />
        </Layout>
      )} canEdit={true} />
      
      {/* Routes that require admin permissions */}
      <ProtectedRoute path="/person-in-charge" component={(params) => (
        <Layout>
          <PersonInCharge {...params} />
        </Layout>
      )} adminOnly={true} />
      
      <ProtectedRoute path="/department" component={(params) => (
        <Layout>
          <Department {...params} />
        </Layout>
      )} adminOnly={true} />
      
      <ProtectedRoute path="/project-job" component={(params) => (
        <Layout>
          <ProjectJob {...params} />
        </Layout>
      )} adminOnly={true} />
      
      <ProtectedRoute path="/user" component={(params) => (
        <Layout>
          <User {...params} />
        </Layout>
      )} adminOnly={true} />
      
      {/* 404 route */}
      <Route>
        {() => {
          if (!isAuthenticated) {
            return <Redirect to="/auth" />;
          }
          return (
            <Layout>
              <NotFound />
            </Layout>
          );
        }}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoutesWithAuth />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
