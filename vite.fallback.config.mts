import { defineConfig } from 'vite';

export default defineConfig({
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
        target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
        outDir: 'resources/dist/modern-compat',
        emptyOutDir: false,
        sourcemap: false,
        cssCodeSplit: false,
        lib: {
            entry: 'resources/modern/fallback.ts',
            name: 'DcatCompatFallback',
            formats: ['iife'],
            cssFileName: 'dcat-fallback',
        },
        rollupOptions: {
            output: {
                entryFileNames: 'assets/dcat-fallback.js',
                assetFileNames: 'assets/[name][extname]',
            },
        },
    },
});
