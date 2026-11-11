import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'nivisio.jadoo',
  appName: 'nivisio',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffb3c1',
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
