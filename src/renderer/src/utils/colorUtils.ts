/** A palette of distinguishable colors for skills */
export const COLOR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#a78bfa', // light violet
  '#34d399', // light emerald
  '#fbbf24', // light amber
  '#60a5fa', // light blue
]

/** Pick the next available palette color given a list of already-used colors */
export function nextColor(usedColors: string[]): string {
  for (const color of COLOR_PALETTE) {
    if (!usedColors.includes(color)) return color
  }
  // All colors used — generate a random one
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`
}

/** Lighten a hex color for the cooldown block */
export function dimColor(hex: string, opacity = 0.3): string {
  return hex + Math.round(opacity * 255).toString(16).padStart(2, '0')
}
