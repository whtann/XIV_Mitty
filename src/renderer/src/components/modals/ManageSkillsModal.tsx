import React, { useState } from 'react'
import type { JobDefinition, SkillDefinition } from '../../types'
import { useConfigStore } from '../../store/configStore'
import { ModalOverlay, Field } from './AddMechanicModal'
import { nextColor } from '../../utils/colorUtils'

interface Props {
  job: JobDefinition
  onClose: () => void
}

type Mode = 'list' | 'add' | 'edit'

export function ManageSkillsModal({ job, onClose }: Props): React.JSX.Element {
  const allSkills = useConfigStore((s) => s.skills)
  const skills = allSkills.filter((sk) => sk.jobId === job.id)
  const addSkill = useConfigStore((s) => s.addSkill)
  const updateSkill = useConfigStore((s) => s.updateSkill)
  const removeSkill = useConfigStore((s) => s.removeSkill)

  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<SkillDefinition | null>(null)

  function startEdit(sk: SkillDefinition): void {
    setEditing(sk)
    setMode('edit')
  }

  function startAdd(): void {
    setEditing(null)
    setMode('add')
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#e2e8f0]">
          {mode === 'list' ? `Skills — ${job.name}` : mode === 'add' ? 'Add Skill' : 'Edit Skill'}
        </h2>
        {mode !== 'list' && (
          <button className="text-xs text-[#64748b] hover:text-[#94a3b8]" onClick={() => setMode('list')}>
            ← Back
          </button>
        )}
      </div>

      {mode === 'list' && (
        <>
          {skills.length === 0 && (
            <p className="text-xs text-[#4a5568] italic mb-3">No skills for this job yet.</p>
          )}
          <div className="space-y-1 mb-3 max-h-56 overflow-y-auto">
            {skills.map((sk) => (
              <div
                key={sk.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2d3748] cursor-pointer group"
                onClick={() => startEdit(sk)}
              >
                <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: sk.color }} />
                <span className="text-xs text-[#e2e8f0] flex-1 truncate">{sk.name}</span>
                <span className="text-[10px] text-[#64748b]">
                  {sk.effectiveDuration}s / {sk.cooldown}s
                </span>
                <button
                  className="text-[10px] text-[#4a5568] hover:text-red-400 opacity-0 group-hover:opacity-100 px-1"
                  onClick={(e) => { e.stopPropagation(); removeSkill(sk.id) }}
                  title="Delete skill"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <button className="btn-primary text-xs" onClick={startAdd}>+ Add Skill</button>
            <button className="btn-secondary text-xs" onClick={onClose}>Close</button>
          </div>
        </>
      )}

      {(mode === 'add' || mode === 'edit') && (
        <SkillForm
          jobId={job.id}
          initial={editing}
          usedColors={skills.map((s) => s.color)}
          onSave={(partial) => {
            if (mode === 'add') {
              addSkill({ ...partial, jobId: job.id })
            } else if (editing) {
              updateSkill(editing.id, partial)
            }
            setMode('list')
          }}
          onCancel={() => setMode('list')}
        />
      )}
    </ModalOverlay>
  )
}

interface SkillFormProps {
  jobId: string
  initial: SkillDefinition | null
  usedColors: string[]
  onSave: (partial: Omit<SkillDefinition, 'id' | 'jobId'>) => void
  onCancel: () => void
}

function SkillForm({ initial, usedColors, onSave, onCancel }: SkillFormProps): React.JSX.Element {
  const [name, setName] = useState(initial?.name ?? '')
  const [effectiveDuration, setEffectiveDuration] = useState(String(initial?.effectiveDuration ?? ''))
  const [cooldown, setCooldown] = useState(String(initial?.cooldown ?? ''))
  const [color, setColor] = useState(initial?.color ?? nextColor(usedColors))
  const [iconDataUrl, setIconDataUrl] = useState<string | undefined>(initial?.iconDataUrl)
  const [error, setError] = useState('')

  async function handlePickIcon(): Promise<void> {
    const result = await window.api.image.pick()
    if (result) setIconDataUrl(result)
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    const eff = parseFloat(effectiveDuration)
    const cd = parseFloat(cooldown)
    if (isNaN(eff) || eff <= 0) { setError('Effective duration must be > 0'); return }
    if (isNaN(cd) || cd <= 0) { setError('Cooldown must be > 0'); return }
    if (cd < eff) { setError('Cooldown must be ≥ effective duration'); return }
    onSave({ name: name.trim(), effectiveDuration: eff, cooldown: cd, color, iconDataUrl })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Skill name *">
        <input autoFocus className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Temperance" />
      </Field>
      <Field label="Effect duration (s) *">
        <input className="input" type="number" min="1" step="0.5" value={effectiveDuration} onChange={(e) => setEffectiveDuration(e.target.value)} placeholder="20" />
      </Field>
      <Field label="Full cooldown (s) *">
        <input className="input" type="number" min="1" step="1" value={cooldown} onChange={(e) => setCooldown(e.target.value)} placeholder="120" />
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
            {['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#f97316','#06b6d4'].map((c) => (
              <button
                key={c}
                type="button"
                className="w-4 h-4 rounded-full border-2 border-transparent hover:border-white"
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
