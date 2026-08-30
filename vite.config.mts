import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
        target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
        outDir: 'resources/dist/modern',
        emptyOutDir: true,
        manifest: 'manifest.json',
        cssCodeSplit: false,
        sourcemap: false,
        lib: {
            entry: 'resources/modern/index.tsx',
            name: 'DcatModernBundle',
            formats: ['iife'],
            cssFileName: 'dcat-modern',
        },
        rollupOptions: {
            output: {
                entryFileNames: 'assets/dcat-modern-[hash].js',
                assetFileNames: 'assets/dcat-modern-[hash][extname]',
            },
        },
    },
});
