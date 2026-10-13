import {devices} from '@playwright/test';
import base from './playwright.config.ts';

export default {
    ...base,
    projects: [{
        name: 'mobile-chrome',
        testMatch: ['**/__probe.ts'],
        use: {
            ...devices['iPhone 12'],
            colorScheme: 'dark',
        },
    }],
};
