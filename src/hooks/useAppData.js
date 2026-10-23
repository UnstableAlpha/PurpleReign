import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'purplereign-data'
const SCHEMA_VERSION = 1

async function loadDefaultData() {
  const mod = await import('../data/purplereign.json')
  return mod.default
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.schemaVersion !== SCHEMA_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function writeStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to persist to localStorage:', e)
  }
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function flattenTestCases(tactics) {
  return tactics.flatMap((t) =>
    t.testCases.map((tc) => ({
      tactic: t.name,
      id: tc.id,
      name: tc.name,
      description: tc.description ?? '',
      tools: tc.tools ?? '',
      steps: tc.steps ?? '',
      expectedDetection: tc.expectedDetection ?? '',
      logSource: tc.logSource ?? '',
      notes: tc.notes ?? '',
    }))
  )
}

async function exportAsXlsx(appData) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  for (const tactic of appData.tactics) {
    const rows = tactic.testCases.map((tc) => ({
      ID: tc.id,
      Name: tc.name,
      Description: tc.description ?? '',
      Tools: tc.tools ?? '',
      Steps: tc.steps ?? '',
      'Expected Detection': tc.expectedDetection ?? '',
      'Log Source': tc.logSource ?? '',
      Notes: tc.notes ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    // Truncate tactic name to Excel's 31-char sheet name limit
    XLSX.utils.book_append_sheet(wb, ws, tactic.name.slice(0, 31))
  }

  const detRows = appData.detectionReference.map((d) => ({
    ID: d.id,
    Name: d.name ?? '',
    Tactics: d.tactics ?? '',
    'Detection Logic': d.detectionLogic ?? '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detRows), 'Detection Reference')

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Uint8Array(buf)
}

export function useAppData() {
  const [appData, setAppData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = readStorage()
    if (stored) {
      setAppData(stored)
      setLoading(false)
      return
    }
    loadDefaultData().then((defaultData) => {
      const initial = {
        schemaVersion: SCHEMA_VERSION,
        exportedAt: null,
        tactics: defaultData.tactics,
        detectionReference: defaultData.detectionReference,
      }
      writeStorage(initial)
      setAppData(initial)
      setLoading(false)
    })
  }, [])

  const persist = useCallback((updater) => {
    setAppData((prev) => {
      const next = updater(prev)
      writeStorage(next)
      return next
    })
  }, [])

  const saveEdit = useCallback((tcId, field, value) => {
    persist((prev) => ({
      ...prev,
      tactics: prev.tactics.map((tactic) => ({
        ...tactic,
        testCases: tactic.testCases.map((tc) =>
          tc.id === tcId ? { ...tc, [field]: value } : tc
        ),
      })),
    }))
  }, [persist])

  const importTestCases = useCallback((rows) => {
    persist((prev) => {
      const tacticMap = new Map(prev.tactics.map((t) => [t.name, t]))

      for (const row of rows) {
        const { tactic: tacticName, ...tc } = row
        if (!tacticMap.has(tacticName)) {
          tacticMap.set(tacticName, { name: tacticName, testCases: [] })
        }
        const tactic = tacticMap.get(tacticName)
        const existingIdx = tactic.testCases.findIndex((t) => t.id === tc.id)
        if (existingIdx >= 0) {
          tactic.testCases[existingIdx] = { ...tactic.testCases[existingIdx], ...tc }
        } else {
          tactic.testCases.push(tc)
        }
      }

      // Preserve original tactic order, append new tactics at end
      const knownNames = new Set(prev.tactics.map((t) => t.name))
      const updatedTactics = prev.tactics.map((t) => tacticMap.get(t.name) ?? t)
      for (const [name, tactic] of tacticMap) {
        if (!knownNames.has(name)) updatedTactics.push(tactic)
      }

      return { ...prev, tactics: updatedTactics }
    })
  }, [persist])

  const importDetectionRefs = useCallback((rows) => {
    persist((prev) => {
      const refMap = new Map(prev.detectionReference.map((r) => [r.id, r]))
      for (const row of rows) {
        refMap.set(row.id, { ...(refMap.get(row.id) ?? {}), ...row })
      }
      return { ...prev, detectionReference: Array.from(refMap.values()) }
    })
  }, [persist])

  const exportData = useCallback(async (format = 'json') => {
    if (!appData) return

    if (format === 'json') {
      const exportable = { tactics: appData.tactics, detectionReference: appData.detectionReference }
      triggerDownload(JSON.stringify(exportable, null, 2), 'purplereign.json', 'application/json')
    } else if (format === 'csv') {
      const Papa = await import('papaparse')
      const rows = flattenTestCases(appData.tactics)
      const csv = Papa.unparse(rows)
      triggerDownload(csv, 'purplereign_test_cases.csv', 'text/csv')
    } else if (format === 'xlsx') {
      const bytes = await exportAsXlsx(appData)
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'purplereign.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    }

    persist((prev) => ({ ...prev, exportedAt: new Date().toISOString() }))
  }, [appData, persist])

  const resetToDefault = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY)
    const defaultData = await loadDefaultData()
    const initial = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: null,
      tactics: defaultData.tactics,
      detectionReference: defaultData.detectionReference,
    }
    writeStorage(initial)
    setAppData(initial)
  }, [])

  return { appData, loading, saveEdit, importTestCases, importDetectionRefs, exportData, resetToDefault }
}
