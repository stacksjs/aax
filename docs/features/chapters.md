# Chapter Support

AAX Audio Converter preserves chapter information from your Audible audiobooks, making it easy to navigate through your converted files.

## Chapter Features

- Preserves all chapter markers and titles
- Maintains chapter metadata
- Supports chapter-based navigation in compatible players
- Enables chapter-based splitting

## Usage

Chapter support is enabled by default. You can control it using the `--chapters` option:

```bash
# Convert with chapter support (default)
aax convert audiobook.aax

# Disable chapter support
aax convert audiobook.aax --chapters=false
```

## Chapter Splitting

You can split your audiobook into individual chapter files:

```bash
# Split into individual chapter files
aax split audiobook.aax
```

This will create separate audio files for each chapter, named according to the chapter titles.

## Chapter Support by Format

| Format | Chapter Support | Notes |
|--------|----------------|-------|
| MP3    | Yes            | Uses ID3v2 tags for chapter markers |
| M4A    | No             | M4A format does not support chapters |
| M4B    | Yes            | Native chapter support, best for Apple devices |

::: tip
For the best chapter experience, use the M4B format as it provides native chapter support in Apple Books and iTunes.
:::

## Chapter Navigation

After conversion, you can navigate chapters in various ways:

- **Apple Books/iTunes**: Use the chapter navigation controls
- **MP3 Players**: Use the chapter navigation feature (if supported)
- **Media Players**: Use the chapter markers in the timeline

::: warning
Not all media players support chapter navigation. For the best experience, use a player that explicitly supports chapters, such as Apple Books or VLC.
:::
