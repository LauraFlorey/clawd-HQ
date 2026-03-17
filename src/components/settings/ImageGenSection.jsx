import { ImageIcon } from 'lucide-react'
import clsx from 'clsx'
import CollapsibleSection from './CollapsibleSection'

// TODO: Provider API integration via Jinx backend

const PROVIDERS = ['DALL-E 3', 'Stable Diffusion', 'Flux', 'Midjourney']
const STYLES = ['Photorealistic', 'Illustration', 'Minimal', 'Watercolor', '3D Render', 'Pixel Art', 'Logo', 'Poster']
const VARIANT_OPTIONS = [1, 2, 3]

export default function ImageGenSection({ imageGen, onUpdate }) {
  return (
    <CollapsibleSection
      icon={ImageIcon}
      title="Image Generation"
      subtitle="Configure your image generation provider and default settings"
      defaultOpen={false}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-gray-400">Provider</label>
          <select
            value={imageGen.provider || 'dall-e-3'}
            onChange={(e) => onUpdate({ provider: e.target.value })}
            className="settings-select w-full max-w-xs"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p.toLowerCase().replace(/\s+/g, '-')}>{p}</option>
            ))}
          </select>
          <p className="mt-0.5 text-[9px] text-gray-600">
            Select the AI image generation service. Each provider requires its own API key.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-gray-400">API Key</label>
          <input
            type="password"
            value={imageGen.apiKey || ''}
            onChange={(e) => onUpdate({ apiKey: e.target.value })}
            placeholder="Enter provider API key"
            className="settings-input w-full max-w-md"
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-400">Default Style</label>
            <select
              value={imageGen.defaultStyle || 'Photorealistic'}
              onChange={(e) => onUpdate({ defaultStyle: e.target.value })}
              className="settings-select w-full"
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-400">Default Variants</label>
            <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
              {VARIANT_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => onUpdate({ defaultVariants: v })}
                  className={clsx(
                    'flex-1 rounded-md py-1.5 text-[11px] font-medium transition-colors',
                    (imageGen.defaultVariants || 2) === v ? 'bg-surface-600 text-gray-100' : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-gray-400">Output Folder</label>
          <input
            type="text"
            value={imageGen.outputFolder || '~/agent-workspace/assets/images/'}
            onChange={(e) => onUpdate({ outputFolder: e.target.value })}
            placeholder="~/agent-workspace/assets/images/"
            className="settings-input w-full max-w-md"
          />
          <p className="mt-0.5 text-[9px] text-gray-600">
            Where generated images will be saved when you click Download.
          </p>
        </div>
      </div>
    </CollapsibleSection>
  )
}
