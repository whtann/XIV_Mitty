// ── Persistent config (saved to electron-store) ──────────────────────────────

export type JobRole = 'tank' | 'healer' | 'dps' | 'other'

export interface JobDefinition {
  id: string
  name: string // e.g. "H1 (WHM)", "MT (WAR)"
  role: JobRole
  color: string // hex
  iconDataUrl?: string // base64 data URL for job icon
}

export interface SkillDefinition {
  id: string
  name: string
  jobId: string
  /** How long the buff/shield is active (seconds) */
  effectiveDuration: number
  /** Full recast timer from cast time (seconds) */
  cooldown: number
  /** Hex color for the timeline block */
  color: string
  iconDataUrl?: string // base64 data URL for skill/ability icon
}

// ── Fight plan (saved as .json file) ─────────────────────────────────────────

export type MechanicType =
  | 'tankBuster'
  | 'raidWide'
  | 'enrage'
  | 'phaseChange'
  | 'mechanic'
  | 'custom'

export interface Mechanic {
  id: string
  name: string
  /** Seconds from pull */
  timestamp: number
  type: MechanicType
  /** Optional cast/resolve duration in seconds */
  duration?: number
  description?: string
  /** For 'custom' type, user-chosen color */
  customColor?: string
}

export interface PlacedSkill {
  id: string
  skillDefinitionId: string
  /** Which job's row this skill is placed on */
  jobId: string
  /** Seconds from pull */
  startTime: number
  /** Visual sub-row within the job track (0 = top) */
  row?: number
}

export interface FightPlan {
  version: string
  name: string
  /** Total fight duration in seconds */
  duration: number
  /** Ordered list of job rows in this plan */
  jobs: JobDefinition[]
  mechanics: Mechanic[]
  placedSkills: PlacedSkill[]
}

// ── UI state ──────────────────────────────────────────────────────────────────

export type ViewMode = 'all' | 'single' | 'shared'

export interface UIState {
  viewMode: ViewMode
  selectedJobId: string | null
  pixelsPerSecond: number
  currentFilePath: string | null
  isDirty: boolean
  /** Live drag preview: which skill is being dragged, its target row, and the row it started from */
  dragPreview: { id: string; row: number; originalRow: number } | null
}

// ── Mechanic color map ────────────────────────────────────────────────────────

export const MECHANIC_COLORS: Record<MechanicType, string> = {
  tankBuster: '#f97316',  // orange
  raidWide: '#ef4444',    // red
  enrage: '#991b1b',      // dark red
  phaseChange: '#a855f7', // purple
  mechanic: '#3b82f6',    // blue
  custom: '#6b7280'       // gray (overridden by customColor)
}

export const MECHANIC_LABELS: Record<MechanicType, string> = {
  tankBuster: 'Tank Buster',
  raidWide: 'Raid-Wide',
  enrage: 'Enrage',
  phaseChange: 'Phase Change',
  mechanic: 'Mechanic',
  custom: 'Custom'
}

// ── Window API (exposed via preload) ──────────────────────────────────────────

export interface AppConfig {
  jobs: JobDefinition[]
  skills: SkillDefinition[]
}

declare global {
  interface Window {
    api: {
      store: {
        getConfig: () => Promise<AppConfig>
        setConfig: (config: AppConfig) => Promise<void>
      }
      file: {
        open: () => Promise<{ filePath: string; content: string } | null>
        save: (filePath: string | null, content: string) => Promise<string | null>
        saveAs: (content: string) => Promise<string | null>
      }
      image: {
        pick: () => Promise<string | null>
      }
    }
  }
}
