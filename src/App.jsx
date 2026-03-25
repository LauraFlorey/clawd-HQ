import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import AgentDetailPage from './pages/AgentDetailPage'
import TokenUsagePage from './pages/TokenUsagePage'
import SettingsPage from './pages/SettingsPage'
import MemoryPage from './pages/MemoryPage'
import ProjectsPage from './pages/ProjectsPage'
import TasksPage from './pages/TasksPage'
import CrmPage from './pages/CrmPage'
import ChatPage from './pages/ChatPage'
import KnowledgePage from './pages/KnowledgePage'
import ContentPage from './pages/ContentPage'
import ResearchPage from './pages/ResearchPage'
import YouTubePage from './pages/YouTubePage'
import ImagesPage from './pages/ImagesPage'
import LinksPage from './pages/LinksPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="memory" element={<MemoryPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="clients" element={<CrmPage />} />
        <Route path="costs" element={<TokenUsagePage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="agent" element={<AgentDetailPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="research" element={<ResearchPage />} />
        <Route path="youtube" element={<YouTubePage />} />
        <Route path="images" element={<ImagesPage />} />
        <Route path="links" element={<LinksPage />} />

        {/* Legacy redirects */}
        <Route path="crm" element={<Navigate to="/clients" replace />} />

        {/* Legacy routes — redirect to new paths */}
        <Route path="agents" element={<Navigate to="/agent" replace />} />
        <Route path="agents/:agentId" element={<AgentDetailPage />} />
        <Route path="usage" element={<Navigate to="/costs" replace />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
