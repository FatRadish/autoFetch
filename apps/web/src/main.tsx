import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './components/AppProvider.tsx';
import { setupI18n } from './lib/i18n.ts';
import './style.css';

// 初始化 i18n 后再渲染应用
setupI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </StrictMode>
  );
});
