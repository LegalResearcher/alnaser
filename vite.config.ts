import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// ════════════════════════════════════════════════
// vite.config.ts — مُحسَّن لـ SEO مع Prerender
// منصة الناصر — الباحث القانوني
// ════════════════════════════════════════════════

export default defineConfig({
  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // تقسيم الـ bundle لتحسين سرعة التحميل
    rollupOptions: {
      output: {
        manualChunks: {
          // مكتبات React الأساسية في chunk منفصل
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // مكتبات UI في chunk منفصل
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-accordion'],
          // Supabase في chunk منفصل
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // رفع حد التحذير لتجنب التحذيرات الكثيرة
    chunkSizeWarningLimit: 1000,
  },

  // إعدادات السيرفر للتطوير
  server: {
    port: 8080,
    host: true,
  },
});
