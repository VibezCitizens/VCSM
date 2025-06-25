import { defineConfig } from 'unocss'
import { presetWind3 } from '@unocss/preset-wind3'

export default defineConfig({
  presets: [presetWind3()],
  shortcuts: {
    'input-base':
      'w-full px-4 py-2 bg-neutral-800 text-white placeholder:text-neutral-400 border border-neutral-700 rounded-lg focus:outline-none focus:border-purple-500 transition-all duration-150',
  },
})
