import { useState, useMemo, useRef, useEffect } from 'react'
import { useAppData } from './hooks/useAppData.js'
import Sidebar from './components/Sidebar.jsx'
import SearchBar from './components/SearchBar.jsx'
import TestCaseTable from './components/TestCaseTable.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import ImportModal from './components/ImportModal.jsx'

export default function App() {
  const { appData, loading, saveEdit, importTestCases, importDetectionRefs, exportData } = useAppData()
  const [selectedTactic, setSelectedTactic] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCase, setSelectedCase] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)
  const scrollRef = useRef(null)

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!exportOpen) return
    function handleClick(e) {
      if (!exportRef.current?.contains(e.target)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportOpen])

  const detectionMap = useMemo(() => {
    if (!appData) return new Map()
    return new Map(appData.detectionReference.map((d) => [d.id, d]))
  }, [appData])

  const totalCases = useMemo(() => {
    if (!appData) return 0
    return appData.tactics.reduce((n, t) => n + t.testCases.length, 0)
  }, [appData])

  const tacticCounts = useMemo(() => {
    if (!appData) return {}
    return Object.fromEntries(appData.tactics.map((t) => [t.name, t.testCases.length]))
  }, [appData])

  const filteredCases = useMemo(() => {
    if (!appData) return []
    const q = searchQuery.toLowerCase().trim()
    const tactics = selectedTactic
      ? appData.tactics.filter((t) => t.name === selectedTactic)
      : appData.tactics

    const cases = tactics.flatMap((t) =>
      t.testCases.map((tc) => ({ ...tc, tactic: t.name }))
    )

    if (!q) return cases
    return cases.filter((tc) =>
      [tc.id, tc.name, tc.description, tc.tools, tc.steps, tc.expectedDetection, tc.logSource]
        .some((f) => f?.toLowerCase().includes(q))
    )
  }, [appData, selectedTactic, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400 text-sm font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          Loading test cases...
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-mono overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 py-3 bg-slate-900 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-purple-500 font-bold text-xl tracking-widest">PURPLE</span>
          <span className="text-slate-200 font-bold text-xl tracking-widest">REIGN</span>
        </div>
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400 text-xs">
            <span className="text-purple-400 font-semibold">{filteredCases.length}</span>
            <span className="text-slate-500"> / {totalCases}</span>
            <span className="ml-2 text-slate-600">v13</span>
          </span>
          <button
            onClick={() => setImportOpen(true)}
            className="text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded transition-colors"
          >
            Import
          </button>

          {/* Export dropdown */}
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="text-xs text-purple-300 hover:text-purple-200 border border-purple-800 hover:border-purple-600 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
            >
              Export
              <span className={`transition-transform duration-150 ${exportOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                {[
                  { fmt: 'json',  label: 'Export as JSON',  sub: 'Full dataset' },
                  { fmt: 'csv',   label: 'Export as CSV',   sub: 'Test cases flat' },
                  { fmt: 'xlsx',  label: 'Export as XLSX',  sub: 'Multi-sheet workbook' },
                ].map(({ fmt, label, sub }) => (
                  <button
                    key={fmt}
                    onClick={() => { exportData(fmt); setExportOpen(false) }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors group"
                  >
                    <p className="text-xs text-slate-200 group-hover:text-white font-medium">{label}</p>
                    <p className="text-xs text-slate-500 group-hover:text-slate-400">{sub}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tactics={appData.tactics.map((t) => t.name)}
          counts={tacticCounts}
          selected={selectedTactic}
          onSelect={(t) => { setSelectedTactic(t); setSelectedCase(null) }}
          total={totalCases}
        />

        <main ref={scrollRef} className="flex-1 overflow-auto">
          <TestCaseTable
            cases={filteredCases}
            selectedId={selectedCase ? selectedCase.id + selectedCase.tactic : null}
            onSelect={setSelectedCase}
            showTactic={!selectedTactic}
            scrollRef={scrollRef}
          />
        </main>

        {selectedCase && (
          <DetailPanel
            tc={selectedCase}
            detection={detectionMap.get(selectedCase.id)}
            onClose={() => setSelectedCase(null)}
            onSave={(tcId, field, value) => {
              saveEdit(tcId, field, value)
              setSelectedCase((prev) => prev ? { ...prev, [field]: value } : prev)
            }}
          />
        )}
      </div>

      {importOpen && (
        <ImportModal
          existingIds={new Set(filteredCases.map((tc) => tc.id))}
          onImportTestCases={(rows) => { importTestCases(rows); setImportOpen(false) }}
          onImportDetectionRefs={(rows) => { importDetectionRefs(rows); setImportOpen(false) }}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  )
}
