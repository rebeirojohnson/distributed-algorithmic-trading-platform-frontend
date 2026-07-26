import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { AuthProvider } from '@/auth/session';
import { RealtimeProvider } from '@/realtime/RealtimeProvider';
import { router } from '@/app/router';
import '@/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && error.name === 'ApiError') return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <RouterProvider router={router} />
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
