import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { FightPlan, Mechanic, PlacedSkill, JobDefinition, UIState, ViewMode } from '../types'

const PLAN_VERSION = '1.0'

function newPlan(): FightPlan {
  return {
    version: PLAN_VERSION,
    name: 'New Fight Plan',
    duration: 600,
    jobs: [],
    mechanics: [],
    placedSkills: []
  }
}

interface PlanStore {
  plan: FightPlan
  ui: UIState

  // ── Plan-level ─────────────────────────────────────────────────────────
  newPlan: () => void
  loadPlan: (json: string, filePath: string) => void
  setPlanName: (name: string) => void
  setPlanDuration: (seconds: number) => void

  // ── Jobs in plan ────────────────────────────────────────────────────────
  addJobToPlane: (job: JobDefinition) => void
  removeJobFromPlan: (jobId: string) => void
  reorderPlanJobs: (ids: string[]) => void

  // ── Mechanics ────────────────────────────────────────────────────────────
  addMechanic: (m: Omit<Mechanic, 'id'>) => void
  updateMechanic: (id: string, partial: Partial<Omit<Mechanic, 'id'>>) => void
  removeMechanic: (id: string) => void

  // ── Placed skills ────────────────────────────────────────────────────────
  placeSkill: (skillDefinitionId: string, jobId: string, startTime: number) => void
  moveSkill: (id: string, newStartTime: number, newJobId?: string) => void
  removePlacedSkill: (id: string) => void

  // ── UI state ──────────────────────────────────────────────────────────────
  setViewMode: (mode: ViewMode) => void
  setSelectedJob: (jobId: string | null) => void
  setPixelsPerSecond: (pps: number) => void
  setFilePath: (path: string | null) => void
  markClean: () => void

  // ── Serialization ─────────────────────────────────────────────────────────
  toJSON: () => string
}

const DEFAULT_UI: UIState = {
  viewMode: 'all',
  selectedJobId: null,
  pixelsPerSecond: 4,
  currentFilePath: null,
  isDirty: false
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  plan: newPlan(),
  ui: DEFAULT_UI,

  // ── Plan-level ─────────────────────────────────────────────────────────
  newPlan: () => set({ plan: newPlan(), ui: { ...DEFAULT_UI } }),

  loadPlan: (json, filePath) => {
    const plan = JSON.parse(json) as FightPlan
    set({ plan, ui: { ...DEFAULT_UI, currentFilePath: filePath, isDirty: false } })
  },

  setPlanName: (name) => {
    set((s) => ({ plan: { ...s.plan, name }, ui: { ...s.ui, isDirty: true } }))
  },

  setPlanDuration: (seconds) => {
    set((s) => ({ plan: { ...s.plan, duration: seconds }, ui: { ...s.ui, isDirty: true } }))
  },

  // ── Jobs in plan ────────────────────────────────────────────────────────
  addJobToPlane: (job) => {
    set((s) => {
      if (s.plan.jobs.find((j) => j.id === job.id)) return s
      return {
        plan: { ...s.plan, jobs: [...s.plan.jobs, job] },
        ui: { ...s.ui, isDirty: true }
      }
    })
  },

  removeJobFromPlan: (jobId) => {
    set((s) => ({
      plan: {
        ...s.plan,
        jobs: s.plan.jobs.filter((j) => j.id !== jobId),
        placedSkills: s.plan.placedSkills.filter((ps) => ps.jobId !== jobId)
      },
      ui: { ...s.ui, isDirty: true }
    }))
  },

  reorderPlanJobs: (ids) => {
    set((s) => {
      const map = new Map(s.plan.jobs.map((j) => [j.id, j]))
      return {
        plan: { ...s.plan, jobs: ids.map((id) => map.get(id)!).filter(Boolean) },
        ui: { ...s.ui, isDirty: true }
      }
    })
  },

  // ── Mechanics ────────────────────────────────────────────────────────────
  addMechanic: (m) => {
    const id = uuid()
    set((s) => ({
      plan: { ...s.plan, mechanics: [...s.plan.mechanics, { id, ...m }] },
      ui: { ...s.ui, isDirty: true }
    }))
  },

  updateMechanic: (id, partial) => {
    set((s) => ({
      plan: {
        ...s.plan,
        mechanics: s.plan.mechanics.map((m) => (m.id === id ? { ...m, ...partial } : m))
      },
      ui: { ...s.ui, isDirty: true }
    }))
  },

  removeMechanic: (id) => {
    set((s) => ({
      plan: { ...s.plan, mechanics: s.plan.mechanics.filter((m) => m.id !== id) },
      ui: { ...s.ui, isDirty: true }
    }))
  },

  // ── Placed skills ────────────────────────────────────────────────────────
  placeSkill: (skillDefinitionId, jobId, startTime) => {
    const id = uuid()
    const ps: PlacedSkill = { id, skillDefinitionId, jobId, startTime }
    set((s) => ({
      plan: { ...s.plan, placedSkills: [...s.plan.placedSkills, ps] },
      ui: { ...s.ui, isDirty: true }
    }))
  },

  moveSkill: (id, newStartTime, newJobId) => {
    set((s) => ({
      plan: {
        ...s.plan,
        placedSkills: s.plan.placedSkills.map((ps) =>
          ps.id === id
            ? { ...ps, startTime: newStartTime, jobId: newJobId ?? ps.jobId }
            : ps
        )
      },
      ui: { ...s.ui, isDirty: true }
    }))
  },

  removePlacedSkill: (id) => {
    set((s) => ({
      plan: { ...s.plan, placedSkills: s.plan.placedSkills.filter((ps) => ps.id !== id) },
      ui: { ...s.ui, isDirty: true }
    }))
  },

  // ── UI state ──────────────────────────────────────────────────────────────
  setViewMode: (mode) => set((s) => ({ ui: { ...s.ui, viewMode: mode } })),
  setSelectedJob: (jobId) => set((s) => ({ ui: { ...s.ui, selectedJobId: jobId } })),
  setPixelsPerSecond: (pps) => set((s) => ({ ui: { ...s.ui, pixelsPerSecond: Math.max(1, Math.min(20, pps)) } })),
  setFilePath: (path) => set((s) => ({ ui: { ...s.ui, currentFilePath: path } })),
  markClean: () => set((s) => ({ ui: { ...s.ui, isDirty: false } })),

  // ── Serialization ─────────────────────────────────────────────────────────
  toJSON: () => JSON.stringify(get().plan, null, 2)
}))
