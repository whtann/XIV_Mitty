import React, { useEffect, useCallback, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
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

const ROW_HEIGHT = 36

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
  const setDragPreview = usePlanStore((s) => s.setDragPreview)

  const [draggingSkill, setDraggingSkill] = useState<SkillDefinition | null>(null)
  const [dragStartRow, setDragStartRow] = useState(0)

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
    if (data?.type === 'skill-card') {
      setDraggingSkill(data.skill as SkillDefinition)
    }
    if (data?.type === 'placed-skill') {
      setDraggingSkill(data.skill as SkillDefinition)
      // Capture the display row once at drag start — do NOT read it from
      // activeData during move, because dragPreview causes re-renders that
      // update displayRow and create an infinite feedback loop.
      setDragStartRow((data.displayRow as number) ?? 0)
    }
  }

  function handleDragMove(event: DragMoveEvent): void {
    const activeData = event.active.data.current
    if (activeData?.type !== 'placed-skill') return
    const newRow = Math.max(0, dragStartRow + Math.round(event.delta.y / ROW_HEIGHT))
    setDragPreview({ id: event.active.id as string, row: newRow, originalRow: dragStartRow })
  }

  function handleDragEnd(event: DragEndEvent): void {
    setDraggingSkill(null)
    setDragPreview(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current
    if (!overData || overData.type !== 'job-track') return

    const jobId: string = overData.jobId
    const activatorEvent = event.activatorEvent as MouseEvent

    if (activeData?.type === 'skill-card') {
      // over.rect is the droppable element's ClientRect (measured by dnd-kit at drag
      // start). The droppable div sits after the 160px label column, so over.rect.left
      // already points at the start of the timeline content — no manual offset needed.
      const pointerX = activatorEvent.clientX + event.delta.x
      const dropX = Math.max(0, pointerX - over.rect.left)
      const rawTime = pixelsToSeconds(dropX, ui.pixelsPerSecond)
      const snappedTime = snapTime(Math.min(rawTime, plan.duration), 1)
      placeSkill((activeData.skill as SkillDefinition).id, jobId, snappedTime)
    } else if (activeData?.type === 'placed-skill') {
      // Delta-based for existing blocks: preserves click offset, row changes with vertical drag
      const placed = activeData.placed as { startTime: number }
      const rawTime = placed.startTime + pixelsToSeconds(event.delta.x, ui.pixelsPerSecond)
      const snappedTime = snapTime(Math.max(0, Math.min(rawTime, plan.duration)), 1)
      const newRow = Math.max(0, dragStartRow + Math.round(event.delta.y / ROW_HEIGHT))
      moveSkill(active.id as string, snappedTime, jobId, newRow)
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
      onDragMove={handleDragMove}
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
        {draggingSkill && (() => {
          const effectWidth = Math.max(4, secondsToPixels(draggingSkill.effectiveDuration, ui.pixelsPerSecond))
          const cooldownWidth = Math.max(0, secondsToPixels(draggingSkill.cooldown - draggingSkill.effectiveDuration, ui.pixelsPerSecond))
          return (
            <div className="h-7 flex opacity-80 pointer-events-none shadow-lg">
              <div
                className="flex items-center px-1 text-[10px] font-semibold text-white overflow-hidden whitespace-nowrap rounded-l"
                style={{ width: effectWidth, backgroundColor: draggingSkill.color, minWidth: 4 }}
              >
                {effectWidth > 40 && draggingSkill.name}
              </div>
              {cooldownWidth > 2 && (
                <div
                  className="rounded-r"
                  style={{
                    width: cooldownWidth,
                    backgroundColor: draggingSkill.color + '3a',
                    border: `1px solid ${draggingSkill.color}55`,
                    borderLeft: 'none'
                  }}
                />
              )}
            </div>
          )
        })()}
      </DragOverlay>
    </DndContext>
  )
}
