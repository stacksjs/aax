# Configuration

You can configure the AAX converter using an `aax.config.ts` _(or `aax.config.js`)_ file in your project root.

```ts
// aax.config.{ts,js}
import type { AAXConfig } from '@stacksjs/aax'

const config: AAXConfig = {
  /**
   * Enable verbose logging
   * Default: true
   */
  verbose: true,

  /**
   * Output format for converted files
   * Default: 'mp3'
   * Options: 'mp3', 'm4a', 'm4b'
   */
  outputFormat: 'mp3',

  /**
   * Output directory for converted files
   * Default: './converted'
   */
  outputDir: './my-audiobooks',

  /**
   * Enable chapter preservation
   * Default: true
   */
  chaptersEnabled: true,

  /**
   * Audio bitrate in kbps
   * Default: 128
   */
  bitrate: 192,

  /**
   * Use flat folder structure
   * Default: false
   */
  flatFolderStructure: false,

  /**
   * Include series title in folder structure
   * Default: true
   */
  seriesTitleInFolderStructure: true,

  /**
   * Use full caption for book folder
   * Default: false
   */
  fullCaptionForBookFolder: false,

  /**
   * Prefix for part folders
   * Default: 'standard'
   */
  partFolderPrefix: 'standard',

  /**
   * Number of digits for sequence numbers
   * Default: 2
   */
  sequenceNumberDigits: 2,

  /**
   * Custom search words for parts
   * Default: []
   */
  customSearchWords: [],

  /**
   * Additional punctuation for book titles
   * Default: ''
   */
  additionalPunctuation: '',

  /**
   * Intermediate file copy for single file mode
   * Default: false
   */
  intermediateFileCopy: false,

  /**
   * Fix AAC encoding for 44.1 kHz
   * Default: false
   */
  aacEncoding44_1: false,

  /**
   * Apply variable bit rate
   * Default: false
   */
  variableBitRate: false,

  /**
   * Reduce bit rate
   * Default: 'no'
   * Options: 'no', 'auto', 'manual'
   */
  reduceBitRate: 'no',

  /**
   * File type for MP4 audio
   * Default: 'm4a'
   * Options: 'm4a', 'm4b'
   */
  fileType: 'm4a',

  /**
   * Use ISO Latin1 encoding for m3u playlist
   * Default: false
   */
  useISOLatin1: false,

  /**
   * Extract cover image
   * Default: true
   */
  extractCoverImage: true,

  /**
   * Use named chapters if available
   * Default: true
   */
  useNamedChapters: true,

  /**
   * Skip short chapters between book parts
   * Default: 25
   */
  skipShortChaptersDuration: 25,

  /**
   * Skip very short chapters at begin and end
   * Default: 10
   */
  skipVeryShortChapterDuration: 10,

  /**
   * Verify and adjust chapter marks
   * Default: 'all'
   * Options: 'all', 'none', 'selected'
   */
  verifyChapterMarks: 'all',

  /**
   * Prefer embedded chapter times
   * Default: true
   */
  preferEmbeddedChapterTimes: true,

  /**
   * Manually set the activation code
   * Default: auto-detected
   */
  // activationCode: '1a2b3c4d',

  /**
   * Specify a custom FFmpeg path
   * Default: uses system FFmpeg
   */
  // ffmpegPath: '/usr/local/bin/ffmpeg',
}

export default config
```

_Then run:_

```bash
aax convert your-audiobook.aax
```

To learn more, head over to the [documentation](https://github.com/stacksjs/aax).
