import type { AAXConfig } from './types'
import { loadConfig } from 'bunfig'
import { findActivationCode } from './utils/activation'

export const defaultConfig: AAXConfig = {
  verbose: true,
  outputFormat: 'mp3',
  outputDir: './converted',
  chaptersEnabled: true,
  bitrate: 128,
  activationCode: findActivationCode() || undefined,
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: AAXConfig = await loadConfig({
  name: 'aax',
  defaultConfig,
})
