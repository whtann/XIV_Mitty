import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { JobDefinition, PlacedSkill, SkillDefinition } from '../../types'
import { SkillBlock } from './SkillBlock'
import { secondsToPixels } from '../../utils/time'
import { usePlanStore } from '../../store/planStore'

const ROW_HEIGHT = 36

/**
 * Assign display rows, guaranteeing no two time-overlapping skills share a row.
 *
 * Uses proper interval overlap detection (not just end-time tracking) so that
 * the dragged skill can be processed out of start-time order without breaking
 * assignments for non-adjacent skills.
 *
 * Sort priority (lowest = processed first = gets first pick of rows):
 *   1. The actively dragged skill (from dragPreview) — always wins
 *   2. Skills with an explicit ps.row, sorted ascending
 *   3. Skills without ps.row (auto-assign), sorted by startTime
 */
function assignRows(
  placedSkills: PlacedSkill[],
  skillDefs: Map<string, SkillDefinition>,
  dragPreview?: { id: string; row: number; originalRow: number } | null
): Map<string, number> {
  const skills = placedSkills.map((ps) =>
    dragPreview && ps.id === dragPreview.id ? { ...ps, row: dragPreview.row } : ps
  )

  const sorted = [...skills].sort((a, b) => {
    if (dragPreview?.id === a.id) return -1
    if (dragPreview?.id === b.id) return 1
    const rowA = a.row ?? Infinity
    const rowB = b.row ?? Infinity
    if (rowA !== rowB) return rowA - rowB
    return a.startTime - b.startTime
  })

  const rowMap = new Map<string, number>()
  // Per-row list of placed intervals {start, end}
  const rowIntervals: Array<Array<{ start: number; end: number }>> = []

  const overlaps = (row: number, start: number, end: number): boolean =>
    (rowIntervals[row] ?? []).some((iv) => start < iv.end && end > iv.start)

  for (const ps of sorted) {
    const skill = skillDefs.get(ps.skillDefinitionId)
    const skillEnd = skill ? ps.startTime + skill.cooldown : ps.startTime + 1

    let assignedRow: number

    if (ps.row !== undefined) {
      // Try preferred row, cascade upward until non-conflicting
      assignedRow = ps.row
      while (overlaps(assignedRow, ps.startTime, skillEnd)) assignedRow++
    } else {
      // Greedy: first non-conflicting row from top
      assignedRow = 0
      while (overlaps(assignedRow, ps.startTime, skillEnd)) assignedRow++
    }

    if (!rowIntervals[assignedRow]) rowIntervals[assignedRow] = []
    rowIntervals[assignedRow].push({ start: ps.startTime, end: skillEnd })
    // For the dragged skill, record its collision at the target row but keep
    // its DOM position at originalRow so the element's `top` stays stable
    // and the DragOverlay anchor doesn't jump.
    const displayRow =
      dragPreview?.id === ps.id ? dragPreview.originalRow : assignedRow
    rowMap.set(ps.id, displayRow)
  }

  return rowMap
}

interface Props {
  job: JobDefinition
  placedSkills: PlacedSkill[]
  skillDefs: Map<string, SkillDefinition>
  duration: number
  pixelsPerSecond: number
}

function isConflict(placed: PlacedSkill, skill: SkillDefinition, allPlaced: PlacedSkill[]): boolean {
  const sameSkillPlacements = allPlaced
    .filter((ps) => ps.skillDefinitionId === placed.skillDefinitionId && ps.id !== placed.id)
    .sort((a, b) => a.startTime - b.startTime)

  for (const other of sameSkillPlacements) {
    const otherEnd = other.startTime + skill.cooldown
    if (placed.startTime < otherEnd && placed.startTime > other.startTime) {
      return true
    }
  }
  return false
}

export function JobTrack({ job, placedSkills, skillDefs, duration, pixelsPerSecond }: Props): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id: `track-${job.id}`,
    data: { type: 'job-track', jobId: job.id }
  })

  const dragPreview = usePlanStore((s) => s.ui.dragPreview)

  const totalWidth = secondsToPixels(duration, pixelsPerSecond)
  const rowMap = assignRows(placedSkills, skillDefs, dragPreview)
  const numRows = rowMap.size === 0 ? 1 : Math.max(...rowMap.values()) + 1
  const trackHeight = numRows * ROW_HEIGHT

  return (
    <div className="flex" style={{ height: trackHeight }}>
      {/* Label column */}
      <div
        className="flex-shrink-0 flex items-center px-2 bg-[#12172a] border-r border-b border-[#2d3748] text-xs font-medium overflow-hidden"
        style={{ width: 160, color: job.color, height: trackHeight }}
      >
        <div
          className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
          style={{ backgroundColor: job.color }}
        />
        <span className="truncate">{job.name}</span>
      </div>

      {/* Droppable track area */}
      <div
        ref={setNodeRef}
        className="relative border-b border-[#2d3748] overflow-visible"
        style={{
          width: totalWidth,
          flexShrink: 0,
          height: trackHeight,
          backgroundColor: isOver ? '#1e2d1e' : '#0d1117',
          transition: 'background-color 0.1s'
        }}
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

        {/* Skill blocks */}
        {placedSkills.map((ps) => {
          const skill = skillDefs.get(ps.skillDefinitionId)
          if (!skill) return null
          return (
            <SkillBlock
              key={ps.id}
              placed={ps}
              skill={skill}
              pixelsPerSecond={pixelsPerSecond}
              isConflict={isConflict(ps, skill, placedSkills)}
              row={rowMap.get(ps.id) ?? 0}
              trackDuration={duration}
            />
          )
        })}
      </div>
    </div>
  )
}
