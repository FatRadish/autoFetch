import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/index.ts'
import { ModeToggle } from '@/components/mode-toggle.tsx'
import { LanguageToggle } from '@/components/language-toggle.tsx'
import { useTranslation } from '@/lib/i18n.ts'

export default function MainLayout() {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const { t } = useTranslation()

  const menuItems = [
    { path: '/', label: t('task.taskList'), icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-background shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ☰
            </button>
            <h1 className="text-xl font-bold text-blue-600">AutoFetch</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ModeToggle />
            <button className="btn p-2 hover:bg-gray-100 rounded">🔔</button>
            <button className="btn p-2 hover:bg-gray-100 rounded">👤</button>
          </div>
        </div>
      </header>

      <div className=" pt-14 flex">
        {/* 侧边栏 */}
        {sidebarOpen && (
          <aside className="w-64 bg-background shadow-sm fixed left-0 top-14 bottom-0 overflow-y-auto">
            <nav className="p-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        )}

        {/* 主内容区 */}
        <main
          className={`flex-1 transition-all ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
