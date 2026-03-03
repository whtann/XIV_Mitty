import React, { useState, useEffect } from 'react'
import type { JobDefinition, JobRole } from '../../types'
import { useConfigStore } from '../../store/configStore'
import { ModalOverlay, Field } from './AddMechanicModal'
import { nextColor } from '../../utils/colorUtils'

const ROLE_COLORS: Record<JobRole, string> = {
  tank: '#4d7fcf',
  healer: '#2fbe78',
  dps: '#c24d4d',
  other: '#8b8b8b'
}

interface Props {
  onClose: () => void
}

const ROLES: { value: JobRole; label: string }[] = [
  { value: 'tank', label: 'Tank' },
  { value: 'healer', label: 'Healer' },
  { value: 'dps', label: 'DPS' },
  { value: 'other', label: 'Other' }
]

type Mode = 'list' | 'add' | 'edit'

export function ManageJobsModal({ onClose }: Props): React.JSX.Element {
  const jobs = useConfigStore((s) => s.jobs)
  const addJob = useConfigStore((s) => s.addJob)
  const updateJob = useConfigStore((s) => s.updateJob)
  const removeJob = useConfigStore((s) => s.removeJob)

  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<JobDefinition | null>(null)

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#e2e8f0]">
          {mode === 'list' ? 'Manage Jobs' : mode === 'add' ? 'Add Job' : 'Edit Job'}
        </h2>
        {mode !== 'list' && (
          <button className="text-xs text-[#64748b] hover:text-[#94a3b8]" onClick={() => setMode('list')}>
            ← Back
          </button>
        )}
      </div>

      {mode === 'list' && (
        <>
          <div className="space-y-1 mb-3 max-h-56 overflow-y-auto">
            {jobs.length === 0 && (
              <p className="text-xs text-[#4a5568] italic">No jobs yet.</p>
            )}
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2d3748] cursor-pointer group"
                onClick={() => { setEditing(job); setMode('edit') }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: job.color }} />
                <span className="text-xs text-[#e2e8f0] flex-1 truncate">{job.name}</span>
                <span className="text-[10px] text-[#64748b] capitalize">{job.role}</span>
                <button
                  className="text-[10px] text-[#4a5568] hover:text-red-400 opacity-0 group-hover:opacity-100 px-1"
                  onClick={(e) => { e.stopPropagation(); removeJob(job.id) }}
                  title="Delete job"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <button className="btn-primary text-xs" onClick={() => { setEditing(null); setMode('add') }}>
              + Add Job
            </button>
            <button className="btn-secondary text-xs" onClick={onClose}>Close</button>
          </div>
        </>
      )}

      {(mode === 'add' || mode === 'edit') && (
        <JobForm
          initial={editing}
          usedColors={jobs.map((j) => j.color)}
          onSave={(partial) => {
            if (mode === 'add') {
              addJob(partial)
            } else if (editing) {
              updateJob(editing.id, partial)
            }
            setMode('list')
          }}
          onCancel={() => setMode('list')}
        />
      )}
    </ModalOverlay>
  )
}

interface JobFormProps {
  initial: JobDefinition | null
  usedColors: string[]
  onSave: (partial: Omit<JobDefinition, 'id'>) => void
  onCancel: () => void
}

async function pickIcon(): Promise<string | null> {
  return window.api.image.pick()
}

function JobForm({ initial, usedColors, onSave, onCancel }: JobFormProps): React.JSX.Element {
  const [name, setName] = useState(initial?.name ?? '')
  const [role, setRole] = useState<JobRole>(initial?.role ?? 'healer')
  const [color, setColor] = useState(initial?.color ?? ROLE_COLORS[initial?.role ?? 'healer'])
  const [iconDataUrl, setIconDataUrl] = useState<string | undefined>(initial?.iconDataUrl)
  const [error, setError] = useState('')

  // Auto-update color when role changes on new jobs
  useEffect(() => {
    if (!initial) setColor(ROLE_COLORS[role])
  }, [role, initial])

  async function handlePickIcon(): Promise<void> {
    const result = await pickIcon()
    if (result) setIconDataUrl(result)
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    onSave({ name: name.trim(), role, color, iconDataUrl })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Job name *">
        <input
          autoFocus
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. H1 (WHM), MT (WAR)"
        />
      </Field>
      <Field label="Role">
        <select className="input" value={role} onChange={(e) => setRole(e.target.value as JobRole)}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Color">
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <div className="flex gap-1">
            {[ROLE_COLORS.tank, ROLE_COLORS.healer, ROLE_COLORS.dps].map((c) => (
              <button
                key={c}
                type="button"
                className="w-4 h-4 rounded-full border-2"
                style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent' }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
      </Field>
      <Field label="Icon (optional)">
        <div className="flex items-center gap-2">
          {iconDataUrl && (
            <img src={iconDataUrl} alt="icon" className="w-8 h-8 rounded object-cover flex-shrink-0" />
          )}
          <button type="button" className="btn-secondary text-xs" onClick={handlePickIcon}>
            {iconDataUrl ? 'Change' : 'Upload'}
          </button>
          {iconDataUrl && (
            <button
              type="button"
              className="text-xs text-[#4a5568] hover:text-red-400"
              onClick={() => setIconDataUrl(undefined)}
            >
              ✕
            </button>
          )}
        </div>
      </Field>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  )
}
