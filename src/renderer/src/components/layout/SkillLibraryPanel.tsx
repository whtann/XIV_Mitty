import React, { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { JobDefinition, SkillDefinition } from '../../types'
import { useConfigStore } from '../../store/configStore'
import { usePlanStore } from '../../store/planStore'
import { ManageSkillsModal } from '../modals/ManageSkillsModal'
import { ManageJobsModal } from '../modals/ManageJobsModal'
import { formatTime } from '../../utils/time'

export function SkillLibraryPanel(): React.JSX.Element {
  const jobs = useConfigStore((s) => s.jobs)
  const skills = useConfigStore((s) => s.skills)
  const removeJob = useConfigStore((s) => s.removeJob)
  const removeSkill = useConfigStore((s) => s.removeSkill)
  const planJobs = usePlanStore((s) => s.plan.jobs)
  const addJobToPlane = usePlanStore((s) => s.addJobToPlane)
  const removeJobFromPlan = usePlanStore((s) => s.removeJobFromPlan)

  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
  const [showManageSkills, setShowManageSkills] = useState<JobDefinition | null>(null)
  const [showManageJobs, setShowManageJobs] = useState(false)

  function toggleJob(id: string): void {
    setExpandedJobs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const planJobIds = new Set(planJobs.map((j) => j.id))

  return (
    <>
      <div className="w-48 flex-shrink-0 bg-[#12172a] border-r border-[#2d3748] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-2 border-b border-[#2d3748] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
            Party
          </span>
          <button
            className="text-xs text-[#64748b] hover:text-[#94a3b8] px-1"
            onClick={() => setShowManageJobs(true)}
            title="Manage jobs"
          >
            ⚙
          </button>
        </div>

        {/* Job list */}
        <div className="flex-1 overflow-y-auto">
          {jobs.length === 0 && (
            <div className="p-3 text-xs text-[#4a5568] italic text-center">
              No jobs yet.{' '}
              <button
                className="text-[#64748b] hover:text-[#94a3b8] underline"
                onClick={() => setShowManageJobs(true)}
              >
                Add jobs
              </button>
            </div>
          )}

          {jobs.map((job) => {
            const jobSkills = skills.filter((sk) => sk.jobId === job.id)
            const isExpanded = expandedJobs.has(job.id)
            const inPlan = planJobIds.has(job.id)

            return (
              <div key={job.id} className="border-b border-[#1e2533]">
                {/* Job header row */}
                <div className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#1a2235] group">
                  <button
                    className="text-[10px] text-[#4a5568] mr-1 w-3"
                    onClick={() => toggleJob(job.id)}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                  {job.iconDataUrl ? (
                    <img src={job.iconDataUrl} alt="" className="w-4 h-4 rounded-sm object-cover mr-1.5 flex-shrink-0" />
                  ) : (
                    <div
                      className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                      style={{ backgroundColor: job.color }}
                    />
                  )}
                  <span
                    className="text-xs font-medium flex-1 truncate"
                    style={{ color: job.color }}
                    onClick={() => toggleJob(job.id)}
                  >
                    {job.name}
                  </span>

                  {/* Add/remove from plan */}
                  <button
                    className={`text-[10px] px-1 rounded ml-1 ${
                      inPlan
                        ? 'text-green-400 hover:text-red-400'
                        : 'text-[#4a5568] hover:text-green-400'
                    }`}
                    title={inPlan ? 'Remove from plan' : 'Add to plan'}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (inPlan) removeJobFromPlan(job.id)
                      else addJobToPlane(job)
                    }}
                  >
                    {inPlan ? '✓' : '+'}
                  </button>

                  {/* Manage skills */}
                  <button
                    className="text-[10px] text-[#4a5568] hover:text-[#94a3b8] px-1 opacity-0 group-hover:opacity-100"
                    title="Edit skills"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowManageSkills(job)
                    }}
                  >
                    ✎
                  </button>

                  {/* Delete job */}
                  <button
                    className="text-[10px] text-[#4a5568] hover:text-red-400 px-1 opacity-0 group-hover:opacity-100"
                    title="Delete job"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeJobFromPlan(job.id)
                      removeJob(job.id)
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Skills list */}
                {isExpanded && (
                  <div className="pb-1">
                    {jobSkills.length === 0 && (
                      <div className="px-6 py-1 text-[10px] text-[#4a5568] italic">
                        No skills.{' '}
                        <button
                          className="underline hover:text-[#64748b]"
                          onClick={() => setShowManageSkills(job)}
                        >
                          Add
                        </button>
                      </div>
                    )}
                    {jobSkills.map((skill) => (
                      <DraggableSkillCard key={skill.id} skill={skill} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showManageSkills && (
        <ManageSkillsModal job={showManageSkills} onClose={() => setShowManageSkills(null)} />
      )}
      {showManageJobs && (
        <ManageJobsModal onClose={() => setShowManageJobs(false)} />
      )}
    </>
  )
}

// ── Draggable skill card ──────────────────────────────────────────────────────

function DraggableSkillCard({ skill }: { skill: SkillDefinition }): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `skill-card-${skill.id}`,
    data: { type: 'skill-card', skill }
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mx-2 mb-1 rounded px-2 py-1 text-[10px] font-medium text-white select-none hover:brightness-110 transition-all"
      title={`${skill.name} — Effect: ${skill.effectiveDuration}s | CD: ${skill.cooldown}s`}
    >
      <div
        className="flex items-center gap-1.5 rounded px-1.5 py-0.5"
        style={{ backgroundColor: skill.color + '33', border: `1px solid ${skill.color}66` }}
      >
        {skill.iconDataUrl ? (
          <img src={skill.iconDataUrl} alt="" className="w-3 h-3 rounded-sm object-cover flex-shrink-0" />
        ) : (
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: skill.color }} />
        )}
        <span className="truncate" style={{ color: skill.color }}>{skill.name}</span>
      </div>
      <div className="text-[#4a5568] mt-0.5 pl-3.5">
        {skill.effectiveDuration}s / {formatTime(skill.cooldown)}
      </div>
    </div>
  )
}
