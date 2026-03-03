import React, { useState, useRef, useEffect } from 'react'
import type { ViewMode } from '../../types'
import { usePlanStore } from '../../store/planStore'
import { parseTime, formatTime } from '../../utils/time'

export function TopBar(): React.JSX.Element {
  const plan = usePlanStore((s) => s.plan)
  const ui = usePlanStore((s) => s.ui)
  const setPlanName = usePlanStore((s) => s.setPlanName)
  const setPlanDuration = usePlanStore((s) => s.setPlanDuration)
  const setViewMode = usePlanStore((s) => s.setViewMode)
  const setSelectedJob = usePlanStore((s) => s.setSelectedJob)
  const setFilePath = usePlanStore((s) => s.setFilePath)
  const markClean = usePlanStore((s) => s.markClean)
  const newPlan = usePlanStore((s) => s.newPlan)
  const loadPlan = usePlanStore((s) => s.loadPlan)
  const toJSON = usePlanStore((s) => s.toJSON)

  const [durationInput, setDurationInput] = useState(formatTime(plan.duration))
  const [showFileMenu, setShowFileMenu] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement>(null)

  // Sync duration input when plan changes externally (e.g., on load)
  useEffect(() => {
    setDurationInput(formatTime(plan.duration))
  }, [plan.duration])

  // Close file menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setShowFileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleDurationBlur(): void {
    const secs = parseTime(durationInput)
    if (!isNaN(secs) && secs > 0) {
      setPlanDuration(secs)
      setDurationInput(formatTime(secs))
    } else {
      setDurationInput(formatTime(plan.duration))
    }
  }

  async function handleNew(): Promise<void> {
    if (ui.isDirty) {
      const ok = window.confirm('You have unsaved changes. Start a new plan anyway?')
      if (!ok) return
    }
    newPlan()
    setShowFileMenu(false)
  }

  async function handleOpen(): Promise<void> {
    const result = await window.api.file.open()
    if (!result) return
    try {
      loadPlan(result.content, result.filePath)
    } catch {
      alert('Failed to load plan: invalid file format.')
    }
    setShowFileMenu(false)
  }

  async function handleSave(): Promise<void> {
    const json = toJSON()
    const savedPath = await window.api.file.save(ui.currentFilePath, json)
    if (savedPath) {
      setFilePath(savedPath)
      markClean()
    }
    setShowFileMenu(false)
  }

  async function handleSaveAs(): Promise<void> {
    const json = toJSON()
    const savedPath = await window.api.file.saveAs(json)
    if (savedPath) {
      setFilePath(savedPath)
      markClean()
    }
    setShowFileMenu(false)
  }

  const VIEW_MODES: { value: ViewMode; label: string }[] = [
    { value: 'all', label: 'All Tracks' },
    { value: 'single', label: 'Single Job' },
    { value: 'shared', label: 'Shared Track' }
  ]

  return (
    <div className="h-10 bg-[#0d1117] border-b border-[#2d3748] flex items-center gap-3 px-3 flex-shrink-0 z-30">
      {/* File menu */}
      <div className="relative" ref={fileMenuRef}>
        <button
          className="text-xs text-[#94a3b8] hover:text-[#e2e8f0] px-2 py-1 rounded hover:bg-[#1e2533] border border-transparent hover:border-[#3d4a5c]"
          onClick={() => setShowFileMenu((v) => !v)}
        >
          File {ui.isDirty && <span className="text-yellow-400">●</span>}
        </button>
        {showFileMenu && (
          <div className="absolute top-full left-0 mt-1 bg-[#1e2533] border border-[#3d4a5c] rounded shadow-xl z-50 py-1 min-w-[140px]">
            <MenuItem onClick={handleNew}>New Plan</MenuItem>
            <MenuItem onClick={handleOpen}>Open…</MenuItem>
            <div className="border-t border-[#3d4a5c] my-1" />
            <MenuItem onClick={handleSave}>
              Save{ui.currentFilePath ? '' : '…'}
            </MenuItem>
            <MenuItem onClick={handleSaveAs}>Save As…</MenuItem>
          </div>
        )}
      </div>

      {/* Fight name */}
      <input
        className="bg-transparent text-sm font-semibold text-[#e2e8f0] border-b border-transparent hover:border-[#4a5568] focus:border-[#64748b] outline-none px-1 py-0.5 w-48"
        value={plan.name}
        onChange={(e) => setPlanName(e.target.value)}
        placeholder="Fight name..."
      />

      <div className="text-[#2d3748]">|</div>

      {/* Duration */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#64748b]">Duration:</span>
        <input
          className="bg-[#1e2533] text-xs text-[#e2e8f0] border border-[#3d4a5c] rounded px-2 py-0.5 w-16 text-center outline-none focus:border-[#64748b]"
          value={durationInput}
          onChange={(e) => setDurationInput(e.target.value)}
          onBlur={handleDurationBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
        />
      </div>

      <div className="text-[#2d3748]">|</div>

      {/* View mode */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#64748b]">View:</span>
        <select
          className="bg-[#1e2533] text-xs text-[#e2e8f0] border border-[#3d4a5c] rounded px-2 py-0.5 outline-none focus:border-[#64748b]"
          value={ui.viewMode}
          onChange={(e) => {
            const mode = e.target.value as ViewMode
            setViewMode(mode)
            if (mode === 'single' && !ui.selectedJobId && plan.jobs.length > 0) {
              setSelectedJob(plan.jobs[0].id)
            }
          }}
        >
          {VIEW_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {ui.viewMode === 'single' && (
          <select
            className="bg-[#1e2533] text-xs text-[#e2e8f0] border border-[#3d4a5c] rounded px-2 py-0.5 outline-none focus:border-[#64748b]"
            value={ui.selectedJobId ?? ''}
            onChange={(e) => setSelectedJob(e.target.value || null)}
          >
            {plan.jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex-1" />

      {/* Zoom indicator */}
      <div className="text-[10px] text-[#4a5568]">
        Zoom: {ui.pixelsPerSecond.toFixed(1)}px/s · Ctrl+Scroll to zoom
      </div>
    </div>
  )
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }): React.JSX.Element {
  return (
    <button
      className="w-full text-left px-3 py-1.5 text-xs text-[#e2e8f0] hover:bg-[#2d3748]"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
