import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as UserType, UserRole } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LoginCredentials = {
  username: string;
  password: string;
};

type AuthContextType = {
  user: UserType | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  canDelete: boolean;
  login: UseMutationResult<UserType, Error, LoginCredentials>;
  logout: UseMutationResult<void, Error, void>;
  register: UseMutationResult<UserType, Error, typeof insertUserSchema._type>;
};

// Create the auth context
export const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // Fetch the current user data
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useQuery<UserType | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Ensure user is properly typed
  const user = data || null;

  // Check user permissions based on role
  useEffect(() => {
    if (user) {
      // Admin can do everything
      if (user.role === "admin") {
        setIsAdmin(true);
        setCanEdit(true);
        setCanDelete(true);
      } 
      // Regular user can edit but not delete
      else if (user.role === "user") {
        setIsAdmin(false);
        setCanEdit(true);
        setCanDelete(false);
      } 
      // Public can only view
      else {
        setIsAdmin(false);
        setCanEdit(false);
        setCanDelete(false);
      }
    } else {
      setIsAdmin(false);
      setCanEdit(false);
      setCanDelete(false);
    }
  }, [user]);

  // Login mutation
  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: UserType) => {
      queryClient.setQueryData(["/api/auth/user"], userData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const register = useMutation({
    mutationFn: async (userData: typeof insertUserSchema._type) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      return await res.json();
    },
    onSuccess: (userData: UserType) => {
      queryClient.setQueryData(["/api/auth/user"], userData);
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const contextValue: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin,
    canEdit,
    canDelete,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}