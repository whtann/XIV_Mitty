import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { JobDefinition, SkillDefinition, AppConfig } from '../types'
import { nextColor } from '../utils/colorUtils'

interface ConfigStore {
  jobs: JobDefinition[]
  skills: SkillDefinition[]
  loaded: boolean

  /** Load config from electron-store on startup */
  loadConfig: () => Promise<void>
  /** Persist current config to electron-store */
  saveConfig: () => Promise<void>

  // Jobs
  addJob: (partial: Omit<JobDefinition, 'id'>) => void
  updateJob: (id: string, partial: Partial<Omit<JobDefinition, 'id'>>) => void
  removeJob: (id: string) => void
  reorderJobs: (ids: string[]) => void

  // Skills
  addSkill: (partial: Omit<SkillDefinition, 'id'>) => void
  updateSkill: (id: string, partial: Partial<Omit<SkillDefinition, 'id'>>) => void
  removeSkill: (id: string) => void
  skillsByJob: (jobId: string) => SkillDefinition[]
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  jobs: [],
  skills: [],
  loaded: false,

  loadConfig: async () => {
    const config: AppConfig = await window.api.store.getConfig()
    set({ jobs: config.jobs ?? [], skills: config.skills ?? [], loaded: true })
  },

  saveConfig: async () => {
    const { jobs, skills } = get()
    await window.api.store.setConfig({ jobs, skills })
  },

  // ── Jobs ────────────────────────────────────────────────────────────────
  addJob: (partial) => {
    const id = uuid()
    const color = partial.color ?? nextColor(get().jobs.map((j) => j.color))
    const newJob: JobDefinition = { id, color, ...partial }
    set((s) => ({ jobs: [...s.jobs, newJob] }))
    get().saveConfig()
  },

  updateJob: (id, partial) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...partial } : j))
    }))
    get().saveConfig()
  },

  removeJob: (id) => {
    set((s) => ({
      jobs: s.jobs.filter((j) => j.id !== id),
      skills: s.skills.filter((sk) => sk.jobId !== id)
    }))
    get().saveConfig()
  },

  reorderJobs: (ids) => {
    set((s) => {
      const map = new Map(s.jobs.map((j) => [j.id, j]))
      return { jobs: ids.map((id) => map.get(id)!).filter(Boolean) }
    })
    get().saveConfig()
  },

  // ── Skills ───────────────────────────────────────────────────────────────
  addSkill: (partial) => {
    const id = uuid()
    const jobSkills = get().skills.filter((sk) => sk.jobId === partial.jobId)
    const color = partial.color ?? nextColor(jobSkills.map((sk) => sk.color))
    const newSkill: SkillDefinition = { id, color, ...partial }
    set((s) => ({ skills: [...s.skills, newSkill] }))
    get().saveConfig()
  },

  updateSkill: (id, partial) => {
    set((s) => ({
      skills: s.skills.map((sk) => (sk.id === id ? { ...sk, ...partial } : sk))
    }))
    get().saveConfig()
  },

  removeSkill: (id) => {
    set((s) => ({ skills: s.skills.filter((sk) => sk.id !== id) }))
    get().saveConfig()
  },

  skillsByJob: (jobId) => get().skills.filter((sk) => sk.jobId === jobId)
}))
