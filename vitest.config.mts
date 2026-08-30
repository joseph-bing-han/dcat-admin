import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['resources/modern/**/*.test.ts', 'resources/modern/**/*.test.tsx'],
        globals: true,
        restoreMocks: true,
        setupFiles: ['resources/modern/test-setup.ts'],
    },
});

