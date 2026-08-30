import { defineConfig } from 'vite';

export default defineConfig({
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
        target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
        outDir: 'resources/dist/modern-compat',
        emptyOutDir: true,
        manifest: 'manifest.json',
        sourcemap: false,
        lib: {
            entry: 'resources/modern/compat.js',
            name: 'DcatModernCompat',
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                banner: 'if (!window.DcatCompat) {',
                footer: '}',
                entryFileNames: 'assets/dcat-modern-compat.js',
                assetFileNames: 'assets/dcat-modern-compat-[hash][extname]',
            },
        },
    },
});
