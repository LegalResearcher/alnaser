import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// ════════════════════════════════════════════════
// vite.config.ts — مُحسَّن لـ SEO + PWA
// منصة الناصر — الباحث القانوني
// ════════════════════════════════════════════════

export default defineConfig(({mode}) => ({
  plugins: [
    react(),

    // ✅ PWA — يولّد Service Worker تلقائياً ويفعّل زر التثبيت
    VitePWA({
      registerType: 'autoUpdate',

      // استخدم site.webmanifest الموجود بدلاً من إنشاء واحد جديد
      manifest: false,

      // الملفات التي يُخزّنها الـ Service Worker
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,woff,ttf}'],
        // تجاهل ملفات كبيرة جداً
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          // Supabase API — NetworkFirst (يحاول الشبكة أولاً)
          {
            urlPattern: /^https:\/\/.*supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      // أيقونات الـ PWA
      includeAssets: ['favicon.ico', 'favicon.png'],

      devOptions: {
        // تفعيل PWA أثناء التطوير للاختبار
        enabled: false,
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },

  build: {
    // تقسيم الـ bundle لتحسين سرعة التحميل
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':       ['@radix-ui/react-dialog', '@radix-ui/react-accordion'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  server: {
    port: 8080,
    host: true,
  },
}));
