import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://localhost:8080',
        trace: 'on-first-retry',
    },
    projects: [{
        name: 'desktop-chrome',
        testMatch: ['**/desktop.spec.ts', '**/editor.spec.ts'],
        use: devices['Desktop Chrome'],
    }, {
        name: 'mobile-safari',
        testMatch: ['**/mobile.spec.ts', '**/editor.spec.ts'],
        use: devices['iPhone 14'],
    }, {
        name: 'mobile-chrome',
        testMatch: ['**/mobile.spec.ts', '**/editor.spec.ts'],
        use: devices['Pixel 7'],
    }],
    webServer: {
        command: 'npm run start',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
    },
});
