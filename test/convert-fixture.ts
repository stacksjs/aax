/**
 * Script to convert the test fixture AAX file
 * Run with: bun test/convert-fixture.ts
 */
import type { ConversionOptions } from '../src/types'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline'
import { convertAAX } from '../src/converter'
import {
  getActivationBytesFromAudibleCli,
  getActivationCodeForFile,
  isValidActivationCode,
  saveActivationCode,
} from '../src/utils/activation'

// Set up paths
const FIXTURE_PATH = join(process.cwd(), 'test/fixtures/DesigningData-IntensiveApplicationsTheBigIdeasBehindReliableScalableandMaintainableSyst_ep7.aax')
const OUTPUT_DIR = join(process.cwd(), 'test/output')

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  console.warn(`Creating output directory: ${OUTPUT_DIR}`)
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

/**
 * Prompt the user for an activation code if all automatic methods fail
 */
async function promptForActivationCode(): Promise<string> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    readline.question('Enter your Audible activation code (8-character hex): ', (answer) => {
      readline.close()
      resolve(answer.trim())
    })
  })
}

/**
 * Get a valid activation code through various methods
 */
async function getActivationCode(): Promise<string> {
  console.warn('🔑 Attempting to automatically find activation code...')

  // First try to use the Audible CLI integration
  console.warn('Checking for Audible CLI in project root...')
  const audibleCliCode = getActivationBytesFromAudibleCli()
  if (audibleCliCode) {
    console.warn(`✅ Found activation code from Audible CLI: ${audibleCliCode.substring(0, 2)}******`)
    saveActivationCode(audibleCliCode)
    return audibleCliCode
  }

  // Then try automatic extraction methods
  const autoCode = await getActivationCodeForFile(FIXTURE_PATH)
  if (autoCode) {
    saveActivationCode(autoCode)
    return autoCode
  }

  // If automatic methods failed, guide the user
  console.warn('\nCould not automatically determine activation code.')
  console.warn('To get your activation code, you can:')
  console.warn('1. Download and set up the Audible CLI tool:')
  console.warn('   - Download from: \x1B[34m\x1B[4mhttps://github.com/mkb79/audible-cli/releases\x1B[0m')
  console.warn('   - Rename it to "audible" and place it in the project root')
  console.warn('   - Run: ./audible quickstart')
  console.warn('   - Then run: ./audible activation-bytes')
  console.warn('2. Use the online Audible Activation Code Finder service:')
  console.warn('   \x1B[34m\x1B[4mhttps://audible-converter.ml\x1B[0m')
  console.warn('3. Check in these locations on your computer:')

  if (process.platform === 'win32') {
    console.warn('   - %APPDATA%\\Roaming\\Audible\\system.cfg')
    console.warn('   - %LOCALAPPDATA%\\Audible\\system.cfg')
  }
  else if (process.platform === 'darwin') {
    console.warn('   - ~/Library/Application Support/Audible/system.cfg')
    console.warn('   - ~/Library/Preferences/com.audible.application')
  }
  else {
    console.warn('   - ~/.config/audible/system.cfg')
  }

  console.warn('   Look for a line containing "activation_bytes" in these files')

  // If all automatic methods fail, prompt the user
  console.warn('\nNo valid activation code found automatically.')
  console.warn('An activation code is required to convert AAX files.')
  console.warn('Please visit \x1B[34m\x1B[4mhttps://audible-converter.ml\x1B[0m to get your activation code')
  console.warn('Or follow one of the methods mentioned above\n')

  // Prompt until we get a valid code
  let activationCode = ''
  let isValid = false
  while (!isValid) {
    activationCode = await promptForActivationCode()
    isValid = isValidActivationCode(activationCode)

    if (!isValid) {
      console.warn('Invalid activation code format. Must be an 8-character hex string.')
    }
  }

  // Save the manually entered code
  saveActivationCode(activationCode)
  return activationCode
}

async function main() {
  console.warn(`Starting conversion of fixture file...`)
  console.warn(`Input: ${FIXTURE_PATH}`)
  console.warn(`Output directory: ${OUTPUT_DIR}`)

  // Check if input file exists
  if (!existsSync(FIXTURE_PATH)) {
    console.error(`❌ Input file does not exist: ${FIXTURE_PATH}`)
    process.exit(1)
  }

  try {
    // Get activation code
    const activationCode = await getActivationCode()

    // Configure conversion options
    const options: ConversionOptions = {
      inputFile: FIXTURE_PATH,
      outputDir: OUTPUT_DIR,
      outputFormat: 'mp3' as const,
      activationCode,
      bitrate: 128,
      chaptersEnabled: true,
    }

    console.warn(`Output format: ${options.outputFormat}`)
    console.warn(`Using activation code: ${activationCode.substring(0, 2)}******`)

    const result = await convertAAX(options)

    if (result.success) {
      console.warn(`✅ Conversion successful!`)
      console.warn(`Output file: ${result.outputPath}`)
    }
    else {
      console.error(`❌ Conversion failed: ${result.error}`)
      process.exit(1)
    }
  }
  catch (error: unknown) {
    console.error(`❌ Unhandled error during conversion:`, error)
    process.exit(1)
  }
}

main()
