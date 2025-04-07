import type { ConversionOptions, ConversionResult } from './types'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { config } from './config'
import { checkFFmpeg, runFFmpeg } from './utils/ffmpeg'
import { getBookMetadata } from './utils/metadata'

/**
 * Convert an AAX file to the specified format
 */
export async function convertAAX(options: ConversionOptions): Promise<ConversionResult> {
  // Set default options from config
  const outputFormat = options.outputFormat || config.outputFormat || 'mp3'
  const outputDir = options.outputDir || config.outputDir || '.'
  const activationCode = options.activationCode || config.activationCode
  const chaptersEnabled = options.chaptersEnabled ?? config.chaptersEnabled ?? false
  const bitrate = options.bitrate || config.bitrate || 64

  // Ensure input file exists
  if (!existsSync(options.inputFile)) {
    return {
      success: false,
      error: `Input file does not exist: ${options.inputFile}`,
    }
  }

  // Validate output directory
  if (!existsSync(outputDir)) {
    try {
      mkdirSync(outputDir, { recursive: true })
    }
    catch (error) {
      return {
        success: false,
        error: `Could not create output directory: ${(error as Error).message}`,
      }
    }
  }

  // Check FFmpeg
  const ffmpegAvailable = await checkFFmpeg()
  if (!ffmpegAvailable) {
    return {
      success: false,
      error: 'FFmpeg is not available. Please install FFmpeg or set ffmpegPath in config.',
    }
  }

  // Validate activation code
  if (!activationCode) {
    return {
      success: false,
      error: 'No activation code provided. This is required to convert AAX files.',
    }
  }

  console.warn(`Using activation code: ${activationCode.substring(0, 2)}******`)

  // Get book metadata for naming
  try {
    const metadata = await getBookMetadata(options.inputFile)
    const baseName = metadata.title
      ? `${metadata.title.replace(/[\\/:*?"<>|]/g, '_')}`
      : path.basename(options.inputFile, path.extname(options.inputFile))

    const outputPath = path.join(outputDir, `${baseName}.${outputFormat}`)

    // Build FFmpeg command
    const ffmpegArgs: string[] = []

    // Try multiple activation code formats (uppercase, lowercase)
    // First try original format
    ffmpegArgs.push('-activation_bytes', activationCode)

    // Input file
    ffmpegArgs.push('-i', options.inputFile)

    // Only process the audio stream (stream 0:0)
    ffmpegArgs.push('-map', '0:0')

    // Audio quality
    ffmpegArgs.push('-ab', `${bitrate}k`)

    // Add metadata mapping
    ffmpegArgs.push('-map_metadata', '0')

    // Handle chapters
    if (chaptersEnabled) {
      ffmpegArgs.push('-map_chapters', '0')
    }

    // Output format specific settings
    if (outputFormat === 'mp3') {
      ffmpegArgs.push('-codec:a', 'libmp3lame')
      ffmpegArgs.push('-write_xing', '0')
      ffmpegArgs.push('-id3v2_version', '3')
    }
    else if (outputFormat === 'm4a' || outputFormat === 'm4b') {
      ffmpegArgs.push('-codec:a', 'aac')
      ffmpegArgs.push('-f', 'mp4')
      ffmpegArgs.push('-movflags', '+faststart')
      ffmpegArgs.push('-metadata:s:a:0', 'handler=Sound')
    }

    // Output file
    ffmpegArgs.push('-y') // Overwrite output file if it exists
    ffmpegArgs.push(outputPath)

    // Log the full command for debugging
    console.warn(`FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`)

    // Run FFmpeg
    const { success, output } = await runFFmpeg(ffmpegArgs)

    if (success) {
      return {
        success: true,
        outputPath,
      }
    }
    else {
      // If first attempt failed, try with lowercase activation code
      console.warn('First conversion attempt failed, trying with lowercase activation code...')

      // Replace activation code with lowercase version
      ffmpegArgs[1] = activationCode.toLowerCase()

      console.warn(`FFmpeg command (with lowercase code): ffmpeg ${ffmpegArgs.join(' ')}`)

      const retryResult = await runFFmpeg(ffmpegArgs)

      if (retryResult.success) {
        return {
          success: true,
          outputPath,
        }
      }

      return {
        success: false,
        error: `FFmpeg conversion failed: ${output}`,
      }
    }
  }
  catch (error) {
    return {
      success: false,
      error: `Error during conversion: ${(error as Error).message}`,
    }
  }
}

/**
 * Split an AAX file into chapters
 */
export async function splitToChapters(options: ConversionOptions): Promise<ConversionResult> {
  const chaptersEnabled = true
  return convertAAX({ ...options, chaptersEnabled })
}
