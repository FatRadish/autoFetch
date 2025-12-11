import { RouterProvider } from 'react-router-dom';
import { router } from './routes/index.js';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/utils/queryClient';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler.tsx';
import { useTranslation } from '@/lib/i18n';
import request from '@/utils/request';
import { useEffect } from 'react';

function App() {
  const { t } = useTranslation();

  useEffect(() => {
    request.setTranslator(t);
  }, [t]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <GlobalErrorHandler queryClient={queryClient}>
          <RouterProvider router={router} />
        </GlobalErrorHandler>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
