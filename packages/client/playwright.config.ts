import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:8080',
    },
    projects: [{
        name: 'desktop-chrome',
        testMatch: ['**/desktop.ts', '**/editor.ts'],
        use: devices['Desktop Chrome'],
    }, {
        name: 'mobile-safari',
        testMatch: ['**/mobile.ts', '**/editor.ts'],
        use: devices['iPhone 14'],
    }, {
        name: 'mobile-chrome',
        testMatch: ['**/mobile.spec.ts', '**/editor.spec.ts'],
        use: devices['Pixel 7'],
    }],
    webServer: {
        command: 'NODE_NO_WARNINGS=1 npm run start --silent',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
    },
});
