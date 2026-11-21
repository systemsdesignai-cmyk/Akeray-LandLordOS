import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({ command, isPreview }) => {
  const base =
    process.env.VITE_BASE_PATH ??
    (command === 'build' || isPreview ? '/Akeray-LandLordOS/' : '/');

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        scope: base,
        includeAssets: [
          'akarai-icon-32.png',
          'akarai-icon-48.png',
          'akarai-icon-180.png',
          'akarai-icon-192.png',
          'akarai-icon-512.png',
          'akarai-icon-1024.png',
          'akarai-maskable-192.png',
          'akarai-maskable-512.png',
          'akarai-logo-vertical.png',
          'akarai-logo-horizontal.png',
          'akarai-symbol.png',
          'apple-touch-icon.png',
          'favicon-32x32.png',
        ],
        manifest: {
          id: base,
          name: 'Akarai',
          short_name: 'Akarai',
          description: 'Property & Rent Management',
          theme_color: '#0145F2',
          background_color: '#FFFFFF',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {
              src: `${base}akarai-icon-192.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${base}akarai-icon-512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${base}akarai-maskable-192.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: `${base}akarai-maskable-512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: `${base}akarai-icon-1024.png`,
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,webp,woff,woff2}'],
          globIgnores: ['assets/aistudio/**', '404.html', 'icon.svg', 'akarai-icon-raster-wrapper.svg'],
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }),
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
          // Prune unused design-review reference uploads from the production Pages bundle
          const distReferenceUploads = path.resolve(distDir, 'assets/aistudio');
          if (fs.existsSync(distReferenceUploads)) {
            fs.rmSync(distReferenceUploads, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
