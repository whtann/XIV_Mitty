import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { MECHANIC_COLORS, MECHANIC_LABELS } from '../../types'
import type { MechanicType } from '../../types'
import { usePlanStore } from '../../store/planStore'
import { formatTime, parseTime } from '../../utils/time'

interface Props {
  defaultTimestamp: number
  onClose: () => void
}

const MECHANIC_TYPES: MechanicType[] = [
  'tankBuster', 'raidWide', 'enrage', 'phaseChange', 'mechanic', 'custom'
]

export function AddMechanicModal({ defaultTimestamp, onClose }: Props): React.JSX.Element {
  const addMechanic = usePlanStore((s) => s.addMechanic)

  const [name, setName] = useState('')
  const [timestamp, setTimestamp] = useState(formatTime(defaultTimestamp))
  const [type, setType] = useState<MechanicType>('mechanic')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [customColor, setCustomColor] = useState('#6b7280')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    const ts = parseTime(timestamp)
    if (isNaN(ts)) { setError('Invalid timestamp (use MM:SS)'); return }

    const dur = duration ? parseFloat(duration) : undefined

    addMechanic({
      name: name.trim(),
      timestamp: ts,
      type,
      duration: dur && !isNaN(dur) ? dur : undefined,
      description: description.trim() || undefined,
      customColor: type === 'custom' ? customColor : undefined
    })
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-sm font-semibold text-[#e2e8f0] mb-3">Add Mechanic</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Name *">
          <input
            autoFocus
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Exaflare, Tank Buster..."
          />
        </Field>

        <Field label="Timestamp (MM:SS) *">
          <input
            className="input"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            placeholder="2:30"
          />
        </Field>

        <Field label="Type">
          <select className="input" value={type} onChange={(e) => setType(e.target.value as MechanicType)}>
            {MECHANIC_TYPES.map((t) => (
              <option key={t} value={t}>{MECHANIC_LABELS[t]}</option>
            ))}
          </select>
        </Field>

        {type === 'custom' && (
          <Field label="Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
              />
              <span className="text-xs text-[#94a3b8]">{customColor}</span>
            </div>
          </Field>
        )}

        <Field label="Cast duration (s, optional)">
          <input
            className="input"
            type="number"
            min="0"
            step="0.1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 2.5"
          />
        </Field>

        <Field label="Description (optional)">
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes..."
          />
        </Field>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add</button>
        </div>
      </form>
    </ModalOverlay>
  )
}

// ── Shared helpers ──────────────────────────────────────────────────────────

export function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }): React.JSX.Element {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1e2533] border border-[#3d4a5c] rounded-lg p-4 w-80 shadow-2xl text-[#e2e8f0]">
        {children}
      </div>
    </div>,
    document.body
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <label className="block text-xs text-[#94a3b8] mb-1">{label}</label>
      {children}
    </div>
  )
}
