import { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'

const TC_REQUIRED = ['tactic', 'id', 'name']
const DET_REQUIRED = ['id', 'detectionLogic']

const TC_COLUMNS = ['tactic', 'id', 'name', 'description', 'tools', 'steps', 'expectedDetection', 'logSource', 'notes']
const DET_COLUMNS = ['id', 'name', 'tactics', 'detectionLogic']

function parseCSV(text, required) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    comments: '#',
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim() || null,
  })
  const rows = result.data
  const invalid = rows.filter((r) => required.some((k) => !r[k]))
  const valid = rows.filter((r) => required.every((k) => r[k]))
  return { valid, invalid, errors: result.errors }
}

function parseJSON(text, required) {
  try {
    let data = JSON.parse(text)
    // Accept either array or { tactics: [...] } shape (full export)
    if (data?.tactics) {
      data = data.tactics.flatMap((t) =>
        t.testCases.map((tc) => ({ ...tc, tactic: t.name }))
      )
    }
    if (data?.detectionReference) {
      data = data.detectionReference
    }
    if (!Array.isArray(data)) return { valid: [], invalid: [], errors: ['Root must be an array'] }
    const valid = data.filter((r) => required.every((k) => r[k]))
    const invalid = data.filter((r) => required.some((k) => !r[k]))
    return { valid, invalid, errors: [] }
  } catch (e) {
    return { valid: [], invalid: [], errors: [e.message] }
  }
}

function DropZone({ onFile, accept }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  function handleChange(e) {
    const file = e.target.files[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors ${
        dragging
          ? 'border-purple-500 bg-purple-900/20'
          : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'
      }`}
    >
      <p className="text-slate-300 text-sm">
        Drag & drop a file here, or <span className="text-purple-400 underline">browse</span>
      </p>
      <p className="text-slate-500 text-xs mt-1">Accepted: {accept}</p>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  )
}

function PreviewTable({ rows, columns }) {
  const preview = rows.slice(0, 5)
  return (
    <div className="overflow-x-auto rounded border border-slate-700 text-xs">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-800">
            {columns.map((col) => (
              <th key={col} className="text-left px-3 py-2 text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap border-b border-slate-700">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((row, i) => (
            <tr key={i} className="border-b border-slate-800/60">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 text-slate-300 max-w-[180px] truncate" title={row[col] ?? ''}>
                  {row[col] ?? <span className="text-slate-600 italic">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 5 && (
        <p className="px-3 py-2 text-slate-500 text-xs">…and {rows.length - 5} more</p>
      )}
    </div>
  )
}

function ImportTab({ type, required, columns, existingIds, onConfirm }) {
  const [parsed, setParsed] = useState(null)
  const [fileError, setFileError] = useState(null)

  const handleFile = useCallback((file) => {
    setFileError(null)
    setParsed(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const ext = file.name.split('.').pop().toLowerCase()
      const result = ext === 'json' ? parseJSON(text, required) : parseCSV(text, required)
      if (result.errors.length > 0 && result.valid.length === 0) {
        setFileError(result.errors[0]?.toString() ?? 'Parse error')
      } else {
        setParsed(result)
      }
    }
    reader.readAsText(file)
  }, [required])

  const duplicates = parsed
    ? parsed.valid.filter((r) => existingIds.has(r.id)).map((r) => r.id)
    : []

  const accept = type === 'tc' ? '.csv,.json' : '.csv,.json'

  return (
    <div className="space-y-4">
      <DropZone onFile={handleFile} accept={accept} />

      {fileError && (
        <div className="bg-red-900/30 border border-red-700 rounded px-3 py-2 text-xs text-red-300">
          Parse error: {fileError}
        </div>
      )}

      {parsed && parsed.invalid.length > 0 && (
        <div className="bg-red-900/20 border border-red-800/60 rounded px-3 py-2 text-xs text-red-300">
          <strong>{parsed.invalid.length} row{parsed.invalid.length > 1 ? 's' : ''} skipped</strong> — missing required field{required.length > 1 ? 's' : ''}: <code>{required.join(', ')}</code>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/60 rounded px-3 py-2 text-xs text-amber-300">
          <strong>{duplicates.length} duplicate ID{duplicates.length > 1 ? 's' : ''}</strong> — existing records will be overwritten:{' '}
          <span className="font-mono">{duplicates.slice(0, 6).join(', ')}{duplicates.length > 6 ? ` +${duplicates.length - 6} more` : ''}</span>
        </div>
      )}

      {parsed && parsed.valid.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Preview — <span className="text-slate-200 font-semibold">{parsed.valid.length}</span> valid record{parsed.valid.length > 1 ? 's' : ''}
            </p>
          </div>
          <PreviewTable rows={parsed.valid} columns={columns} />
          <button
            onClick={() => onConfirm(parsed.valid)}
            className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded transition-colors font-semibold"
          >
            Import {parsed.valid.length} record{parsed.valid.length > 1 ? 's' : ''}
          </button>
        </>
      )}

      {parsed && parsed.valid.length === 0 && !fileError && (
        <p className="text-center text-slate-500 text-sm py-4">No valid records found in this file.</p>
      )}
    </div>
  )
}

export default function ImportModal({ existingIds, onImportTestCases, onImportDetectionRefs, onClose }) {
  const [tab, setTab] = useState('tc')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-[640px] max-h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <h2 className="text-slate-100 font-semibold">Import Data</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 shrink-0">
          {[
            { key: 'tc', label: 'Test Cases' },
            { key: 'det', label: 'Detection Reference' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-3 text-sm transition-colors border-b-2 -mb-px ${
                tab === key
                  ? 'text-purple-300 border-purple-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'tc' ? (
            <>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Upload a <strong className="text-slate-300">.csv</strong> or <strong className="text-slate-300">.json</strong> file.
                Required fields: <code className="text-purple-300 bg-slate-800 px-1 rounded">tactic</code>,{' '}
                <code className="text-purple-300 bg-slate-800 px-1 rounded">id</code>,{' '}
                <code className="text-purple-300 bg-slate-800 px-1 rounded">name</code>.
              </p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-slate-500">Download template:</span>
                <a
                  href="/templates/test_case_import.csv"
                  download
                  className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                >
                  test_case_import.csv
                </a>
                <span className="text-slate-700">·</span>
                <a
                  href="/templates/test_case_import.json"
                  download
                  className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                >
                  test_case_import.json
                </a>
              </div>
              <ImportTab
                type="tc"
                required={TC_REQUIRED}
                columns={TC_COLUMNS}
                existingIds={existingIds}
                onConfirm={onImportTestCases}
              />
            </>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Upload a <strong className="text-slate-300">.csv</strong> or <strong className="text-slate-300">.json</strong> file.
                Required fields: <code className="text-purple-300 bg-slate-800 px-1 rounded">id</code>,{' '}
                <code className="text-purple-300 bg-slate-800 px-1 rounded">detectionLogic</code>.
              </p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-slate-500">Download template:</span>
                <a
                  href="/templates/detection_ref_import.csv"
                  download
                  className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                >
                  detection_ref_import.csv
                </a>
                <span className="text-slate-700">·</span>
                <a
                  href="/templates/detection_ref_import.json"
                  download
                  className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                >
                  detection_ref_import.json
                </a>
              </div>
              <ImportTab
                type="det"
                required={DET_REQUIRED}
                columns={DET_COLUMNS}
                existingIds={existingIds}
                onConfirm={onImportDetectionRefs}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
