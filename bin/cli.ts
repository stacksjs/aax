import { resolve } from 'node:path'
import process from 'node:process'
import { CAC } from 'cac'
import { version } from '../package.json'
import { config, convertAAX, isValidActivationCode, splitToChapters } from '../src'
import { getActivationBytesFromAudibleCli } from '../src/utils/activation'
import { logger } from '../src/utils/logger'

const cli = new CAC('aax')

interface ConvertOptions {
  output?: string
  format?: 'mp3' | 'm4a' | 'm4b'
  code?: string
  chapters?: boolean
  bitrate?: number
  verbose?: boolean
  flatFolderStructure?: boolean
  seriesTitleInFolderStructure?: boolean
  variableBitRate?: boolean
  aacEncoding44_1?: boolean
  useNamedChapters?: boolean
}

cli
  .command('convert <input>', 'Convert AAX audiobook to MP3/M4A/M4B format')
  .option('-o, --output <dir>', 'Output directory (default: ./converted)')
  .option('-f, --format <format>', 'Output format: mp3, m4a, m4b (default: mp3)')
  .option('-c, --code <code>', 'Audible activation code (will be auto-detected if not provided)')
  .option('--chapters', 'Preserve chapter information (default: true)')
  .option('-b, --bitrate <kbps>', 'Audio bitrate in kbps (default: 128)')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--flat-folder-structure', 'Use flat folder structure')
  .option('--series-title-in-folder-structure', 'Include series title in folder structure')
  .option('--variable-bit-rate', 'Apply variable bit rate')
  .option('--aac-encoding-44-1', 'Fix AAC encoding for 44.1 kHz')
  .option('--use-named-chapters', 'Use named chapters if available')
  .action(async (input: string, options: ConvertOptions = {}) => {
    // Set verbose mode
    if (options.verbose !== undefined) {
      config.verbose = options.verbose
    }

    // Validate activation code if provided
    if (options.code && !isValidActivationCode(options.code)) {
      logger.error('Invalid activation code format. Should be an 8-character hex string.')
      process.exit(1)
    }

    const result = await convertAAX({
      inputFile: resolve(input),
      outputDir: options.output || config.outputDir,
      outputFormat: options.format || config.outputFormat,
      activationCode: options.code || config.activationCode,
      chaptersEnabled: options.chapters ?? config.chaptersEnabled,
      bitrate: options.bitrate ? Number(options.bitrate) : config.bitrate,
      flatFolderStructure: options.flatFolderStructure ?? config.flatFolderStructure,
      seriesTitleInFolderStructure: options.seriesTitleInFolderStructure ?? config.seriesTitleInFolderStructure,
      variableBitRate: options.variableBitRate ?? config.variableBitRate,
      aacEncoding44_1: options.aacEncoding44_1 ?? config.aacEncoding44_1,
      useNamedChapters: options.useNamedChapters ?? config.useNamedChapters,
    })

    // The result is already displayed by the logger in converter.ts, so we don't need to do anything here
    if (!result.success) {
      process.exit(1)
    }
  })

cli
  .command('split <input>', 'Convert AAX audiobook and split by chapters')
  .option('-o, --output <dir>', 'Output directory (default: ./converted)')
  .option('-f, --format <format>', 'Output format: mp3, m4a, m4b (default: mp3)')
  .option('-c, --code <code>', 'Audible activation code (will be auto-detected if not provided)')
  .option('-b, --bitrate <kbps>', 'Audio bitrate in kbps (default: 128)')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (input: string, options: ConvertOptions = {}) => {
    // Set verbose mode
    if (options.verbose !== undefined) {
      config.verbose = options.verbose
    }

    // Validate activation code if provided
    if (options.code && !isValidActivationCode(options.code)) {
      logger.error('Invalid activation code format. Should be an 8-character hex string.')
      process.exit(1)
    }

    const result = await splitToChapters({
      inputFile: resolve(input),
      outputDir: options.output || config.outputDir,
      outputFormat: options.format || config.outputFormat,
      activationCode: options.code || config.activationCode,
      bitrate: options.bitrate ? Number(options.bitrate) : config.bitrate,
    })

    // The result is already displayed by the logger in converter.ts, so we don't need to do anything here
    if (!result.success) {
      process.exit(1)
    }
  })

// Add a new command to set up audible-cli and get activation bytes
cli
  .command('setup-audible', 'Set up the Audible CLI and retrieve activation bytes')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options: { verbose?: boolean } = {}) => {
    // Set verbose mode if requested
    if (options.verbose !== undefined) {
      config.verbose = options.verbose
    }

    await logger.box('Setting up Audible CLI')
    logger.info('You may be prompted to log in to your Audible account.')
    logger.info('Follow the prompts in the terminal to complete the setup.')

    const activationCode = getActivationBytesFromAudibleCli()

    if (activationCode) {
      logger.success(`Successfully retrieved activation bytes: ${activationCode.substring(0, 2)}******`)
      logger.info('\nYou can now use this activation code with the convert command:')
      logger.info(`aax convert your-audiobook.aax -c ${activationCode}`)

      // The activation code has been saved through the getActivationBytesFromAudibleCli function
      logger.info('The activation code has been saved and will be used automatically for future conversions.')
    }
    else {
      logger.error('Failed to retrieve activation bytes from Audible CLI.')
      logger.info('\nYou can try the manual setup process:')
      logger.info('1. Run: ./audible quickstart')
      logger.info('2. Follow the prompts to log in to your Audible account')
      logger.info('3. Once set up, run: ./audible activation-bytes')
      logger.info('4. Note the activation code (a 8-character hex string like "2c1eeb0a")')
      logger.info('5. Use the code with the convert command:')
      logger.info('   aax convert your-audiobook.aax -c YOUR_ACTIVATION_CODE')
    }
  })

cli.help()
cli.version(version)
cli.parse()
