import { useState } from 'react'

const FUNCTION_COLORS = {
  Govern:   { bg: 'bg-slate-800/60',   border: 'border-slate-600',   badge: 'bg-slate-700 text-slate-300',   dot: 'bg-slate-400' },
  Identify: { bg: 'bg-blue-900/20',    border: 'border-blue-800/50', badge: 'bg-blue-900/60 text-blue-300',  dot: 'bg-blue-400' },
  Protect:  { bg: 'bg-emerald-900/20', border: 'border-emerald-800/50', badge: 'bg-emerald-900/60 text-emerald-300', dot: 'bg-emerald-400' },
  Detect:   { bg: 'bg-amber-900/20',   border: 'border-amber-800/50', badge: 'bg-amber-900/60 text-amber-300', dot: 'bg-amber-400' },
  Respond:  { bg: 'bg-orange-900/20',  border: 'border-orange-800/50', badge: 'bg-orange-900/60 text-orange-300', dot: 'bg-orange-400' },
  Recover:  { bg: 'bg-violet-900/20',  border: 'border-violet-800/50', badge: 'bg-violet-900/60 text-violet-300', dot: 'bg-violet-400' },
}

const DEFAULT_COLORS = FUNCTION_COLORS.Identify

export default function NistCsfPanel({ mappings, collapsed, onToggle }) {
  if (!mappings || mappings.length === 0) return null

  return (
    <div className="border-b border-slate-800/60 py-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between group"
      >
        <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold group-hover:text-slate-400 transition-colors">
          NIST CSF 2.0
        </h3>
        <span className="text-slate-600 text-xs transition-colors group-hover:text-slate-400">
          {collapsed ? '▼' : '▲'}
        </span>
      </button>

      {!collapsed && (
        <div className="mt-2.5 space-y-2">
          {mappings.map((entry, i) => {
            const colors = FUNCTION_COLORS[entry.function] ?? DEFAULT_COLORS
            return (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2.5 ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2 py-0.5 rounded ${colors.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                    {entry.subcategory}
                  </span>
                  <span className="text-xs text-slate-500">{entry.function} · {entry.category}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{entry.description}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
