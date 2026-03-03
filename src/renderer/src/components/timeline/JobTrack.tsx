import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { JobDefinition, PlacedSkill, SkillDefinition } from '../../types'
import { SkillBlock } from './SkillBlock'
import { secondsToPixels } from '../../utils/time'

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

  const totalWidth = secondsToPixels(duration, pixelsPerSecond)

  return (
    <div className="flex" style={{ height: 40 }}>
      {/* Label column */}
      <div
        className="flex-shrink-0 flex items-center px-2 bg-[#12172a] border-r border-b border-[#2d3748] text-xs font-medium overflow-hidden"
        style={{ width: 160, color: job.color }}
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
          height: 40,
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
            />
          )
        })}
      </div>
    </div>
  )
}
