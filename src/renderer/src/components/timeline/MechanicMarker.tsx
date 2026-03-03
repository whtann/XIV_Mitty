import React, { useState } from 'react'
import { MECHANIC_COLORS, MECHANIC_LABELS } from '../../types'
import type { Mechanic } from '../../types'
import { formatTime, secondsToPixels } from '../../utils/time'
import { usePlanStore } from '../../store/planStore'

interface Props {
  mechanic: Mechanic
  pixelsPerSecond: number
  onEdit: (mechanic: Mechanic) => void
}

export function MechanicMarker({ mechanic, pixelsPerSecond, onEdit }: Props): React.JSX.Element {
  const removeMechanic = usePlanStore((s) => s.removeMechanic)
  const [showTooltip, setShowTooltip] = useState(false)

  const color =
    mechanic.type === 'custom' && mechanic.customColor
      ? mechanic.customColor
      : MECHANIC_COLORS[mechanic.type]

  const x = secondsToPixels(mechanic.timestamp, pixelsPerSecond)
  const durationWidth = mechanic.duration
    ? secondsToPixels(mechanic.duration, pixelsPerSecond)
    : 0

  return (
    <div className="absolute top-0 h-full" style={{ left: x }}>
      {/* Optional duration bar behind the pin */}
      {mechanic.duration && mechanic.duration > 0 && (
        <div
          className="absolute top-0 h-full opacity-20 rounded-r"
          style={{ width: durationWidth, backgroundColor: color, left: 0 }}
        />
      )}

      {/* The vertical pin line */}
      <div
        className="absolute w-0.5 h-full cursor-pointer"
        style={{ backgroundColor: color }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => { e.stopPropagation(); onEdit(mechanic) }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          removeMechanic(mechanic.id)
        }}
      />

      {/* Label above the pin */}
      <div
        className="absolute bottom-full mb-0.5 text-[10px] font-medium whitespace-nowrap pointer-events-none"
        style={{ color, transform: 'translateX(-50%)', left: 0 }}
      >
        {mechanic.name}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-50 bg-[#1e2533] border border-[#3d4a5c] rounded p-2 text-xs text-[#e2e8f0] whitespace-nowrap shadow-lg pointer-events-none"
          style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 24 }}
        >
          <div className="font-semibold" style={{ color }}>
            {mechanic.name}
          </div>
          <div className="text-[#94a3b8]">{MECHANIC_LABELS[mechanic.type]}</div>
          <div>{formatTime(mechanic.timestamp)}</div>
          {mechanic.duration && <div>Duration: {mechanic.duration}s</div>}
          {mechanic.description && <div className="mt-1 italic">{mechanic.description}</div>}
          <div className="mt-1 text-[#64748b]">Click to edit · Right-click to delete</div>
        </div>
      )}
    </div>
  )
}
