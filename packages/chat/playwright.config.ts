import process from 'node:process';
import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
    workers: 1,
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    reporter: 'list',
    use: {
        // The chat is served as `chat.html` beside the editor's `index.html`,
        // from the same `../../out`. So the base URL is the editor's and every
        // spec has to name the page itself.
        baseURL: 'http://localhost:8080',
        storageState: undefined,
    },
    projects: [{
        name: 'desktop-chrome',
        testMatch: ['**/desktop.ts'],
        use: {
            ...devices['Desktop Chrome'],
            colorScheme: 'dark',
        },
    }],
    // `bun run start` serves the prebuilt bundle in ../../out, not `src/`. A
    
    // change under `src/` is invisible to these tests until `bun run build`.
    webServer: {
        command: 'NODE_NO_WARNINGS=1 npm run start --silent',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
    },
});
