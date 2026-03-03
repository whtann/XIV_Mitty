import React, { useEffect, useCallback, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  useSensor,
  useSensors,
  pointerWithin
} from '@dnd-kit/core'
import { TopBar } from './components/layout/TopBar'
import { SkillLibraryPanel } from './components/layout/SkillLibraryPanel'
import { TimelineContainer } from './components/timeline/TimelineContainer'
import { useConfigStore } from './store/configStore'
import { usePlanStore } from './store/planStore'
import type { SkillDefinition } from './types'
import { secondsToPixels, pixelsToSeconds, snapTime } from './utils/time'

export function App(): React.JSX.Element {
  const loadConfig = useConfigStore((s) => s.loadConfig)
  const loaded = useConfigStore((s) => s.loaded)
  const ui = usePlanStore((s) => s.ui)
  const plan = usePlanStore((s) => s.plan)
  const toJSON = usePlanStore((s) => s.toJSON)
  const setFilePath = usePlanStore((s) => s.setFilePath)
  const markClean = usePlanStore((s) => s.markClean)
  const placeSkill = usePlanStore((s) => s.placeSkill)
  const moveSkill = usePlanStore((s) => s.moveSkill)

  const [draggingSkill, setDraggingSkill] = useState<SkillDefinition | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } })
  )

  // Load persistent config on startup
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        const json = toJSON()
        const savedPath = await window.api.file.save(ui.currentFilePath, json)
        if (savedPath) {
          setFilePath(savedPath)
          markClean()
        }
      }
    },
    [toJSON, ui.currentFilePath, setFilePath, markClean]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function handleDragStart(event: DragStartEvent): void {
    const data = event.active.data.current
    if (data?.type === 'skill-card' || data?.type === 'placed-skill') {
      setDraggingSkill(data.skill as SkillDefinition)
    }
  }

  function handleDragEnd(event: DragEndEvent): void {
    setDraggingSkill(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current
    if (!overData || overData.type !== 'job-track') return

    const jobId: string = overData.jobId

    const trackWrapper =
      document.getElementById(`track-wrapper-${jobId}`) ??
      document.getElementById(`track-wrapper-shared`)
    if (!trackWrapper) return

    const trackRect = trackWrapper.getBoundingClientRect()
    const pointerX = (event.activatorEvent as MouseEvent).clientX + event.delta.x
    const dropX = pointerX - trackRect.left - 160

    const rawTime = pixelsToSeconds(Math.max(0, dropX), ui.pixelsPerSecond)
    const snappedTime = snapTime(Math.min(rawTime, plan.duration), 1)

    if (activeData?.type === 'skill-card') {
      placeSkill((activeData.skill as SkillDefinition).id, jobId, snappedTime)
    } else if (activeData?.type === 'placed-skill') {
      moveSkill(active.id as string, snappedTime, jobId)
    }
  }

  if (!loaded) {
    return (
      <div className="h-screen bg-[#1a1a2e] flex items-center justify-center text-[#94a3b8] text-sm">
        Loading...
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-[#0d1117] overflow-hidden">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <SkillLibraryPanel />
          <TimelineContainer />
        </div>
      </div>
      <DragOverlay>
        {draggingSkill && (
          <div
            className="h-7 rounded flex items-center px-2 text-xs font-semibold text-white shadow-lg opacity-80 pointer-events-none"
            style={{
              backgroundColor: draggingSkill.color,
              width: Math.max(40, secondsToPixels(draggingSkill.effectiveDuration, ui.pixelsPerSecond))
            }}
          >
            {draggingSkill.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
