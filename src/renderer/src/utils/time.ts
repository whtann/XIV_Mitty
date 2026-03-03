/** Format seconds as MM:SS */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Parse a "MM:SS" or "SS" string into seconds. Returns NaN if invalid. */
export function parseTime(value: string): number {
  const parts = value.trim().split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10)
    const s = parseInt(parts[1], 10)
    if (isNaN(m) || isNaN(s) || s >= 60) return NaN
    return m * 60 + s
  }
  if (parts.length === 1) {
    const s = parseInt(parts[0], 10)
    return isNaN(s) ? NaN : s
  }
  return NaN
}

/** Convert seconds to pixels at a given zoom level */
export function secondsToPixels(seconds: number, pixelsPerSecond: number): number {
  return seconds * pixelsPerSecond
}

/** Convert a pixel offset to seconds at a given zoom level */
export function pixelsToSeconds(pixels: number, pixelsPerSecond: number): number {
  return pixels / pixelsPerSecond
}

/** Snap a time value to the nearest interval (e.g. 1s snap) */
export function snapTime(seconds: number, snapInterval = 1): number {
  return Math.round(seconds / snapInterval) * snapInterval
}

/** Return an array of time marks (in seconds) for the ruler */
export function getRulerMarks(duration: number, pixelsPerSecond: number): number[] {
  // Choose interval based on zoom so marks don't overlap
  const minPixelsBetweenMarks = 60
  const candidates = [5, 10, 15, 30, 60, 120, 300]
  const interval = candidates.find((c) => c * pixelsPerSecond >= minPixelsBetweenMarks) ?? 300

  const marks: number[] = []
  for (let t = 0; t <= duration; t += interval) {
    marks.push(t)
  }
  return marks
}
