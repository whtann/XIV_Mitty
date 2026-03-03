import React from 'react'
import { formatTime, getRulerMarks, secondsToPixels } from '../../utils/time'

interface Props {
  duration: number
  pixelsPerSecond: number
}

export function TimelineRuler({ duration, pixelsPerSecond }: Props): React.JSX.Element {
  const marks = getRulerMarks(duration, pixelsPerSecond)
  const totalWidth = secondsToPixels(duration, pixelsPerSecond)

  return (
    <div
      className="relative bg-[#0f1117] border-b border-[#2d3748] select-none"
      style={{ width: totalWidth, height: 28, flexShrink: 0 }}
    >
      {marks.map((t) => {
        const x = secondsToPixels(t, pixelsPerSecond)
        return (
          <div
            key={t}
            className="absolute flex flex-col items-center"
            style={{ left: x, transform: 'translateX(-50%)' }}
          >
            <div className="w-px bg-[#4a5568]" style={{ height: 8, marginTop: 0 }} />
            <span className="text-[10px] text-[#94a3b8] leading-none mt-0.5">
              {formatTime(t)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
