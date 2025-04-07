/**
 * Script to convert the test fixture AAX file
 * Run with: bun test/convert-fixture.ts
 */
import type { ConversionOptions } from '../src/types'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { convertAAX } from '../src/converter'
import {
  getActivationBytesFromAudibleCli,
  getActivationCodeForFile,
  saveActivationCode,
} from '../src/utils/activation'

// Set up paths
const FIXTURE_PATH = join(process.cwd(), 'test/fixtures/mock.aax')
const OUTPUT_DIR = join(process.cwd(), 'test/output')

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  console.warn(`Creating output directory: ${OUTPUT_DIR}`)
  mkdirSync(OUTPUT_DIR, { recursive: true })
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

  // For testing purposes, return a mock activation code
  return 'TEST1234'
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
