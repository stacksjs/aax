import { Logger } from '@stacksjs/clarity'

// Create a logger instance with a fancy UI
export const logger: Logger = new Logger('aax', {
  fancy: true,
  level: 'info',
  showTags: true,
})

/**
 * Utility to parse FFmpeg progress output
 * @param output FFmpeg output string
 * @returns Progress information if available
 */
export function parseFFmpegProgress(output: string): {
  timeMs?: number
  totalMs?: number
  progress?: number
  speed?: string
  size?: string
} {
  const result: { timeMs?: number, totalMs?: number, progress?: number, speed?: string, size?: string } = {}

  // Extract time with more flexible regex - FFmpeg outputs in various formats
  // Match both HH:MM:SS.MS and HH:MM:SS formats
  const timeMatch = output.match(/time=\s*(\d+):(\d+):(\d+)(\.(\d+))?/i)
  if (timeMatch) {
    const hours = Number.parseInt(timeMatch[1], 10)
    const minutes = Number.parseInt(timeMatch[2], 10)
    const seconds = Number.parseInt(timeMatch[3], 10)
    const milliseconds = timeMatch[5] ? Number.parseInt(timeMatch[5], 10) : 0
    result.timeMs = (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds
  }

  // Extract duration with more flexible regex
  const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+)(\.(\d+))?/i)
  if (durationMatch) {
    const hours = Number.parseInt(durationMatch[1], 10)
    const minutes = Number.parseInt(durationMatch[2], 10)
    const seconds = Number.parseInt(durationMatch[3], 10)
    const milliseconds = durationMatch[5] ? Number.parseInt(durationMatch[5], 10) : 0
    result.totalMs = (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds
  }

  // Calculate progress if we have both time and duration
  if (result.timeMs !== undefined && result.totalMs !== undefined && result.totalMs > 0) {
    result.progress = Math.min(100, (result.timeMs / result.totalMs) * 100)
  }

  // Extract speed
  const speedMatch = output.match(/speed=\s*(\S+)x/i)
  if (speedMatch) {
    result.speed = speedMatch[1]
  }

  // Extract size
  const sizeMatch = output.match(/size=\s*(\S+)/i)
  if (sizeMatch) {
    result.size = sizeMatch[1]
  }

  return result
}

/**
 * Format time in milliseconds to HH:MM:SS
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
