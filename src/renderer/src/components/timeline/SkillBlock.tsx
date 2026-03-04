import React, { useState, useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { PlacedSkill, SkillDefinition } from '../../types'
import { formatTime, secondsToPixels } from '../../utils/time'
import { usePlanStore } from '../../store/planStore'

const ROW_HEIGHT = 36

interface Props {
  placed: PlacedSkill
  skill: SkillDefinition
  pixelsPerSecond: number
  /** True if this skill overlaps with a previous use that hasn't finished its cooldown */
  isConflict: boolean
  row?: number
  /** Fight duration in seconds — used to clip blocks that would extend past the end */
  trackDuration: number
}

export function SkillBlock({ placed, skill, pixelsPerSecond, isConflict, row = 0, trackDuration }: Props): React.JSX.Element {
  const removePlacedSkill = usePlanStore((s) => s.removePlacedSkill)
  const [showPopover, setShowPopover] = useState(false)
  const [popoverBelow, setPopoverBelow] = useState(false)
  const elemRef = useRef<HTMLDivElement | null>(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: placed.id,
    data: { type: 'placed-skill', placed, skill, displayRow: row }
  })

  // Clip the visual blocks so they never extend past the end of the fight.
  const cappedEffectEnd = Math.min(placed.startTime + skill.effectiveDuration, trackDuration)
  const cappedSkillEnd = Math.min(placed.startTime + skill.cooldown, trackDuration)
  const effectWidth = secondsToPixels(Math.max(0, cappedEffectEnd - placed.startTime), pixelsPerSecond)
  const cooldownWidth = secondsToPixels(Math.max(0, cappedSkillEnd - cappedEffectEnd), pixelsPerSecond)

  const style: React.CSSProperties = {
    position: 'absolute',
    left: secondsToPixels(placed.startTime, pixelsPerSecond),
    top: 4 + row * ROW_HEIGHT,
    height: 28,
    opacity: isDragging ? 0 : 1,
    transform: CSS.Translate.toString(transform),
    zIndex: showPopover ? 100 : isDragging ? 50 : 10,
    cursor: 'grab',
    display: 'flex',
    transition: isDragging ? undefined : 'top 0.12s ease'
  }

  const endTime = placed.startTime + skill.cooldown
  const effectEnd = placed.startTime + skill.effectiveDuration

  // Combine dnd-kit's setNodeRef with our own elemRef
  const setRefs = (el: HTMLDivElement | null): void => {
    setNodeRef(el)
    elemRef.current = el
  }

  return (
    <div
      ref={setRefs}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        if (elemRef.current) {
          const rect = elemRef.current.getBoundingClientRect()
          setPopoverBelow(rect.top < 160)
        }
        setShowPopover((v) => !v)
      }}
    >
      {/* Effect block (blue by default, or the skill's custom color) */}
      <div
        className="flex items-center justify-center text-[10px] font-semibold text-white overflow-hidden whitespace-nowrap px-1 rounded-l select-none"
        style={{
          width: effectWidth,
          backgroundColor: isConflict ? '#ef4444' : skill.color,
          minWidth: 4,
          border: isConflict ? '1px solid #fca5a5' : 'none'
        }}
        title={skill.name}
      >
        {effectWidth > 40 && skill.name}
      </div>

      {/* Cooldown block (grayed out) */}
      {cooldownWidth > 2 && (
        <div
          className="rounded-r select-none"
          style={{
            width: cooldownWidth,
            backgroundColor: skill.color + '3a',
            border: `1px solid ${skill.color}55`,
            borderLeft: 'none'
          }}
        />
      )}

      {/* Popover */}
      {showPopover && (
        <div
          className="absolute z-50 bg-[#1e2533] border border-[#3d4a5c] rounded p-3 text-xs text-[#e2e8f0] shadow-xl"
          style={popoverBelow
            ? { top: '110%', left: 0, minWidth: 160 }
            : { bottom: '110%', left: 0, minWidth: 160 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="font-semibold text-sm mb-1" style={{ color: skill.color }}>
            {skill.name}
          </div>
          <div className="text-[#94a3b8] space-y-0.5">
            <div>Cast: <span className="text-[#e2e8f0]">{formatTime(placed.startTime)}</span></div>
            <div>Effect ends: <span className="text-[#e2e8f0]">{formatTime(effectEnd)}</span></div>
            <div>Ready at: <span className="text-[#e2e8f0]">{formatTime(endTime)}</span></div>
            <div>Effect: <span className="text-[#e2e8f0]">{skill.effectiveDuration}s</span></div>
            <div>Cooldown: <span className="text-[#e2e8f0]">{skill.cooldown}s</span></div>
          </div>
          <button
            className="mt-2 w-full text-center bg-red-600 hover:bg-red-700 text-white py-1 rounded text-xs"
            onClick={() => { removePlacedSkill(placed.id); setShowPopover(false) }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}
