# Multiple Formats

AAX Audio Converter supports converting your Audible audiobooks to multiple standard audio formats:

## File Size Considerations

The size of your converted audiobook will depend on:

- Original audiobook length
- Chosen bitrate (default: 128kbps)
- Output format
- Chapter preservation

As a general guideline:

- A 10-hour audiobook at 128kbps MP3 ≈ 550MB
- Same audiobook in M4B format ≈ 650MB
- Same audiobook at 256kbps ≈ 1.1GB

## Supported Formats

### MP3

- Most widely compatible format
- Works with virtually all media players and devices
- Good balance of quality and file size
- Default format if none specified

### M4A

- Apple's standard audio format
- Better quality than MP3 at the same bitrate
- Native support on Apple devices
- Smaller file size than M4B

### M4B

- Apple's audiobook format
- Includes chapter markers and metadata
- Native support on Apple devices
- Perfect for Apple Books and iTunes

## Usage

You can specify the output format using the `--format` or `-f` option:

```bash
# Convert to MP3 (default)
aax convert audiobook.aax

# Convert to M4A
aax convert audiobook.aax --format m4a

# Convert to M4B
aax convert audiobook.aax --format m4b
```

## Format Comparison

| Format | Quality | File Size | Chapter Support | Device Compatibility |
|--------|---------|-----------|-----------------|----------------------|
| MP3    | Good    | Medium    | Yes             | Excellent            |
| M4A    | Better  | Small     | No              | Good                 |
| M4B    | Best    | Large     | Yes             | Good                 |

::: tip
For the best experience on Apple devices, we recommend using M4B format as it provides the best integration with Apple Books and iTunes.
:::
