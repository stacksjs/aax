# API Reference

AAX Audio Converter provides a TypeScript API for programmatic use in your applications.

## Installation

```bash
npm install @stacksjs/aax
```

## Basic Usage

```typescript
import { convertAAX } from '@stacksjs/aax'

async function convertBook() {
  const result = await convertAAX({
    inputFile: '/path/to/audiobook.aax',
    outputFormat: 'mp3',
    outputDir: './converted',
    chaptersEnabled: true,
    bitrate: 128,
  })

  if (result.success) {
    console.log(`Conversion complete: ${result.outputPath}`)
  }
  else {
    console.error(`Conversion failed: ${result.error}`)
  }
}
```

## API Types

### ConvertOptions

```typescript
interface ConvertOptions {
  /** Path to the input AAX file */
  inputFile: string
  /** Output format (mp3, m4a, m4b) */
  outputFormat?: 'mp3' | 'm4a' | 'm4b'
  /** Output directory path */
  outputDir?: string
  /** Whether to preserve chapters */
  chaptersEnabled?: boolean
  /** Audio bitrate in kbps */
  bitrate?: number
  /** Audible activation code */
  activationCode?: string
  /** Custom FFmpeg path */
  ffmpegPath?: string
  /** Enable verbose logging */
  verbose?: boolean
  /** Use flat folder structure */
  flatFolderStructure?: boolean
  /** Include series title in folder structure */
  seriesTitleInFolderStructure?: boolean
  /** Use full caption for book folder */
  fullCaptionForBookFolder?: boolean
  /** Prefix for part folders */
  partFolderPrefix?: string
  /** Number of digits for sequence numbers */
  sequenceNumberDigits?: number
  /** Custom search words for parts */
  customSearchWords?: string[]
  /** Additional punctuation for book titles */
  additionalPunctuation?: string
  /** Intermediate file copy for single file mode */
  intermediateFileCopy?: boolean
  /** Fix AAC encoding for 44.1 kHz */
  aacEncoding44_1?: boolean
  /** Apply variable bit rate */
  variableBitRate?: boolean
  /** Reduce bit rate */
  reduceBitRate?: 'no' | 'auto' | 'manual'
  /** File type for MP4 audio */
  fileType?: 'm4a' | 'm4b'
  /** Use ISO Latin1 encoding for m3u playlist */
  useISOLatin1?: boolean
  /** Extract cover image */
  extractCoverImage?: boolean
  /** Use named chapters if available */
  useNamedChapters?: boolean
  /** Skip short chapters between book parts */
  skipShortChaptersDuration?: number
  /** Skip very short chapters at begin and end */
  skipVeryShortChapterDuration?: number
  /** Verify and adjust chapter marks */
  verifyChapterMarks?: 'all' | 'none' | 'selected'
  /** Prefer embedded chapter times */
  preferEmbeddedChapterTimes?: boolean
}
```

### ConvertResult

```typescript
interface ConvertResult {
  /** Whether the conversion was successful */
  success: boolean
  /** Path to the converted file */
  outputPath?: string
  /** Error message if conversion failed */
  error?: string
}
```

## Functions

### convertAAX

Converts an AAX file to the specified format.

```typescript
async function convertAAX(options: ConvertOptions): Promise<ConvertResult>
```

### splitAAX

Splits an AAX file into individual chapter files.

```typescript
async function splitAAX(options: ConvertOptions): Promise<ConvertResult>
```

### getActivationBytes

Retrieves activation bytes from Audible CLI.

```typescript
async function getActivationBytes(): Promise<string>
```

## Configuration

You can create an `aax.config.ts` file to set default options:

```typescript
export default {
  verbose: true,
  outputFormat: 'mp3',
  outputDir: './my-audiobooks',
  chaptersEnabled: true,
  bitrate: 192,
  // Optional: manually set the activation code
  // activationCode: '1a2b3c4d',
  // Optional: specify a custom FFmpeg path
  // ffmpegPath: '/usr/local/bin/ffmpeg',
}
```

## Error Handling

The API uses TypeScript's error handling:

```typescript
try {
  const result = await convertAAX({
    inputFile: 'audiobook.aax',
  })

  if (!result.success) {
    throw new Error(result.error)
  }

  console.log('Conversion successful:', result.outputPath)
}
catch (error) {
  console.error('Conversion failed:', error)
}
```

## Examples

### Basic Conversion

```typescript
import { convertAAX } from '@stacksjs/aax'

const result = await convertAAX({
  inputFile: 'audiobook.aax',
  outputFormat: 'm4b',
  bitrate: 256,
})
```

### Split by Chapters

```typescript
import { splitAAX } from '@stacksjs/aax'

const result = await splitAAX({
  inputFile: 'audiobook.aax',
  outputFormat: 'mp3',
  outputDir: './chapters',
})
```

### Custom Configuration

```typescript
import { convertAAX } from '@stacksjs/aax'

const result = await convertAAX({
  inputFile: 'audiobook.aax',
  outputFormat: 'm4b',
  outputDir: './high-quality',
  bitrate: 320,
  chaptersEnabled: true,
  activationCode: '1a2b3c4d',
  ffmpegPath: '/custom/path/to/ffmpeg',
  verbose: true,
})
```

### Custom Folder Structure

```typescript
import { convertAAX } from '@stacksjs/aax'

const result = await convertAAX({
  inputFile: 'audiobook.aax',
  outputFormat: 'm4b',
  outputDir: './organized',
  flatFolderStructure: false,
  seriesTitleInFolderStructure: true,
})
```

### Advanced Conversion Settings

```typescript
import { convertAAX } from '@stacksjs/aax'

const result = await convertAAX({
  inputFile: 'audiobook.aax',
  variableBitRate: true,
  aacEncoding44_1: true,
})
```

::: tip
For the best experience, use TypeScript to get full type checking and autocompletion.
:::

::: warning
Make sure to handle errors appropriately in your application code.
:::
