import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout.tsx'
import Dashboard from '../pages/Dashboard.tsx'


export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
    ],
  },
])
