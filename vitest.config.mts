import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        // 与 vite.config.mts 一致：vendor 的 Untitled UI 组件保留上游 `@/...` 导入写法。
        alias: { '@': new URL('./resources/modern/ui', import.meta.url).pathname },
    },
    test: {
        environment: 'jsdom',
        include: ['resources/modern/**/*.test.ts', 'resources/modern/**/*.test.tsx'],
        globals: true,
        restoreMocks: true,
        setupFiles: ['resources/modern/test-setup.ts'],
    },
});
