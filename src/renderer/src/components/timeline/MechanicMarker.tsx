import React, { useRef, useState } from 'react'
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
  const updateMechanic = usePlanStore((s) => s.updateMechanic)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipBelow, setTooltipBelow] = useState(false)
  const [liveDuration, setLiveDuration] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const resizeStartX = useRef(0)
  const resizeStartDuration = useRef(0)

  const color =
    mechanic.type === 'custom' && mechanic.customColor
      ? mechanic.customColor
      : MECHANIC_COLORS[mechanic.type]

  const x = secondsToPixels(mechanic.timestamp, pixelsPerSecond)
  const displayDuration = liveDuration ?? mechanic.duration ?? 0
  const durationWidth = secondsToPixels(displayDuration, pixelsPerSecond)
  const hitWidth = Math.max(2, durationWidth)

  function handleResizeMouseDown(e: React.MouseEvent): void {
    e.stopPropagation()
    e.preventDefault()
    isResizing.current = true
    resizeStartX.current = e.clientX
    resizeStartDuration.current = mechanic.duration ?? 0
    setShowTooltip(false)

    function onMouseMove(me: MouseEvent): void {
      if (!isResizing.current) return
      const delta = me.clientX - resizeStartX.current
      const newDuration = Math.max(1, Math.round(resizeStartDuration.current + delta / pixelsPerSecond))
      setLiveDuration(newDuration)
    }

    function onMouseUp(me: MouseEvent): void {
      if (!isResizing.current) return
      isResizing.current = false
      const delta = me.clientX - resizeStartX.current
      const newDuration = Math.max(1, Math.round(resizeStartDuration.current + delta / pixelsPerSecond))
      updateMechanic(mechanic.id, { duration: newDuration })
      setLiveDuration(null)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-0 h-full cursor-pointer"
      style={{ left: x, width: hitWidth }}
      onMouseEnter={() => {
        if (isResizing.current) return
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          setTooltipBelow(rect.top < 120)
        }
        setShowTooltip(true)
      }}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => { e.stopPropagation(); onEdit(mechanic) }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        removeMechanic(mechanic.id)
      }}
    >
      {/* Solid colored block spanning full hit width */}
      <div
        className="absolute inset-0 flex items-center overflow-hidden rounded-r select-none"
        style={{ backgroundColor: color }}
      >
        {/* Bright left-edge accent to mark the cast point */}
        <div className="absolute left-0 top-0 h-full w-0.5 bg-white/40" />
        {hitWidth > 40 && (
          <span className="text-[10px] font-semibold text-white whitespace-nowrap overflow-hidden px-2">
            {mechanic.name}
          </span>
        )}
      </div>

      {/* Resize handle on right edge */}
      <div
        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize z-10 hover:bg-white/20 rounded-r"
        onMouseDown={handleResizeMouseDown}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Floating label above for narrow (no-duration) mechanics */}
      {hitWidth <= 40 && (
        <div
          className="absolute bottom-full mb-0.5 text-[10px] font-medium whitespace-nowrap pointer-events-none"
          style={{ color, transform: 'translateX(-50%)', left: 0 }}
        >
          {mechanic.name}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-50 bg-[#1e2533] border border-[#3d4a5c] rounded p-2 text-xs text-[#e2e8f0] whitespace-nowrap shadow-lg pointer-events-none"
          style={tooltipBelow
            ? { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 }
            : { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 }
          }
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
