import {test as base} from '@playwright/test';
export {type Page} from 'playwright';

// Custom fixture that provides an isolated page with clean state
export const test = base.extend({
    page: async ({page}, use) => {
        // Clear localStorage and reset theme before each test
        await page.addInitScript(() => {
            localStorage.clear();
            document.documentElement.removeAttribute('data-theme');
        });
        
        // Navigate to home page
        await page.goto('/');
        
        // Provide the page to the test
        await use(page);
    },
});

export {expect} from '@playwright/test';
