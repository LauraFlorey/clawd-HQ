import { useState, useMemo, useRef } from 'react'
import {
  ImageIcon, Sparkles, Check, RefreshCw, Download, Trash2,
  Upload, ChevronRight, X, Plus, Loader2, Info,
} from 'lucide-react'
import clsx from 'clsx'
import { useImageGen } from '../hooks/useImageGen'
import { formatRelativeTime } from '../utils/formatters'

// ─── Constants ──────────────────────────────────────────────────

const STYLES = ['Photorealistic', 'Illustration', 'Minimal', 'Watercolor', '3D Render', 'Pixel Art', 'Logo', 'Poster']
const ASPECTS = ['1:1', '16:9', '9:16', '4:3']
const VARIANT_OPTIONS = [1, 2, 3]

const ASPECT_CLASSES = {
  '1:1': 'aspect-square',
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '4:3': 'aspect-[4/3]',
}

// ─── Gradient Image Placeholder ─────────────────────────────────

function GradientImage({ gradient, style, label, aspectRatio, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={clsx('relative rounded-lg overflow-hidden', ASPECT_CLASSES[aspectRatio] || 'aspect-square', onClick && 'cursor-pointer', className)}
      style={{ background: gradient }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        <ImageIcon className="h-6 w-6 text-white/30 mb-2" />
        <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">{style}</span>
        {label && <p className="mt-1 text-[10px] text-white/40 line-clamp-2 max-w-[200px]">{label}</p>}
      </div>
    </div>
  )
}

// ─── Lightbox Modal ─────────────────────────────────────────────

function Lightbox({ image, onClose }) {
  if (!image) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl">
        <button onClick={onClose} className="absolute -top-10 right-0 rounded-md p-1 text-gray-400 hover:text-gray-200"><X className="h-5 w-5" /></button>
        <GradientImage
          gradient={image.gradient}
          style={image.style}
          label={image.prompt || image.label}
          aspectRatio={image.aspectRatio}
          className="w-full"
        />
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-gray-300 leading-relaxed">{image.prompt || image.label}</p>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span>Style: {image.style}</span>
            <span>Aspect: {image.aspectRatio}</span>
            {image.createdAt && <span>{formatRelativeTime(image.createdAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Left Panel: Input ──────────────────────────────────────────

function GenerationInput({ onGenerate, generating, sessionPrompts, onClearSession, externalPrompt }) {
  const [prompt, setPrompt] = useState('')
  const [lastExternal, setLastExternal] = useState(null)
  if (externalPrompt && externalPrompt !== lastExternal) {
    setPrompt(externalPrompt.replace(/\|\d+$/, ''))
    setLastExternal(externalPrompt)
  }
  const [style, setStyle] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [variants, setVariants] = useState(2)
  const [negativePrompt, setNegativePrompt] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const fileRef = useRef(null)

  function handleStyleClick(s) {
    if (style === s) {
      setStyle('')
      return
    }
    setStyle(s)
    if (!prompt.toLowerCase().includes(s.toLowerCase())) {
      setPrompt((p) => p ? `${p}, ${s.toLowerCase()} style` : `${s.toLowerCase()} style`)
    }
  }

  function handleGenerate() {
    if (!prompt.trim()) return
    onGenerate({ prompt: prompt.trim(), style: style || 'Photorealistic', aspectRatio, variants, negativePrompt: negativePrompt.trim() || null })
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setUploadPreview(url)
  }

  function handleIterate(p) {
    setPrompt(p)
  }

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-[13px] font-semibold text-gray-200">Generate</h3>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to create..."
          rows={4}
          className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2.5 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50 resize-none leading-relaxed"
        />

        {/* Style presets */}
        <div>
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-gray-600">Style</label>
          <div className="flex flex-wrap gap-1.5">
            {STYLES.map((s) => (
              <button
                key={s}
                onClick={() => handleStyleClick(s)}
                className={clsx(
                  'rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors border',
                  style === s ? 'border-accent/30 bg-accent/10 text-accent' : 'border-surface-600 bg-surface-800 text-gray-400 hover:text-gray-200 hover:border-surface-500'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced options */}
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300"
        >
          <ChevronRight className={clsx('h-3 w-3 transition-transform duration-200', advancedOpen && 'rotate-90')} />
          Advanced options
        </button>

        {advancedOpen && (
          <div className="space-y-3 pl-4 border-l border-surface-700">
            <div>
              <label className="mb-1.5 block text-[10px] font-medium text-gray-500">Aspect Ratio</label>
              <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
                {ASPECTS.map((a) => (
                  <button key={a} onClick={() => setAspectRatio(a)} className={clsx('rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors', aspectRatio === a ? 'bg-surface-600 text-gray-100' : 'text-gray-500 hover:text-gray-300')}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-medium text-gray-500">Variants</label>
              <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
                {VARIANT_OPTIONS.map((v) => (
                  <button key={v} onClick={() => setVariants(v)} className={clsx('rounded-md px-3 py-1 text-[10px] font-medium transition-colors', variants === v ? 'bg-surface-600 text-gray-100' : 'text-gray-500 hover:text-gray-300')}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-medium text-gray-500">Negative Prompt</label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Things to avoid..."
                className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Upload section */}
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-gray-500" />
          <h4 className="text-[12px] font-semibold text-gray-200">Edit Image</h4>
        </div>

        {uploadPreview ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden aspect-video bg-surface-800">
              <img src={uploadPreview} alt="Upload preview" className="h-full w-full object-cover" />
              <button onClick={() => setUploadPreview(null)} className="absolute top-2 right-2 rounded-md bg-black/50 p-1 text-white/70 hover:text-white"><X className="h-3 w-3" /></button>
            </div>
            <input type="text" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Describe edits..." className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50" />
            <button disabled className="flex items-center gap-1.5 rounded-lg bg-surface-700 px-3 py-1.5 text-[11px] text-gray-500 cursor-not-allowed">
              <Sparkles className="h-3 w-3" /> Edit Image (coming soon)
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-lg border-2 border-dashed border-surface-600 py-6 text-center transition-colors hover:border-surface-500"
          >
            <Upload className="mx-auto h-5 w-5 text-gray-600 mb-1" />
            <p className="text-[11px] text-gray-500">Drop an image or click to upload</p>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {/* TODO: img2img / inpainting via Jinx API */}
      </div>

      {/* Session history */}
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <button onClick={() => setHistoryOpen(!historyOpen)} className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-200">
            <ChevronRight className={clsx('h-3 w-3 text-gray-600 transition-transform duration-200', historyOpen && 'rotate-90')} />
            Current Session
            {sessionPrompts.length > 0 && <span className="text-[10px] text-gray-600">({sessionPrompts.length})</span>}
          </button>
          <button onClick={onClearSession} className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400">
            <Plus className="h-2.5 w-2.5" /> New Session
          </button>
        </div>
        {historyOpen && sessionPrompts.length > 0 && (
          <div className="space-y-1 pl-4">
            {sessionPrompts.map((p, i) => (
              <button key={i} onClick={() => handleIterate(p)} className="block w-full text-left text-[10px] text-gray-500 truncate hover:text-accent transition-colors">
                {i + 1}. {p}
              </button>
            ))}
          </div>
        )}
        {historyOpen && sessionPrompts.length === 0 && (
          <p className="text-[10px] text-gray-600 pl-4">No prompts yet in this session.</p>
        )}
      </div>
    </div>
  )
}

// ─── Right Panel: Gallery ───────────────────────────────────────

function GeneratedResults({ results, generating, onAccept, onIterate, onExpand }) {
  if (generating) {
    return (
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-8 flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
        </div>
        <p className="text-sm text-gray-300">Generating images...</p>
        <p className="text-[10px] text-gray-600">This usually takes a few seconds</p>
      </div>
    )
  }

  if (results.length === 0) return null

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[12px] font-semibold text-gray-200">Generated</h4>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <Info className="h-3 w-3" />
          Visual placeholders — API not connected
        </div>
      </div>
      <div className={clsx('grid gap-3', results.length === 1 ? 'grid-cols-1' : results.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3')}>
        {results.map((img) => (
          <div key={img.id} className="group relative">
            <GradientImage
              gradient={img.gradient}
              style={img.style}
              label={img.label}
              aspectRatio={img.aspectRatio}
              onClick={() => onExpand(img)}
              className="w-full"
            />
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onAccept(img)} title="Save to assets" className="rounded-md bg-green-600/80 p-1.5 text-white hover:bg-green-600 backdrop-blur-sm"><Check className="h-3 w-3" /></button>
              <button onClick={() => onIterate(img.prompt)} title="Iterate" className="rounded-md bg-surface-700/80 p-1.5 text-gray-300 hover:bg-surface-600 backdrop-blur-sm"><RefreshCw className="h-3 w-3" /></button>
              <button title="Download (coming soon)" className="rounded-md bg-surface-700/80 p-1.5 text-gray-300 hover:bg-surface-600 backdrop-blur-sm"><Download className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SavedAssetsGrid({ assets, onDelete, onExpand }) {
  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-8 text-center">
        <ImageIcon className="mx-auto h-8 w-8 text-gray-700 mb-2" />
        <p className="text-sm text-gray-500">No saved assets yet</p>
        <p className="text-[11px] text-gray-600 mt-1">Generate images and click the green check to save them here</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <h4 className="text-[12px] font-semibold text-gray-200 mb-3">Saved Assets <span className="text-gray-600 font-normal">({assets.length})</span></h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {assets.map((img) => (
          <div key={img.id} className="group relative">
            <GradientImage
              gradient={img.gradient}
              style={img.style}
              label={img.label}
              aspectRatio={img.aspectRatio}
              onClick={() => onExpand(img)}
              className="w-full"
            />
            {!img.isMock && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(img.id) }}
                className="absolute top-1.5 right-1.5 rounded-md bg-black/50 p-1 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity hover:text-status-offline backdrop-blur-sm"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            <div className="mt-1.5">
              <p className="text-[10px] text-gray-400 truncate">{img.label || img.prompt}</p>
              <div className="flex items-center gap-2 text-[9px] text-gray-600">
                <span>{img.style}</span>
                <span>{img.aspectRatio}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────

export default function ImagesPage() {
  const {
    allAssets, generating, currentResults, sessionPrompts,
    generate, acceptImage, deleteAsset, clearSession,
  } = useImageGen()

  const [lightbox, setLightbox] = useState(null)
  const [iteratePrompt, setIteratePrompt] = useState(null)

  function handleIterate(p) {
    setIteratePrompt(p + '|' + Date.now())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-gray-100">Images</h1>
        <p className="mt-0.5 text-[12px] text-gray-500">AI image generation workspace with iteration history</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Left panel */}
        <div className="min-w-0">
          <GenerationInput
            onGenerate={generate}
            generating={generating}
            sessionPrompts={sessionPrompts}
            onClearSession={clearSession}
            externalPrompt={iteratePrompt}
          />
        </div>

        {/* Right panel */}
        <div className="min-w-0 space-y-5">
          <GeneratedResults
            results={currentResults}
            generating={generating}
            onAccept={acceptImage}
            onIterate={handleIterate}
            onExpand={setLightbox}
          />
          <SavedAssetsGrid
            assets={allAssets}
            onDelete={deleteAsset}
            onExpand={setLightbox}
          />
        </div>
      </div>

      {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}
