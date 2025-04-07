import type { AAXConfig } from './types'
import { loadConfig } from 'bunfig'
import { findActivationCode } from './utils/activation'

export const defaultConfig: AAXConfig = {
  verbose: true,
  outputFormat: 'mp3',
  outputDir: './converted',
  chaptersEnabled: true,
  bitrate: 128,
  activationCode: findActivationCode() || undefined,

  // Folder structure defaults
  flatFolderStructure: false,
  seriesTitleInFolderStructure: true,
  fullCaptionForBookFolder: false,
  partFolderPrefix: 'standard',
  sequenceNumberDigits: 2,

  // Conversion defaults
  customSearchWords: [],
  additionalPunctuation: '',
  intermediateFileCopy: false,
  aacEncoding44_1: false,
  variableBitRate: false,
  reduceBitRate: 'no',
  fileType: 'm4a',
  useISOLatin1: false,
  extractCoverImage: true,

  // Chapter settings
  useNamedChapters: true,
  skipShortChaptersDuration: 25,
  skipVeryShortChapterDuration: 10,
  verifyChapterMarks: 'all',
  preferEmbeddedChapterTimes: true,
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: AAXConfig = await loadConfig({
  name: 'aax',
  defaultConfig,
})
