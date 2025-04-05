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
        <Switch>
          {/* Public routes */}
          <Route path="/auth" component={Auth} />
          
          {/* Routes accessible to anyone (even without login) */}
          <Route path="/">
            {() => (
              <Layout>
                <Dashboard />
              </Layout>
            )}
          </Route>
          <Route path="/dashboard">
            {() => (
              <Layout>
                <Dashboard />
              </Layout>
            )}
          </Route>
          <Route path="/calendar-pica">
            {() => (
              <Layout>
                <CalendarPica />
              </Layout>
            )}
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
          
          <ProtectedRoute path="/project-site" component={(params) => (
            <Layout>
              <ProjectSite {...params} />
            </Layout>
          )} adminOnly={true} />
          
          <ProtectedRoute path="/user" component={(params) => (
            <Layout>
              <User {...params} />
            </Layout>
          )} adminOnly={true} />
          
          {/* 404 route */}
          <Route>
            {() => (
              <Layout>
                <NotFound />
              </Layout>
            )}
          </Route>
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
