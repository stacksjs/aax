import type { ConversionOptions, ConversionResult, FileNaming } from './types'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { config } from './config'
import { checkFFmpeg, runFFmpeg } from './utils/ffmpeg'
import { getBookMetadata } from './utils/metadata'

function generateOutputPath(metadata: any, options: ConversionOptions): string {
  const outputDir = options.outputDir || config.outputDir || '.'
  const outputFormat = options.outputFormat || config.outputFormat || 'mp3'

  let basePath = outputDir

  // Handle folder structure
  if (!options.flatFolderStructure) {
    if (metadata.author) {
      basePath = path.join(basePath, metadata.author)
    }

    if (options.seriesTitleInFolderStructure && metadata.series) {
      basePath = path.join(basePath, metadata.series)
    }

    const bookFolder = options.fullCaptionForBookFolder
      ? metadata.title
      : metadata.title?.split(':')[0]

    if (bookFolder) {
      basePath = path.join(basePath, bookFolder)
    }
  }

  // Create output directory structure
  mkdirSync(basePath, { recursive: true })

  // Generate filename
  let filename = metadata.title || path.basename(options.inputFile, path.extname(options.inputFile))

  // Add part number if available
  if (metadata.seriesIndex && options.sequenceNumberDigits) {
    const partNum = String(metadata.seriesIndex).padStart(options.sequenceNumberDigits, '0')
    filename = `${options.partFolderPrefix || ''}${partNum} - ${filename}`
  }

  return path.join(basePath, `${filename}.${outputFormat}`)
}

/**
 * Convert an AAX file to the specified format
 */
export async function convertAAX(options: ConversionOptions): Promise<ConversionResult> {
  // Validate input file
  if (!existsSync(options.inputFile)) {
    return {
      success: false,
      error: `Input file does not exist: ${options.inputFile}`,
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
  const activationCode = options.activationCode || config.activationCode
  if (!activationCode) {
    return {
      success: false,
      error: 'No activation code provided. This is required to convert AAX files.',
    }
  }

  console.warn(`Using activation code: ${activationCode.substring(0, 2)}******`)

  try {
    // Get book metadata
    const metadata = await getBookMetadata(options.inputFile)
    const outputPath = generateOutputPath(metadata, options)

    // Build FFmpeg command
    const ffmpegArgs: string[] = []

    // Input file
    ffmpegArgs.push('-activation_bytes', activationCode)
    ffmpegArgs.push('-i', options.inputFile)

    // Audio stream selection
    ffmpegArgs.push('-map', '0:0')

    // Audio quality settings
    if (options.variableBitRate) {
      ffmpegArgs.push('-q:a', '0')
    }
    else {
      const bitrate = options.bitrate || config.bitrate || 64
      ffmpegArgs.push('-ab', `${bitrate}k`)
    }

    // Metadata
    ffmpegArgs.push('-map_metadata', '0')

    // Handle chapters
    if (options.chaptersEnabled) {
      if (options.useNamedChapters) {
        ffmpegArgs.push('-map_chapters', '0')
      }

      if (options.skipShortChaptersDuration) {
        ffmpegArgs.push('-chapter_skip_short', options.skipShortChaptersDuration.toString())
      }

      if (options.skipVeryShortChapterDuration) {
        ffmpegArgs.push('-chapter_skip_very_short', options.skipVeryShortChapterDuration.toString())
      }
    }

    // Format specific settings
    const outputFormat = options.outputFormat || config.outputFormat || 'mp3'
    if (outputFormat === 'mp3') {
      ffmpegArgs.push('-codec:a', 'libmp3lame')
      ffmpegArgs.push('-write_xing', '0')
      ffmpegArgs.push('-id3v2_version', '3')

      if (options.useISOLatin1) {
        ffmpegArgs.push('-id3v2_version', '3')
        ffmpegArgs.push('-metadata_header_padding', '0')
        ffmpegArgs.push('-write_id3v1', '1')
      }
    }
    else if (outputFormat === 'm4a' || outputFormat === 'm4b') {
      ffmpegArgs.push('-codec:a', 'aac')
      ffmpegArgs.push('-f', 'mp4')
      ffmpegArgs.push('-movflags', '+faststart')
      ffmpegArgs.push('-metadata:s:a:0', 'handler=Sound')

      if (options.aacEncoding44_1) {
        ffmpegArgs.push('-ar', '44100')
      }
    }

    // Extract cover image if requested
    if (options.extractCoverImage) {
      const coverPath = path.join(path.dirname(outputPath), 'cover.jpg')
      ffmpegArgs.push('-map', '0:v')
      ffmpegArgs.push('-c:v', 'copy')
      ffmpegArgs.push(coverPath)
    }

    // Output file
    ffmpegArgs.push('-y')
    ffmpegArgs.push(outputPath)

    // Log command for debugging
    if (config.verbose) {
      console.warn(`FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`)
    }

    // Run FFmpeg
    const { success, output } = await runFFmpeg(ffmpegArgs)

    if (success) {
      return {
        success: true,
        outputPath,
      }
    }
    else {
      // Try with lowercase activation code
      console.warn('First conversion attempt failed, trying with lowercase activation code...')
      ffmpegArgs[1] = activationCode.toLowerCase()

      if (config.verbose) {
        console.warn(`FFmpeg command (with lowercase code): ffmpeg ${ffmpegArgs.join(' ')}`)
      }

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
