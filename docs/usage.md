# Usage

There are two ways of using this AAX converter: _as a library or as a CLI._

## Library

Given the npm package is installed:

```ts
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

## CLI

### Basic Usage

```bash
# Convert an AAX file to MP3
aax convert your-audiobook.aax

# Convert with custom options
aax convert your-audiobook.aax --format m4b --output ./my-audiobooks --bitrate 192

# Convert and split by chapters
aax split your-audiobook.aax
```

### Available Options

- `-o, --output <dir>` - Output directory (default: ./converted)
- `-f, --format <format>` - Output format: mp3, m4a, m4b (default: mp3)
- `-c, --code <code>` - Audible activation code (auto-detected if not provided)
- `--chapters` - Preserve chapter information (default: true)
- `-b, --bitrate <kbps>` - Audio bitrate in kbps (default: 128)
- `-v, --verbose` - Enable verbose logging

### Setting up Audible CLI

```bash
# Run the setup command
aax setup-audible

# This will:
# 1. Check if the audible binary exists
# 2. Make it executable
# 3. Run the quickstart wizard
# 4. Retrieve your activation bytes
# 5. Save them for future use
```

## Testing

```bash
bun test
```
