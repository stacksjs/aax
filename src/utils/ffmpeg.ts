import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { config } from '../config'
import { formatTime, logger, parseFFmpegProgress } from './logger'

// Keep track of which options are supported
const supportedOptions = new Map<string, boolean>()

/**
 * Check if FFmpeg is available
 */
export async function checkFFmpeg(): Promise<boolean> {
  try {
    // Use configured path if provided
    const ffmpegPath = config.ffmpegPath || 'ffmpeg'
    if (config.ffmpegPath && !existsSync(config.ffmpegPath)) {
      logger.error(`Configured FFmpeg path does not exist: ${config.ffmpegPath}`)
      return false
    }

    // Check if FFmpeg is available
    execSync(`${ffmpegPath} -version`, { stdio: 'ignore' })
    return true
  }
  catch {
    return false
  }
}

/**
 * Check if a specific FFmpeg option is supported
 */
export async function isOptionSupported(option: string): Promise<boolean> {
  // Check cache first
  if (supportedOptions.has(option)) {
    return supportedOptions.get(option) || false
  }

  try {
    const ffmpegPath = config.ffmpegPath || 'ffmpeg'

    // For certain known custom options, we can skip the check completely as they're
    // not part of standard FFmpeg distributions
    const knownCustomOptions: string[] = []

    if (knownCustomOptions.includes(option)) {
      supportedOptions.set(option, false)
      return false
    }

    // Test the option with -help to see if it's recognized
    execSync(`${ffmpegPath} -help ${option}`, { stdio: 'ignore' })
    supportedOptions.set(option, true)
    return true
  }
  catch {
    supportedOptions.set(option, false)
    return false
  }
}

/**
 * Run FFmpeg with the given arguments
 */
export async function runFFmpeg(args: string[]): Promise<{ success: boolean, output: string }> {
  // Check if this is a metadata extraction call
  const isMetadataExtraction = args.includes('-f') && args.includes('ffmetadata')

  return new Promise((resolve) => {
    const ffmpegPath = config.ffmpegPath || 'ffmpeg'
    const ffmpeg = spawn(ffmpegPath, args)
    let output = ''

    // Progress tracking variables
    let bookDuration: number | undefined
    let currentTimeMs = 0
    let lastOutputTime = Date.now()
    let isFirstProgress = true

    // For tracking file size
    let currentSize = '0KB'
    let currentSpeed = '0x'

    // Progress bar
    const progressBar = isMetadataExtraction
      ? null
      : logger.progress(100, 'Preparing conversion...')

    // Regular update interval
    const updateInterval = setInterval(() => {
      if (!progressBar || !bookDuration)
        return

      // Only apply time-based updates if we're actually making progress
      const now = Date.now()
      if (now - lastOutputTime > 3000 && currentTimeMs > 0) {
        // It's been a while since the last FFmpeg update, show progress is still happening
        // Assume some minimal progress
        const progressPercent = Math.max(0.1, Math.min(99.9, (currentTimeMs / bookDuration) * 100))
        progressBar.update(progressPercent, `Converting ${formatTime(currentTimeMs)} / ${formatTime(bookDuration)} (${currentSpeed}) - Size: ${currentSize}`)

        // Small time progress so user knows it's not frozen
        currentTimeMs += 100
      }
    }, 1000)

    function updateProgressFromOutput(text: string) {
      if (!progressBar)
        return

      const progress = parseFFmpegProgress(text)

      // Get total duration once we know it
      if (progress.totalMs && progress.totalMs > 0 && !bookDuration) {
        bookDuration = progress.totalMs
      }

      // Update time position if provided
      if (progress.timeMs !== undefined) {
        currentTimeMs = progress.timeMs
        lastOutputTime = Date.now()

        // Calculate progress percentage based on time
        if (bookDuration) {
          const progressPercent = Math.max(0.1, Math.min(99.9, (currentTimeMs / bookDuration) * 100))

          // Update size and speed if available
          if (progress.size)
            currentSize = progress.size
          if (progress.speed)
            currentSpeed = progress.speed

          // Prepare message
          let message = `Converting ${formatTime(currentTimeMs)} / ${formatTime(bookDuration)}`
          if (progress.speed)
            message += ` (${progress.speed}x)`
          if (progress.size)
            message += ` - Size: ${progress.size}`

          // Update progress bar
          progressBar.update(progressPercent, message)

          // Log first progress point for debugging
          if (isFirstProgress) {
            logger.debug(`First progress update: ${progressPercent.toFixed(1)}%, time=${formatTime(currentTimeMs)}`)
            isFirstProgress = false
          }
        }
      }
    }

    // Handle stdout data
    ffmpeg.stdout.on('data', (data) => {
      const chunk = data.toString()
      output += chunk

      if (!isMetadataExtraction) {
        updateProgressFromOutput(chunk)
      }
    })

    // Buffer stderr output to catch progress information
    let stderrBuffer = ''

    // Handle stderr data (where most FFmpeg output goes)
    ffmpeg.stderr.on('data', (data) => {
      const chunk = data.toString()
      output += chunk

      if (!isMetadataExtraction) {
        // Add to buffer and process if contains important info
        stderrBuffer += chunk

        if (stderrBuffer.includes('time=') || stderrBuffer.includes('Duration:')) {
          updateProgressFromOutput(stderrBuffer)

          // Reset buffer after processing a large chunk
          if (stderrBuffer.length > 1000) {
            stderrBuffer = ''
          }
        }
      }

      // Only show raw output in verbose mode
      if (config.verbose) {
        logger.debug(chunk.trim())
      }
    })

    // Handle process completion
    ffmpeg.on('close', (code) => {
      clearInterval(updateInterval)

      if (progressBar) {
        if (code === 0) {
          progressBar.finish('Conversion completed successfully!')
        }
        else {
          progressBar.interrupt('Conversion failed', 'error')
        }
      }

      resolve({
        success: code === 0,
        output,
      })
    })
  })
}

/**
 * Extracts metadata from an AAX file using FFmpeg
 */
export async function extractAAXMetadata(filePath: string): Promise<string> {
  logger.info(`Extracting metadata from ${filePath}...`)

  // For metadata extraction we use a simple info message rather than a progress bar
  // since it's usually quick and doesn't provide meaningful progress information
  const startTime = Date.now()

  const args = [
    '-i',
    filePath,
    '-f',
    'ffmetadata',
  ]

  const { success, output } = await runFFmpeg(args)

  const duration = Date.now() - startTime
  logger.debug(`Metadata extraction completed in ${duration}ms`)

  return success ? output : ''
}
