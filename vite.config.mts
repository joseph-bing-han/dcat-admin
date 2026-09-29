import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [tailwindcss(), react()],
    resolve: {
        // vendor 的 Untitled UI 组件保持上游 `@/...` 导入写法，便于按 commit diff 升级。
        alias: { '@': path.resolve(__dirname, 'resources/modern/ui') },
    },
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
