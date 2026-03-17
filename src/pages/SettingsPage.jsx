import { CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { useSettings } from '../hooks/useSettings'
import GatewaySection from '../components/settings/GatewaySection'
import ModelRegistrySection from '../components/settings/ModelRegistrySection'
import CursorIntegrationSection from '../components/settings/CursorIntegrationSection'
import DisplayPreferencesSection from '../components/settings/DisplayPreferencesSection'
import BudgetSection from '../components/settings/BudgetSection'
import BriefingSection from '../components/settings/BriefingSection'
import TaskIntegrationSection from '../components/settings/TaskIntegrationSection'
import CrmIntegrationSection from '../components/settings/CrmIntegrationSection'
import YouTubeSection from '../components/settings/YouTubeSection'
import ResearchApiSection from '../components/settings/ResearchApiSection'
import ImageGenSection from '../components/settings/ImageGenSection'

export default function SettingsPage() {
  const {
    settings,
    saveFlash,
    updateGateways,
    updateProvider,
    updateCursor,
    updateDisplay,
    updateBudget,
    updateBriefing,
    updateTaskIntegration,
    updateYouTube,
    updateResearch,
    updateImageGen,
    updateCrm,
  } = useSettings()

  return (
    <div className="space-y-4">
      <GatewaySection
        gateways={settings.gateways}
        onUpdate={updateGateways}
      />

      <ModelRegistrySection
        providers={settings.providers}
        onUpdate={updateProvider}
      />

      <BudgetSection
        budget={settings.budget}
        onUpdate={updateBudget}
      />

      <BriefingSection
        briefing={settings.briefing}
        onUpdate={updateBriefing}
      />

      <TaskIntegrationSection
        taskIntegration={settings.taskIntegration}
        onUpdate={updateTaskIntegration}
      />

      <YouTubeSection
        youtube={settings.youtube}
        onUpdate={updateYouTube}
      />

      <ResearchApiSection
        research={settings.research}
        onUpdate={updateResearch}
      />

      <ImageGenSection
        imageGen={settings.imageGen}
        onUpdate={updateImageGen}
      />

      <CrmIntegrationSection
        crm={settings.crm}
        onUpdate={updateCrm}
      />

      <CursorIntegrationSection
        cursor={settings.cursor}
        onUpdate={updateCursor}
      />

      <DisplayPreferencesSection
        display={settings.display}
        onUpdate={updateDisplay}
      />

      {/* Auto-save toast */}
      <div
        className={clsx(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-surface-800 border border-surface-600 px-4 py-2.5 shadow-xl transition-all duration-300',
          saveFlash ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        )}
      >
        <CheckCircle2 className="h-4 w-4 text-status-online" />
        <span className="text-xs font-medium text-gray-300">Settings saved</span>
      </div>
    </div>
  )
}
