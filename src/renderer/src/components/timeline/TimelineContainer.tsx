import React, { useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { JobDefinition, PlacedSkill, SkillDefinition } from '../../types'
import { usePlanStore } from '../../store/planStore'
import { useConfigStore } from '../../store/configStore'
import { TimelineRuler } from './TimelineRuler'
import { MechanicTrack } from './MechanicTrack'
import { JobTrack } from './JobTrack'
import { secondsToPixels } from '../../utils/time'

export function TimelineContainer(): React.JSX.Element {
  const plan = usePlanStore((s) => s.plan)
  const ui = usePlanStore((s) => s.ui)
  const setPixelsPerSecond = usePlanStore((s) => s.setPixelsPerSecond)
  const skills = useConfigStore((s) => s.skills)

  const { viewMode, selectedJobId, pixelsPerSecond } = ui

  const scrollRef = useRef<HTMLDivElement>(null)

  const skillMap = new Map(skills.map((sk) => [sk.id, sk]))

  function handleWheel(e: React.WheelEvent): void {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.5 : -0.5
      setPixelsPerSecond(pixelsPerSecond + delta)
    }
  }

  const visibleJobs = (() => {
    if (viewMode === 'all') return plan.jobs
    if (viewMode === 'single') return plan.jobs.filter((j) => j.id === selectedJobId)
    return plan.jobs
  })()

  const totalWidth = secondsToPixels(plan.duration, pixelsPerSecond)

  return (
    <div
      className="flex-1 overflow-x-auto overflow-y-auto select-none"
      ref={scrollRef}
      onWheel={handleWheel}
      style={{ minWidth: 0 }}
    >
      <div style={{ minWidth: totalWidth + 160, position: 'relative' }}>
        {/* Sticky ruler row */}
        <div className="sticky top-0 z-20 flex bg-[#0f1117]">
          <div
            className="flex-shrink-0 bg-[#12172a] border-r border-b border-[#2d3748]"
            style={{ width: 160, height: 28 }}
          />
          <TimelineRuler duration={plan.duration} pixelsPerSecond={pixelsPerSecond} />
        </div>

        {/* Mechanic track */}
        <MechanicTrack duration={plan.duration} pixelsPerSecond={pixelsPerSecond} />

        {/* Job tracks */}
        {viewMode === 'shared' ? (
          <div id="track-wrapper-shared">
            <SharedTrack
              jobs={plan.jobs}
              placedSkills={plan.placedSkills}
              skillMap={skillMap}
              duration={plan.duration}
              pixelsPerSecond={pixelsPerSecond}
            />
          </div>
        ) : (
          visibleJobs.map((job) => (
            <div key={job.id} id={`track-wrapper-${job.id}`}>
              <JobTrack
                job={job}
                placedSkills={plan.placedSkills.filter((ps) => ps.jobId === job.id)}
                skillDefs={skillMap}
                duration={plan.duration}
                pixelsPerSecond={pixelsPerSecond}
              />
            </div>
          ))
        )}

        {plan.jobs.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[#4a5568] text-sm italic">
            Add jobs from the panel on the left, then drag skills onto their tracks.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared Track (all jobs in one row) ────────────────────────────────────────

interface SharedTrackProps {
  jobs: JobDefinition[]
  placedSkills: PlacedSkill[]
  skillMap: Map<string, SkillDefinition>
  duration: number
  pixelsPerSecond: number
}

function SharedTrack({ jobs, placedSkills, skillMap, duration, pixelsPerSecond }: SharedTrackProps): React.JSX.Element {
  const totalWidth = secondsToPixels(duration, pixelsPerSecond)
  const firstJobId = jobs[0]?.id ?? 'shared'

  const { setNodeRef, isOver } = useDroppable({
    id: 'track-shared',
    data: { type: 'job-track', jobId: firstJobId }
  })

  return (
    <div className="flex" style={{ height: 48 }}>
      <div
        className="flex-shrink-0 flex items-center px-2 bg-[#12172a] border-r border-b border-[#2d3748] text-xs text-[#94a3b8]"
        style={{ width: 160 }}
      >
        All Jobs
      </div>
      <div
        ref={setNodeRef}
        className="relative border-b border-[#2d3748] overflow-visible"
        style={{
          width: totalWidth,
          flexShrink: 0,
          height: 48,
          backgroundColor: isOver ? '#1e2d1e' : '#0d1117',
          transition: 'background-color 0.1s'
        }}
      >
        {/* Grid lines */}
        {Array.from({ length: Math.floor(duration / 60) + 1 }, (_, i) => i * 60).map((t) => (
          <div
            key={t}
            className="absolute top-0 h-full w-px bg-[#1e2533] pointer-events-none"
            style={{ left: secondsToPixels(t, pixelsPerSecond) }}
          />
        ))}

        {placedSkills.map((ps) => {
          const skill = skillMap.get(ps.skillDefinitionId)
          if (!skill) return null
          const left = secondsToPixels(ps.startTime, pixelsPerSecond)
          const effectWidth = secondsToPixels(skill.effectiveDuration, pixelsPerSecond)
          const cdWidth = secondsToPixels(Math.max(0, skill.cooldown - skill.effectiveDuration), pixelsPerSecond)
          return (
            <div key={ps.id} className="absolute top-2 h-6 flex" style={{ left }}>
              <div
                className="rounded-l text-[9px] font-semibold text-white flex items-center px-1 overflow-hidden whitespace-nowrap"
                style={{ width: Math.max(4, effectWidth), backgroundColor: skill.color }}
                title={skill.name}
              >
                {effectWidth > 30 && skill.name}
              </div>
              {cdWidth > 2 && (
                <div
                  className="rounded-r"
                  style={{
                    width: cdWidth,
                    backgroundColor: skill.color + '3a',
                    border: `1px solid ${skill.color}55`,
                    borderLeft: 'none'
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
