import React, { useState } from 'react'
import { MECHANIC_LABELS } from '../../types'
import type { Mechanic, MechanicType } from '../../types'
import { usePlanStore } from '../../store/planStore'
import { formatTime, parseTime } from '../../utils/time'
import { ModalOverlay, Field } from './AddMechanicModal'

const MECHANIC_TYPES: MechanicType[] = [
  'tankBuster', 'raidWide', 'enrage', 'phaseChange', 'mechanic', 'custom'
]

interface Props {
  mechanic: Mechanic
  onClose: () => void
}

export function EditMechanicModal({ mechanic, onClose }: Props): React.JSX.Element {
  const updateMechanic = usePlanStore((s) => s.updateMechanic)
  const removeMechanic = usePlanStore((s) => s.removeMechanic)

  const [name, setName] = useState(mechanic.name)
  const [timestamp, setTimestamp] = useState(formatTime(mechanic.timestamp))
  const [type, setType] = useState<MechanicType>(mechanic.type)
  const [duration, setDuration] = useState(mechanic.duration != null ? String(mechanic.duration) : '')
  const [description, setDescription] = useState(mechanic.description ?? '')
  const [customColor, setCustomColor] = useState(mechanic.customColor ?? '#6b7280')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    const ts = parseTime(timestamp)
    if (isNaN(ts)) { setError('Invalid timestamp (use MM:SS)'); return }

    const dur = duration ? parseFloat(duration) : undefined

    updateMechanic(mechanic.id, {
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
      <h2 className="text-sm font-semibold text-[#e2e8f0] mb-3">Edit Mechanic</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Name *">
          <input autoFocus className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Timestamp (MM:SS) *">
          <input className="input" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} />
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
          />
        </Field>

        <Field label="Description (optional)">
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-between pt-1">
          <button
            type="button"
            className="btn-danger"
            onClick={() => { removeMechanic(mechanic.id); onClose() }}
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </div>
      </form>
    </ModalOverlay>
  )
}
