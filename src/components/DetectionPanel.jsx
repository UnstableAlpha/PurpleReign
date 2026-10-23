import { useState } from 'react'

export default function DetectionPanel({ detection }) {
  const [open, setOpen] = useState(true)

  if (!detection) return null

  const parts = detection.detectionLogic?.split(' | ') ?? []

  return (
    <div className="mt-6 border border-purple-800/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-900/30 text-left hover:bg-purple-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-purple-400 text-xs">⬡</span>
          <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
            Detection Engineering Reference
          </span>
        </div>
        <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 py-3 bg-slate-900/50 space-y-2">
          {detection.tactics && (
            <p className="text-xs text-slate-500">
              Tactic: <span className="text-slate-400">{detection.tactics}</span>
            </p>
          )}
          {parts.length > 0 ? (
            <ul className="space-y-2">
              {parts.map((part, i) => (
                <li key={i} className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-800/60 rounded px-3 py-2 border-l-2 border-purple-700">
                  {part.trim()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No detection logic recorded.</p>
          )}
        </div>
      )}
    </div>
  )
}
