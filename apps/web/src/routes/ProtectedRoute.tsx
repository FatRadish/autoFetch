import { Navigate, useLocation } from 'react-router-dom';
import { PropsWithChildren, ReactElement } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * 路由守卫：未登录跳转登录页
 */
export function ProtectedRoute({ children }: PropsWithChildren): ReactElement {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  // 未登录时跳转登录页，并记录来源路由以便登录后重定向
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
