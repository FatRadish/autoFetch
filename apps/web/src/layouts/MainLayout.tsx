import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Outlet } from 'react-router-dom';
import ContentHeader from '@/components/content-header';

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <ContentHeader />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
