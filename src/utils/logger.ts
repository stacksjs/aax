import process from 'node:process'
import { Logger } from '@stacksjs/clarity'

// Determine log level via env (falls back to info). Only allow levels supported by clarity Logger
const envLevel = (process.env.AAX_LOG_LEVEL || '').toLowerCase()
const allowedLevels = ['error', 'info', 'debug'] as const
type AllowedLevel = typeof allowedLevels[number]
const level: AllowedLevel = (allowedLevels as readonly string[]).includes(envLevel) ? (envLevel as AllowedLevel) : 'info'

// Create a logger instance with a fancy UI
export const logger: Logger = new Logger('aax', {
  fancy: true,
  level,
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

/**
 * Report an error with optional heading, details and hints.
 * In debug mode (AAX_LOG_LEVEL=debug or AAX_DEBUG=1), also prints stack traces when available.
 */
export function reportError(
  error: unknown,
  options?: {
    heading?: string
    details?: string
    hints?: string[]
  },
): void {
  const isDebug = level === 'debug' || process.env.AAX_DEBUG === '1'

  const heading = options?.heading
  const details = options?.details
  const hints = options?.hints || []

  // Extract message/stack from various error shapes
  const errObj = normalizeError(error)

  if (heading)
    logger.error(heading)

  if (errObj.message)
    logger.error(errObj.message)

  if (details)
    logger.warn(details)

  for (const hint of hints)
    logger.warn(`Hint: ${hint}`)

  if (isDebug && errObj.stack)
    logger.debug(errObj.stack)
}

/**
 * Normalize unknown errors to a consistent shape.
 */
export function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack }
  }
  if (typeof error === 'string') {
    return { message: error }
  }
  try {
    return { message: JSON.stringify(error) }
  }
  catch {
    return { message: String(error) }
  }
}
