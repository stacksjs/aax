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
