import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get API base URL from environment variable
// In production (Firebase), use Render backend URL
// In development, use relative URLs (same origin)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper to construct full API URL
function getApiUrl(path: string): string {
  // If path already starts with http, return as is
  if (path.startsWith('http')) {
    return path;
  }
  // Otherwise, prepend base URL
  return `${API_BASE_URL}${path}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = getApiUrl(url);
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = getApiUrl(queryKey[0] as string);
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Helper function to invalidate related queries
export function invalidateRelatedQueries(entityType: string, id?: number) {
  // Always invalidate the collection
  queryClient.invalidateQueries({ queryKey: [`/api/${entityType}`] });
  
  // Invalidate the specific entity if ID is provided
  if (id) {
    queryClient.invalidateQueries({ queryKey: [`/api/${entityType}/${id}`] });
  }
  
  // Invalidate related statistics
  if (entityType === 'picas') {
    queryClient.invalidateQueries({ queryKey: ['/api/picas/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/picas/stats/department'] });
    queryClient.invalidateQueries({ queryKey: ['/api/picas/stats/site'] });
    
    // If we have an ID, invalidate its history too
    if (id) {
      queryClient.invalidateQueries({ queryKey: [`/api/picas/${id}/history`] });
    }
  }
  
  // Invalidate dashboard data
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true, // Refetch when window regains focus
      staleTime: 10000, // Consider data stale after 10 seconds
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
