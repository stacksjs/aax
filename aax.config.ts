import type { AAXConfig } from './src/types'

const config: AAXConfig = {
  verbose: false,
  outputFormat: 'mp3',
  outputDir: './converted',
  chaptersEnabled: true,
  bitrate: 128,

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

export default config
