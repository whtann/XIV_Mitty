import React, { useState } from 'react'
import type { Mechanic } from '../../types'
import { usePlanStore } from '../../store/planStore'
import { MechanicMarker } from './MechanicMarker'
import { secondsToPixels, pixelsToSeconds, snapTime } from '../../utils/time'
import { EditMechanicModal } from '../modals/EditMechanicModal'
import { AddMechanicModal } from '../modals/AddMechanicModal'

interface Props {
  duration: number
  pixelsPerSecond: number
}

export function MechanicTrack({ duration, pixelsPerSecond }: Props): React.JSX.Element {
  const mechanics = usePlanStore((s) => s.plan.mechanics)
  const [addingAt, setAddingAt] = useState<number | null>(null)
  const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null)
  const totalWidth = secondsToPixels(duration, pixelsPerSecond)

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>): void {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const t = snapTime(pixelsToSeconds(clickX, pixelsPerSecond), 1)
    const clampedT = Math.max(0, Math.min(t, duration))
    setAddingAt(clampedT)
  }

  return (
    <>
      <div className="flex" style={{ height: 40 }}>
        {/* Label column */}
        <div className="flex-shrink-0 flex items-center px-2 bg-[#12172a] border-r border-b border-[#2d3748] text-xs text-[#94a3b8] font-medium" style={{ width: 160 }}>
          Mechanics
        </div>

        {/* Track area */}
        <div
          className="relative bg-[#0d1117] border-b border-[#2d3748] cursor-crosshair overflow-visible"
          style={{ width: totalWidth, flexShrink: 0, height: 40 }}
          onClick={handleTrackClick}
        >
          {/* Vertical grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: Math.floor(duration / 60) + 1 }, (_, i) => i * 60).map((t) => (
              <div
                key={t}
                className="absolute top-0 h-full w-px bg-[#1e2533]"
                style={{ left: secondsToPixels(t, pixelsPerSecond) }}
              />
            ))}
          </div>

          {mechanics.map((m) => (
            <MechanicMarker
              key={m.id}
              mechanic={m}
              pixelsPerSecond={pixelsPerSecond}
              onEdit={setEditingMechanic}
            />
          ))}
        </div>
      </div>

      {addingAt !== null && (
        <AddMechanicModal
          defaultTimestamp={addingAt}
          onClose={() => setAddingAt(null)}
        />
      )}

      {editingMechanic && (
        <EditMechanicModal
          mechanic={editingMechanic}
          onClose={() => setEditingMechanic(null)}
        />
      )}
    </>
  )
}
