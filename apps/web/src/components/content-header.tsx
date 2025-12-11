import { SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageToggle } from '@/components/language-toggle.tsx';
import { ModeToggle } from '@/components/mode-toggle.tsx';

export default function SidebarHeader() {
  return (
    <div className="flex justify-between items-center p-2">
      <SidebarTrigger></SidebarTrigger>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ModeToggle />
      </div>
    </div>
  );
}
