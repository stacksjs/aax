import { resolve } from 'node:path'
import process from 'node:process'
import { CAC } from 'cac'
import { version } from '../package.json'
import { config, convertAAX, isValidActivationCode, splitToChapters } from '../src'
import { getActivationBytesFromAudibleCli } from '../src/utils/activation'

const cli = new CAC('aax')

interface ConvertOptions {
  output?: string
  format?: 'mp3' | 'm4a' | 'm4b'
  code?: string
  chapters?: boolean
  bitrate?: number
  verbose?: boolean
}

cli
  .command('convert <input>', 'Convert AAX audiobook to MP3/M4A/M4B format')
  .option('-o, --output <dir>', 'Output directory (default: ./converted)')
  .option('-f, --format <format>', 'Output format: mp3, m4a, m4b (default: mp3)')
  .option('-c, --code <code>', 'Audible activation code (will be auto-detected if not provided)')
  .option('--chapters', 'Preserve chapter information (default: true)')
  .option('-b, --bitrate <kbps>', 'Audio bitrate in kbps (default: 128)')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (input: string, options: ConvertOptions = {}) => {
    // Set verbose mode
    if (options.verbose !== undefined) {
      config.verbose = options.verbose
    }

    // Validate activation code if provided
    if (options.code && !isValidActivationCode(options.code)) {
      console.error('Error: Invalid activation code format. Should be an 8-character hex string.')
      process.exit(1)
    }

    const result = await convertAAX({
      inputFile: resolve(input),
      outputDir: options.output || config.outputDir,
      outputFormat: options.format || config.outputFormat,
      activationCode: options.code || config.activationCode,
      chaptersEnabled: options.chapters ?? config.chaptersEnabled,
      bitrate: options.bitrate ? Number(options.bitrate) : config.bitrate,
    })

    if (result.success) {
      console.log(`✅ Conversion completed successfully!`)
      console.log(`Output: ${result.outputPath}`)
    }
    else {
      console.error(`❌ Conversion failed: ${result.error}`)
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
      console.error('Error: Invalid activation code format. Should be an 8-character hex string.')
      process.exit(1)
    }

    const result = await splitToChapters({
      inputFile: resolve(input),
      outputDir: options.output || config.outputDir,
      outputFormat: options.format || config.outputFormat,
      activationCode: options.code || config.activationCode,
      bitrate: options.bitrate ? Number(options.bitrate) : config.bitrate,
    })

    if (result.success) {
      console.log(`✅ Conversion and chapter splitting completed successfully!`)
      console.log(`Output: ${result.outputPath}`)
    }
    else {
      console.error(`❌ Conversion failed: ${result.error}`)
      process.exit(1)
    }
  })

// Add a new command to set up audible-cli and get activation bytes
cli
  .command('setup-audible', 'Set up the Audible CLI and retrieve activation bytes')
  .option('-v, --verbose', 'Enable verbose logging')
  .action((options: { verbose?: boolean } = {}) => {
    // Set verbose mode if requested
    if (options.verbose !== undefined) {
      config.verbose = options.verbose
    }

    console.log('Setting up Audible CLI and retrieving activation bytes...')
    console.log('Note: You may be prompted to log in to your Audible account.')
    console.log('Follow the prompts in the terminal to complete the setup.\n')

    const activationCode = getActivationBytesFromAudibleCli()

    if (activationCode) {
      console.log(`\n✅ Successfully retrieved activation bytes: ${activationCode.substring(0, 2)}******`)
      console.log('\nYou can now use this activation code with the convert command:')
      console.log(`aax convert your-audiobook.aax -c ${activationCode}`)

      // The activation code has been saved through the getActivationBytesFromAudibleCli function
      console.log('\nThe activation code has been saved and will be used automatically for future conversions.')
    }
    else {
      console.error('\n❌ Failed to retrieve activation bytes from Audible CLI.')
      console.log('\nYou can try the manual setup process:')
      console.log('1. Run: ./audible quickstart')
      console.log('2. Follow the prompts to log in to your Audible account')
      console.log('3. Once set up, run: ./audible activation-bytes')
      console.log('4. Note the activation code (a 8-character hex string like "2c1eeb0a")')
      console.log('5. Use the code with the convert command:')
      console.log('   aax convert your-audiobook.aax -c YOUR_ACTIVATION_CODE')
    }
  })

cli.help()
cli.version(version)
cli.parse()
