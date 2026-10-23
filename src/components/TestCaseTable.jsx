import { useState, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

const TACTIC_COLORS = {
  'Initial Access': 'text-red-400',
  'Execution': 'text-orange-400',
  'Persistence': 'text-yellow-400',
  'Privilege Escalation': 'text-amber-400',
  'Defense Evasion': 'text-lime-400',
  'Credential Access': 'text-emerald-400',
  'Discovery': 'text-teal-400',
  'Lateral Movement': 'text-cyan-400',
  'Collection': 'text-sky-400',
  'Command and Control': 'text-blue-400',
  'Exfiltration': 'text-violet-400',
  'Impact': 'text-fuchsia-400',
}

const ROW_HEIGHT_PARENT = 53
const ROW_HEIGHT_CHILD = 45

function baseId(id) { return id?.split('.')[0] ?? id }
function isSubtechnique(id) { return id?.includes('.') }

function groupCases(cases) {
  const parentMap = new Map()
  for (const tc of cases) {
    const pid = baseId(tc.id)
    if (!parentMap.has(pid)) parentMap.set(pid, { parentId: pid, parent: null, children: [] })
    const group = parentMap.get(pid)
    if (isSubtechnique(tc.id)) group.children.push(tc)
    else group.parent = tc
  }
  return Array.from(parentMap.values())
}

// Build a flat array of row descriptors for the virtualiser
function buildRows(groups, expanded) {
  const rows = []
  for (const { parentId, parent, children } of groups) {
    const hasChildren = children.length > 0
    const displayTc = parent ?? children[0]
    rows.push({ type: 'parent', tc: displayTc, parentId, hasChildren, childCount: children.length, height: ROW_HEIGHT_PARENT })
    if (hasChildren && expanded.has(parentId)) {
      for (const child of children) {
        rows.push({ type: 'child', tc: child, parentId, height: ROW_HEIGHT_CHILD })
      }
    }
  }
  return rows
}

export default function TestCaseTable({ cases, selectedId, onSelect, showTactic, scrollRef }) {
  const [sortKey, setSortKey] = useState('id')
  const [sortDir, setSortDir] = useState('asc')
  const [expanded, setExpanded] = useState(new Set())

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function toggleExpand(pid, e) {
    e.stopPropagation()
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(pid) ? next.delete(pid) : next.add(pid)
      return next
    })
  }

  const flatRows = useMemo(() => {
    const sorted = [...cases].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return buildRows(groupCases(sorted), expanded)
  }, [cases, sortKey, sortDir, expanded])

  const virtualiser = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => flatRows[i]?.height ?? ROW_HEIGHT_PARENT,
    overscan: 10,
  })

  const virtualItems = virtualiser.getVirtualItems()
  const totalSize = virtualiser.getTotalSize()

  function SortIcon({ col }) {
    if (sortKey !== col) return <span className="text-slate-600 ml-1">↕</span>
    return <span className="text-purple-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  if (cases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No test cases match your search.
      </div>
    )
  }

  // Padding rows to fill virtual space above and below rendered items
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
  const paddingBottom = virtualItems.length > 0
    ? totalSize - virtualItems[virtualItems.length - 1].end
    : 0

  return (
    <table className="w-full text-sm border-collapse">
      <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700">
        <tr>
          <th onClick={() => toggleSort('id')} className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider cursor-pointer hover:text-purple-400 whitespace-nowrap w-44">
            ID <SortIcon col="id" />
          </th>
          <th onClick={() => toggleSort('name')} className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider cursor-pointer hover:text-purple-400">
            Technique <SortIcon col="name" />
          </th>
          {showTactic && (
            <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider whitespace-nowrap w-40">Tactic</th>
          )}
          <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider w-52">Tools</th>
        </tr>
      </thead>
      <tbody>
        {paddingTop > 0 && <tr><td style={{ height: paddingTop }} colSpan={showTactic ? 4 : 3} /></tr>}

        {virtualItems.map((vItem) => {
          const row = flatRows[vItem.index]
          const { type, tc, parentId, hasChildren, childCount } = row
          const rowKey = tc.id + tc.tactic
          const isSelected = selectedId === rowKey

          if (type === 'parent') {
            return (
              <tr
                key={rowKey}
                data-index={vItem.index}
                ref={virtualiser.measureElement}
                onClick={() => onSelect(tc)}
                className={`border-b border-slate-800 cursor-pointer transition-colors ${isSelected ? 'bg-purple-900/40 border-purple-700' : 'hover:bg-slate-800/60'}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {hasChildren ? (
                      <button
                        onClick={(e) => toggleExpand(parentId, e)}
                        className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-purple-400 transition-colors shrink-0"
                        title={`${childCount} sub-technique${childCount > 1 ? 's' : ''}`}
                      >
                        {expanded.has(parentId) ? '▼' : '▶'}
                      </button>
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span className="bg-slate-800 text-purple-300 text-xs font-mono px-2 py-0.5 rounded border border-slate-700">{tc.id}</span>
                    {hasChildren && (
                      <span className="text-slate-600 text-xs" title={`${childCount} sub-technique${childCount > 1 ? 's' : ''}`}>+{childCount}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-100">{tc.name}</span>
                  {tc.notes && <span className="ml-2 text-amber-500 text-xs" title="Has notes">●</span>}
                </td>
                {showTactic && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs ${TACTIC_COLORS[tc.tactic] ?? 'text-slate-400'}`}>{tc.tactic}</span>
                  </td>
                )}
                <td className="px-4 py-3 text-slate-400 text-xs max-w-xs">
                  <span className="line-clamp-2">{tc.tools ?? '—'}</span>
                </td>
              </tr>
            )
          }

          // type === 'child'
          const childSelected = isSelected
          return (
            <tr
              key={rowKey}
              data-index={vItem.index}
              ref={virtualiser.measureElement}
              onClick={() => onSelect(tc)}
              className={`border-b border-slate-800/60 cursor-pointer transition-colors ${childSelected ? 'bg-purple-900/40 border-purple-700' : 'hover:bg-slate-800/40'}`}
            >
              <td className="pl-10 pr-4 py-2.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 text-xs mr-1">↳</span>
                  <span className="bg-slate-800/60 text-purple-300/80 text-xs font-mono px-2 py-0.5 rounded border border-slate-700/60">{tc.id}</span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <span className="text-slate-300 text-sm">{tc.name}</span>
                {tc.notes && <span className="ml-2 text-amber-500 text-xs" title="Has notes">●</span>}
              </td>
              {showTactic && (
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className={`text-xs ${TACTIC_COLORS[tc.tactic] ?? 'text-slate-400'}`}>{tc.tactic}</span>
                </td>
              )}
              <td className="px-4 py-2.5 text-slate-500 text-xs max-w-xs">
                <span className="line-clamp-2">{tc.tools ?? '—'}</span>
              </td>
            </tr>
          )
        })}

        {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} colSpan={showTactic ? 4 : 3} /></tr>}
      </tbody>
    </table>
  )
}
