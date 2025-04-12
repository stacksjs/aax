import type { BookMetadata, Chapter } from '../types'
import { extractAAXMetadata } from './ffmpeg'

/**
 * Parse FFmpeg metadata output to extract book metadata
 */
export function parseMetadata(metadataText: string): Partial<BookMetadata> {
  const metadata: Partial<BookMetadata> = {}
  const lines = metadataText.split('\n')

  for (const line of lines) {
    if (line.startsWith('title=')) {
      metadata.title = line.substring(6).trim()
    }
    else if (line.startsWith('artist=')) {
      metadata.author = line.substring(7).trim()
    }
    else if (line.startsWith('album_artist=')) {
      metadata.narrator = line.substring(13).trim()
    }
  }

  return metadata
}

/**
 * Extract chapter information from metadata
 */
export function extractChapters(metadataText: string): Chapter[] {
  const chapters: Chapter[] = []
  const lines = metadataText.split('\n')
  let inChapter = false
  let currentChapter: Partial<Chapter> = {}

  for (const line of lines) {
    if (line === '[CHAPTER]') {
      inChapter = true
      currentChapter = {}
    }
    else if (line === '[/CHAPTER]') {
      inChapter = false
      if (currentChapter.title
        && currentChapter.startTime !== undefined
        && currentChapter.endTime !== undefined) {
        chapters.push(currentChapter as Chapter)
      }
    }
    else if (inChapter) {
      if (line.startsWith('TITLE=')) {
        currentChapter.title = line.substring(6).trim()
      }
      else if (line.startsWith('START=')) {
        currentChapter.startTime = Number.parseFloat(line.substring(6)) / 1000 // Convert to seconds
      }
      else if (line.startsWith('END=')) {
        currentChapter.endTime = Number.parseFloat(line.substring(4)) / 1000 // Convert to seconds
      }
    }
  }

  return chapters
}

/**
 * Extract all metadata from an AAX file
 * @param filePath Path to the AAX file
 * @param existingMetadata Optional pre-extracted metadata text to prevent duplicate extraction
 */
export async function getBookMetadata(filePath: string, existingMetadata?: string): Promise<BookMetadata> {
  const metadataText = existingMetadata || await extractAAXMetadata(filePath)
  const basicMetadata = parseMetadata(metadataText)
  const chapters = extractChapters(metadataText)

  return {
    ...basicMetadata,
    chapters,
  }
}
