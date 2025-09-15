import type { ConversionOptions, ConversionResult } from './types'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { config } from './config'
import { getActivationBytesFromAudibleCli } from './utils/activation'
import { checkFFmpeg, runFFmpeg } from './utils/ffmpeg'
import { logger, reportError } from './utils/logger'
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
  if (!options.inputFile) {
    logger.error('No input file provided. Please specify an AAX file to convert.')
    return {
      success: false,
      error: 'No input file provided',
    }
  }

  if (!existsSync(options.inputFile)) {
    logger.error(`Input file does not exist: ${options.inputFile}`)
    return {
      success: false,
      error: `Input file does not exist: ${options.inputFile}`,
    }
  }

  // Check for ffmpeg
  const ffmpegAvailable = await checkFFmpeg()
  if (!ffmpegAvailable) {
    reportError(new Error('FFmpeg is not available'), {
      heading: 'FFmpeg not found. Required for conversion.',
      details: 'The converter requires FFmpeg to decrypt and transcode AAX files.',
      hints: [
        'Install on macOS: brew install ffmpeg',
        'Install on Linux: use your package manager (e.g., apt install ffmpeg)',
        'Install on Windows: https://ffmpeg.org/download.html',
        'Alternatively set ffmpegPath in aax.config.ts to your ffmpeg binary',
      ],
    })
    return {
      success: false,
      error: 'FFmpeg not found. Required for conversion.',
    }
  }
  logger.info('Checking FFmpeg installation...')

  // Get activation code
  const activationCode = options.activationCode || config.activationCode || await getActivationBytesFromAudibleCli()

  if (!activationCode) {
    reportError(new Error('Missing activation code'), {
      heading: 'No activation code provided for decryption.',
      details: 'Audible AAX files require an 8-character activation code (activation bytes) to decrypt.',
      hints: [
        'Provide activationCode in options or in aax.config.ts',
        'Use Audible CLI to fetch: audible activation-bytes (run audible quickstart first)',
        'Try environment overrides and run again with AAX_LOG_LEVEL=debug for more output',
      ],
    })
    return {
      success: false,
      error: 'No activation code provided. This is required to convert AAX files.',
    }
  }

  logger.info(`Using activation code: ${activationCode.substring(0, 2)}******`)

  try {
    // Get book metadata
    logger.info('Retrieving audiobook metadata...')

    // Get metadata (use getBookMetadata which will internally call extractAAXMetadata)
    const metadata = await getBookMetadata(options.inputFile)
    const outputPath = generateOutputPath(metadata, options)

    // Log book info
    if (metadata.title) {
      logger.info(`Title: ${metadata.title}`)
    }
    if (metadata.author) {
      logger.info(`Author: ${metadata.author}`)
    }
    if (metadata.narrator) {
      logger.info(`Narrator: ${metadata.narrator}`)
    }
    if (metadata.duration) {
      const hours = Math.floor(metadata.duration / 3600)
      const minutes = Math.floor((metadata.duration % 3600) / 60)
      const seconds = Math.floor(metadata.duration % 60)
      logger.info(`Duration: ${hours}h ${minutes}m ${seconds}s`)
    }
    if (metadata.chapters?.length) {
      logger.info(`Chapters: ${metadata.chapters.length}`)
    }

    // Avoid duplicate logs by using logger.debug for detailed path info
    logger.info(`Output format: ${options.outputFormat || config.outputFormat || 'mp3'}`)

    // Only log the base output path once, more detailed path info in debug
    const shortPath = path.basename(outputPath)
    logger.info(`Output path: ${shortPath}`)
    logger.debug(`Full output path: ${outputPath}`)

    // Build FFmpeg command
    logger.info('Preparing FFmpeg command...')
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
      logger.debug(`FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`)
    }

    // Run FFmpeg
    logger.info('Starting conversion...')
    const { success, output } = await runFFmpeg(ffmpegArgs)

    if (success) {
      logger.success(`Conversion completed! Output saved to: ${outputPath}`)
      return {
        success: true,
        outputPath,
      }
    }
    else {
      // Try with lowercase activation code
      logger.warn('First conversion attempt failed, trying with lowercase activation code...')
      ffmpegArgs[1] = activationCode.toLowerCase()

      if (config.verbose) {
        logger.debug(`FFmpeg command (with lowercase code): ffmpeg ${ffmpegArgs.join(' ')}`)
      }

      const retryResult = await runFFmpeg(ffmpegArgs)

      if (retryResult.success) {
        logger.success(`Conversion completed! Output saved to: ${outputPath}`)
        return {
          success: true,
          outputPath,
        }
      }

      reportError(new Error('Conversion failed'), {
        heading: 'Conversion failed.',
        details: 'FFmpeg returned a non-zero exit code.',
        hints: [
          'Verify the activation code is correct (case sensitive)',
          'Try running with AAX_LOG_LEVEL=debug to see the FFmpeg command and output',
          'Ensure input file is a valid AAX and not corrupted',
        ],
      })
      return {
        success: false,
        error: `FFmpeg conversion failed: ${output}`,
      }
    }
  }
  catch (error) {
    reportError(error, {
      heading: 'Unexpected error during conversion.',
      hints: [
        'Re-run with AAX_LOG_LEVEL=debug to include stack traces',
      ],
    })
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
  logger.info('Converting and splitting audiobook by chapters...')
  const chaptersEnabled = true
  return convertAAX({ ...options, chaptersEnabled })
}
