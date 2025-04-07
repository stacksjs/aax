# Simple CLI

AAX Audio Converter provides a straightforward command-line interface that makes converting audiobooks quick and easy.

## Supported Platforms

The CLI is available for:

- macOS (Intel and Apple Silicon)
- Linux (x64 and ARM64)
- Windows (x64)

## Basic Usage

The simplest way to convert an audiobook:

```bash
aax convert audiobook.aax
```

This will:

- Convert the audiobook to MP3 format (default)
- Preserve chapter information
- Use auto-detected activation code
- Save to the default output directory

## Common Commands

### Convert with Options

```bash
# Specify output format
aax convert audiobook.aax --format m4b

# Set output directory
aax convert audiobook.aax --output ./my-audiobooks

# Set bitrate
aax convert audiobook.aax --bitrate 192

# Disable chapters
aax convert audiobook.aax --chapters=false
```

### Split by Chapters

```bash
# Split into individual chapter files
aax split audiobook.aax
```

### Setup Audible CLI

```bash
# Configure Audible CLI and get activation bytes
aax setup-audible
```

## Available Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--format` | `-f` | Output format (mp3, m4a, m4b) | mp3 |
| `--output` | `-o` | Output directory | ./converted |
| `--code` | `-c` | Audible activation code | auto-detected |
| `--chapters` | | Preserve chapter information | true |
| `--bitrate` | `-b` | Audio bitrate in kbps | 128 |
| `--verbose` | `-v` | Enable verbose logging | false |

## Examples

### Convert to M4B with High Quality

```bash
aax convert audiobook.aax --format m4b --bitrate 256 --output ./high-quality
```

### Split and Convert with Custom Options

```bash
aax split audiobook.aax --format mp3 --bitrate 192 --output ./chapters
```

### Quick Conversion with Verbose Logging

```bash
aax convert audiobook.aax -v
```

::: tip
You can combine multiple options in a single command for more control over the conversion process.
:::

::: warning
Make sure you have sufficient disk space for the converted files, especially when splitting by chapters.
:::
