import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { config } from '../config'

/**
 * Checks if FFmpeg is installed and available
 */
export async function checkFFmpeg(): Promise<boolean> {
  const ffmpegPath = config.ffmpegPath || 'ffmpeg'

  try {
    if (config.ffmpegPath && !existsSync(config.ffmpegPath)) {
      return false
    }

    const process = spawn(ffmpegPath, ['-version'])

    return new Promise((resolve) => {
      process.on('close', (code) => {
        resolve(code === 0)
      })
    })
  }
  catch {
    return false
  }
}

/**
 * Runs an FFmpeg command with the given arguments
 */
export async function runFFmpeg(args: string[]): Promise<{ success: boolean, output: string }> {
  const ffmpegPath = config.ffmpegPath || 'ffmpeg'
  let outputData = ''

  try {
    const process = spawn(ffmpegPath, args)

    process.stdout.on('data', (data) => {
      outputData += data.toString()
    })

    process.stderr.on('data', (data) => {
      outputData += data.toString()
      if (config.verbose) {
        console.error(data.toString())
      }
    })

    return new Promise((resolve) => {
      process.on('close', (code) => {
        resolve({
          success: code === 0,
          output: outputData,
        })
      })
    })
  }
  catch (error) {
    return {
      success: false,
      output: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Extracts metadata from an AAX file using FFmpeg
 */
export async function extractAAXMetadata(filePath: string): Promise<string> {
  const args = [
    '-i',
    filePath,
    '-f',
    'ffmetadata',
  ]

  const { success, output } = await runFFmpeg(args)
  return success ? output : ''
}
