import {
  FileCheck,
  ChevronDown,
  User2,
  ChevronUp,
  CircleUser,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n.ts';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import LoadingIcon from '@/components/ui/loading-icon';

import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/api/login.ts';

export function AppSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const logOut = useLogout(t('auth.logoutSuccess'));

  const menuItems = [
    {
      groupLabel: 'Application',
      children: [
        // { title: t('menu.dashboard'), url: '#/dashboard', icon: Home },
        { title: t('menu.accounts'), url: '#/accounts', icon: CircleUser },
        { title: t('menu.tasks'), url: '#/tasks', icon: FileCheck },
      ],
    },
  ];
  return (
    <Sidebar>
      <SidebarContent>
        {menuItems.map((group) => (
          <Collapsible
            key={group.groupLabel}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  {group.groupLabel}
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.children.map((item) => {
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={
                              location.pathname === item.url.replace('#', '')
                            }
                          >
                            <a href={item.url}>
                              <item.icon />
                              <span>{item.title}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      {/* 底部栏 */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {user?.username}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>{t('auth.settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logOut.mutate()}>
                  {logOut.isPending ? (
                    <>
                      <LoadingIcon /> <span>{t('auth.logout')}</span>
                    </>
                  ) : (
                    <span>{t('auth.logout')}</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
