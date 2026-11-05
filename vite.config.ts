/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          antd: ['antd', '@ant-design/icons', '@ant-design/cssinjs', 'dayjs'],
          vendor: [
            'react',
            'react-dom',
            'react-router',
            '@reduxjs/toolkit',
            'react-redux',
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            '@tanstack/react-virtual',
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
            'date-fns',
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 15000,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Only the token file is read (as raw text) by tokens.test.ts; other CSS stays stubbed.
    css: { include: [/theme\.css/] },
  },
})
