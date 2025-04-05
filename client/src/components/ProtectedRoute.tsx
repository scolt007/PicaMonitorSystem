import { ReactNode } from "react";
import { Redirect, Route, RouteComponentProps } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  requireAuth?: boolean; // Whether authentication is required at all
  adminOnly?: boolean; // Whether only admins can access this route
  canEdit?: boolean; // Whether only users who can edit can access this route
}

export function ProtectedRoute({
  path,
  component: Component,
  requireAuth = true,
  adminOnly = false,
  canEdit = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isAdmin, canEdit: userCanEdit } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        // Loading state
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Admin-only route
        if (adminOnly && !isAdmin) {
          return <Redirect to="/auth" />;
        }

        // Edit-permission route
        if (canEdit && !userCanEdit) {
          return <Redirect to="/auth" />;
        }

        // Any authenticated user route
        if (requireAuth && !isAuthenticated) {
          return <Redirect to="/auth" />;
        }

        // Render the component if all conditions are met
        return <Component {...params} />;
      }}
    </Route>
  );
}