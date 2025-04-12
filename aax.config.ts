import type { AAXConfig } from './src/types'

const config: AAXConfig = {
  verbose: false,
  outputFormat: 'm4b',
  outputDir: './converted',
  chaptersEnabled: true,
  bitrate: 'source',

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
  aacEncoding44_1: true,
  variableBitRate: true,
  reduceBitRate: 'no',
  fileType: 'm4b',
  useISOLatin1: false,
  extractCoverImage: true,

  // Chapter settings
  useNamedChapters: true,
  verifyChapterMarks: 'all',
  preferEmbeddedChapterTimes: true,
}

export default config
