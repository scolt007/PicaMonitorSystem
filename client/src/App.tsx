import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import Layout from "./components/layout/Layout";

// Pages
import Dashboard from "./pages/dashboard";
import NewPica from "./pages/new-pica";
import CalendarPica from "./pages/calendar-pica";
import PicaProgress from "./pages/pica-progress";
import PersonInCharge from "./pages/person-in-charge";
import Department from "./pages/department";
import ProjectSite from "./pages/project-site";
import User from "./pages/user";
import NotFound from "./pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/new-pica" component={NewPica} />
          <Route path="/calendar-pica" component={CalendarPica} />
          <Route path="/pica-progress" component={PicaProgress} />
          <Route path="/person-in-charge" component={PersonInCharge} />
          <Route path="/department" component={Department} />
          <Route path="/project-site" component={ProjectSite} />
          <Route path="/user" component={User} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
