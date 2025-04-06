export interface AAXConfig {
  verbose: boolean
  outputDir?: string
  outputFormat?: 'mp3' | 'm4a' | 'm4b'
  chaptersEnabled?: boolean
  bitrate?: number
  ffmpegPath?: string
  activationCode?: string
}

export interface ConversionOptions {
  inputFile: string
  outputDir?: string
  outputFormat?: 'mp3' | 'm4a' | 'm4b'
  activationCode?: string
  chaptersEnabled?: boolean
  bitrate?: number
}

export interface ConversionResult {
  success: boolean
  outputPath?: string
  error?: string
}

export interface BookMetadata {
  title?: string
  author?: string
  narrator?: string
  duration?: number
  chapters?: Chapter[]
}

export interface Chapter {
  title: string
  startTime: number
  endTime: number
}
