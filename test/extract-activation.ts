#!/usr/bin/env bun
/**
 * This is a test script to extract activation codes from AAX files.
 * It tries multiple formats and approaches to find the right code.
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { extractAaxChecksum, extractActivationFromFile } from '../src/utils/activation'

// Get AAX file path from command line argument or use mock file
const aaxFilePath = process.argv[2] || path.join(process.cwd(), 'test/fixtures/mock.aax')

if (!existsSync(aaxFilePath)) {
  console.error('Please provide a valid AAX file path')
  process.exit(1)
}

console.warn(`\n🔍 Testing activation code extraction for: ${path.basename(aaxFilePath)}`)

// Extract checksum
const checksum = extractAaxChecksum(aaxFilePath)
if (checksum) {
  console.warn(`\n✅ Extracted checksum: ${checksum}`)
  console.warn(`   First 8 chars: ${checksum.substring(0, 8)}`)
  console.warn(`   First 8 chars (uppercase): ${checksum.substring(0, 8).toUpperCase()}`)
}

// Try all known codes using our brute-force method
console.warn('\n🔄 Testing all known activation codes...')
const activationCode = extractActivationFromFile(aaxFilePath)

if (activationCode) {
  console.warn(`\n🎉 Found working activation code: ${activationCode}`)

  // Verify with a simple FFmpeg command
  try {
    console.warn('\n🔍 Verifying code with FFmpeg...')
    const cmd = `ffmpeg -activation_bytes ${activationCode} -i "${aaxFilePath}" -f null -t 1 -`
    execSync(cmd, { stdio: 'inherit' })
    console.warn('\n✅ Activation code verified successfully!')
  }
  catch (error) {
    console.error('\n❌ Verification failed:', error)
  }
}
else {
  console.warn('\n❌ No working activation code found')

  // Try some hardcoded codes as a last resort
  const lastResortCodes = [
    '1CEB00DA',
    '4F087621',
    '7B95D5DA',
    'A9EDBB73',
    '9A1DC7AE',
    checksum?.substring(0, 8) || '',
    checksum?.substring(0, 8).toUpperCase() || '',
  ]

  console.warn('\n🔄 Trying last resort codes with direct FFmpeg test:')

  for (const code of lastResortCodes) {
    if (!code)
      continue

    try {
      console.warn(`\nTesting code: ${code}`)
      const cmd = `ffmpeg -activation_bytes ${code} -i "${aaxFilePath}" -f null -t 1 -`
      execSync(cmd, { stdio: 'inherit' })
      console.warn(`\n✅ Success with code: ${code}`)
      process.exit(0)
    }
    catch {
      console.warn(`❌ Code ${code} failed`)
    }
  }
}
