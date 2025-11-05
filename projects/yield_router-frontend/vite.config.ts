import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      // These are needed for the algosdk to work with Vite
      'algosdk': 'algosdk',
      'algosdk/client': 'algosdk/dist/cjs/client/client.js',
      'algosdk/dist/types/client/urlTokenBaseHTTPClient': 'algosdk/dist/types/client/urlTokenBaseHTTPClient.d.ts',
      'algosdk/dist/types/client/client': 'algosdk/dist/types/client/client.d.ts',
    },
  },
  optimizeDeps: {
    include: ['algosdk'],
    esbuildOptions: {
      target: 'esnext',
      supported: { 
        bigint: true 
      },
    },
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      include: [/algosdk/, /node_modules/],
    },
  },
})
