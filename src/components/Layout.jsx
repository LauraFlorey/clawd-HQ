import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import KnowledgeSearch from './KnowledgeSearch'
import ErrorBoundary from './ErrorBoundary'
import { useSearchRef } from '../context/SearchContext'

const PAGE_TITLES = {
  '/': 'Home',
  '/memory': 'Memory',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/clients': 'Clients',
  '/crm': 'Clients',  // Legacy
  '/costs': 'Costs',
  '/chat': 'Chat',
  '/settings': 'Settings',
  '/agent': 'Jinx',
}

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useSearchRef()
  const location = useLocation()

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev)

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    setTimeout(() => searchRef?.current?.focus(), 50)
  }, [searchRef])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
  }, [])

  useEffect(() => {
    const base = 'Agent HQ'
    const pageTitle = PAGE_TITLES[location.pathname]
      || (location.pathname.startsWith('/agents/') ? 'Jinx' : 'Home')
    document.title = `${pageTitle} — ${base}`
  }, [location.pathname])

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (searchOpen) {
          closeSearch()
        } else {
          openSearch()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, openSearch, closeSearch])

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-5 md:pb-5 lg:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Global knowledge search overlay — Cmd+K from any page */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSearch} />
          <div className="relative z-10 w-full max-w-2xl px-4">
            <KnowledgeSearch ref={searchRef} onClose={closeSearch} />
          </div>
        </div>
      )}
    </div>
  )
}
