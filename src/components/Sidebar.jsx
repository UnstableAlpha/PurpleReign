const TACTIC_ORDER = [
  'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation',
  'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
  'Collection', 'Command and Control', 'Exfiltration', 'Impact',
]

export default function Sidebar({ tactics, counts, selected, onSelect, total }) {
  const ordered = TACTIC_ORDER.filter((t) => tactics.includes(t))

  return (
    <aside className="w-52 shrink-0 bg-slate-900 border-r border-slate-700 overflow-y-auto flex flex-col">
      <div className="px-3 pt-4 pb-2">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Tactics</p>
      </div>

      <nav className="flex-1 px-2 pb-4 space-y-0.5">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
            selected === null
              ? 'bg-purple-700 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span>All Tactics</span>
          <span className={`text-xs ${selected === null ? 'text-purple-200' : 'text-slate-500'}`}>
            {total}
          </span>
        </button>

        <div className="border-t border-slate-700 my-2" />

        {ordered.map((tactic) => (
          <button
            key={tactic}
            onClick={() => onSelect(tactic)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
              selected === tactic
                ? 'bg-purple-700 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-left leading-tight">{tactic}</span>
            <span className={`text-xs shrink-0 ml-1 ${selected === tactic ? 'text-purple-200' : 'text-slate-500'}`}>
              {counts[tactic] ?? 0}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
