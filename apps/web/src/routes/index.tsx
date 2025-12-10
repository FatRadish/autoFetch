import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout.tsx'
import Dashboard from '../pages/Dashboard.tsx'
import { ProtectedRoute } from './ProtectedRoute.tsx'


export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
    ],
  },
  {
    path: '/login',
    element: import('../pages/Login.tsx').then((module) => <module.default />),
  }
])
