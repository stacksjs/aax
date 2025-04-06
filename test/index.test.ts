import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test'
import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { config } from '../src/config'
import { convertAAX, splitToChapters } from '../src/converter'

// Path to the test fixture
const FIXTURE_PATH = join(process.cwd(), 'test/fixtures/DesigningData-IntensiveApplicationsTheBigIdeasBehindReliableScalableandMaintainableSyst_ep7.aax')
const OUTPUT_DIR = join(process.cwd(), 'test/output')

// Mock the FFmpeg execution to avoid actual conversion during tests
const mockRunFFmpeg = mock(async () => {
  return {
    success: true,
    output: 'Mocked FFmpeg conversion',
    outputPath: join(OUTPUT_DIR, 'test-output.mp3'),
  }
})

// Mock metadata extraction
const mockGetMetadata = mock(() => {
  return {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    narrator: 'Some Narrator',
    duration: 12345,
    chapters: [
      { title: 'Chapter 1', startTime: 0, endTime: 100 },
      { title: 'Chapter 2', startTime: 101, endTime: 200 },
    ],
  }
})

describe('AAX Converter', () => {
  beforeAll(() => {
    // Override config for testing
    config.outputDir = OUTPUT_DIR
    config.activationCode = 'test-activation-code'

    // Apply mocks
    mock.module('../src/utils/ffmpeg', () => {
      return {
        checkFFmpeg: async () => true,
        runFFmpeg: mockRunFFmpeg,
      }
    })

    mock.module('../src/utils/metadata', () => {
      return {
        getBookMetadata: mockGetMetadata,
      }
    })
  })

  afterAll(() => {
    // Clean up any test output files
    const testOutputPath = join(OUTPUT_DIR, 'Designing_Data_Intensive_Applications.mp3')
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  it('should verify the fixture file exists', () => {
    expect(existsSync(FIXTURE_PATH)).toBe(true)
  })

  it('should convert AAX file to MP3', async () => {
    const result = await convertAAX({
      inputFile: FIXTURE_PATH,
      outputFormat: 'mp3',
      outputDir: OUTPUT_DIR,
    })

    expect(result.success).toBe(true)
    expect(mockRunFFmpeg).toHaveBeenCalled()
  })

  it('should handle chapter splitting', async () => {
    const result = await splitToChapters({
      inputFile: FIXTURE_PATH,
      outputFormat: 'mp3',
      outputDir: OUTPUT_DIR,
    })

    expect(result.success).toBe(true)
    expect(mockRunFFmpeg).toHaveBeenCalled()
  })

  it('should fail when input file does not exist', async () => {
    const result = await convertAAX({
      inputFile: 'non-existent-file.aax',
      outputDir: OUTPUT_DIR,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Input file does not exist')
  })
})
