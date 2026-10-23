import { useState } from 'react'
import DetectionPanel from './DetectionPanel.jsx'
import NistCsfPanel from './NistCsfPanel.jsx'

const EDITABLE_FIELDS = [
  { key: 'description', label: 'Description', multiline: true, collapsible: false },
  { key: 'tools', label: 'Test Tools', multiline: false, collapsible: true },
  { key: 'steps', label: 'Test Steps', multiline: true, collapsible: true },
  { key: 'expectedDetection', label: 'Expected Detection', multiline: true, collapsible: true },
  { key: 'logSource', label: 'Log Source / Evidence', multiline: false, collapsible: true },
  { key: 'notes', label: 'Notes', multiline: true, collapsible: true },
]

function SectionHeader({ label, collapsible, open, onToggle, hasValue }) {
  if (!collapsible) {
    return <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</h3>
  }
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between group"
    >
      <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold group-hover:text-slate-400 transition-colors">
        {label}
      </h3>
      <span className={`text-slate-600 text-xs transition-colors group-hover:text-slate-400 ${!hasValue ? 'opacity-40' : ''}`}>
        {open ? '▲' : '▼'}
      </span>
    </button>
  )
}

function StepsList({ text }) {
  if (!text) return null
  const lines = text.split('\n').map((l) => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
  return (
    <ol className="space-y-2 list-none">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-3">
          <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-purple-900/60 text-purple-300 text-xs font-bold">
            {i + 1}
          </span>
          <span className="text-sm text-slate-300 leading-relaxed">{line}</span>
        </li>
      ))}
    </ol>
  )
}

function LogSources({ text }) {
  if (!text) return null
  const items = text.split(';').map((s) => s.trim()).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded border border-slate-700 font-mono">
          {item}
        </span>
      ))}
    </div>
  )
}

function ReadField({ fieldKey, value }) {
  if (!value) return <p className="text-sm text-slate-600 italic">—</p>
  if (fieldKey === 'steps') return <StepsList text={value} />
  if (fieldKey === 'logSource') return <LogSources text={value} />
  if (fieldKey === 'tools') return <p className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{value}</p>
  if (fieldKey === 'notes') {
    return (
      <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg p-3">
        <p className="text-sm text-amber-200 leading-relaxed">{value}</p>
      </div>
    )
  }
  if (fieldKey === 'expectedDetection') {
    return (
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <p className="text-sm text-slate-300 leading-relaxed">{value}</p>
      </div>
    )
  }
  return <p className="text-sm text-slate-300 leading-relaxed">{value}</p>
}

function EditField({ fieldKey, label, value, multiline, onChange }) {
  const base = "w-full bg-slate-800 border border-slate-600 text-slate-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
  return multiline ? (
    <textarea
      className={`${base} min-h-[100px]`}
      value={value ?? ''}
      onChange={(e) => onChange(fieldKey, e.target.value)}
      placeholder={`Enter ${label.toLowerCase()}...`}
    />
  ) : (
    <input
      className={base}
      value={value ?? ''}
      onChange={(e) => onChange(fieldKey, e.target.value)}
      placeholder={`Enter ${label.toLowerCase()}...`}
    />
  )
}

export default function DetailPanel({ tc, detection, onClose, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})

  // Collapsible state: all collapsible sections start open
  const [collapsed, setCollapsed] = useState(() => ({
    ...Object.fromEntries(EDITABLE_FIELDS.filter(f => f.collapsible).map(f => [f.key, true])),
    nistCsf: true,
  }))

  function toggleSection(key) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function startEdit() {
    const initial = {}
    for (const { key } of EDITABLE_FIELDS) initial[key] = tc[key] ?? ''
    setDraft(initial)
    setEditing(true)
    // Expand all sections when entering edit mode
    setCollapsed(prev => ({
      ...Object.fromEntries(EDITABLE_FIELDS.filter(f => f.collapsible).map(f => [f.key, false])),
      nistCsf: prev.nistCsf,
    }))
  }

  function cancelEdit() {
    setDraft({})
    setEditing(false)
  }

  function saveEdit() {
    for (const { key } of EDITABLE_FIELDS) {
      const val = draft[key]?.trim() || null
      onSave(tc.id, key, val)
    }
    setEditing(false)
  }

  function onDraftChange(key, value) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <aside className="w-[440px] shrink-0 border-l border-slate-700 bg-slate-900 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 px-5 py-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="bg-slate-800 text-purple-300 text-xs font-mono px-2 py-0.5 rounded border border-slate-700 shrink-0">
              {tc.id}
            </span>
            {tc.tactic && (
              <span className="text-slate-500 text-xs">{tc.tactic}</span>
            )}
          </div>
          <h2 className="text-slate-100 font-semibold text-base leading-snug">{tc.name}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {!editing ? (
            <button
              onClick={startEdit}
              className="text-xs text-slate-400 hover:text-purple-300 border border-slate-700 hover:border-purple-600 px-2.5 py-1 rounded transition-colors"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={saveEdit}
                className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-700 hover:border-emerald-500 px-2.5 py-1 rounded transition-colors"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="text-xs text-slate-400 hover:text-slate-300 border border-slate-700 px-2.5 py-1 rounded transition-colors"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-5 space-y-0">
        {editing && (
          <div className="bg-purple-900/20 border border-purple-800/40 rounded-lg px-3 py-2 text-xs text-purple-300 mb-5">
            Edits are saved locally in your browser and persist across sessions.
          </div>
        )}

        {EDITABLE_FIELDS.map(({ key, label, multiline, collapsible }) => {
          const isOpen = !collapsible || !collapsed[key]
          const hasValue = !!(editing ? draft[key] : tc[key])

          return (
            <div key={key} className={`border-b border-slate-800/60 ${collapsible ? 'py-3' : 'pb-4 pt-0 mb-1'}`}>
              <SectionHeader
                label={label}
                collapsible={collapsible}
                open={isOpen}
                onToggle={() => toggleSection(key)}
                hasValue={hasValue}
              />
              {isOpen && (
                <div className={collapsible ? 'mt-2.5' : 'mt-1.5'}>
                  {editing ? (
                    <EditField
                      fieldKey={key}
                      label={label}
                      value={draft[key]}
                      multiline={multiline}
                      onChange={onDraftChange}
                    />
                  ) : (
                    <ReadField fieldKey={key} value={tc[key]} />
                  )}
                </div>
              )}
            </div>
          )
        })}

        <NistCsfPanel
          mappings={tc.nistCsf}
          collapsed={collapsed.nistCsf}
          onToggle={() => toggleSection('nistCsf')}
        />

        <div className="pt-4">
          <DetectionPanel detection={detection} />
        </div>
      </div>
    </aside>
  )
}
