import {test as base} from '@playwright/test';

export {type Page, type BrowserContext} from 'playwright';

/**
 * Each test starts on the chat page (`/chat/`) with empty storage. `/chat`
 * redirects there with a 302. The editor page also has a textbox.
 */
export const test = base.extend({
    page: async ({page}, use) => {
        await page.addInitScript(() => {
            localStorage.clear();
            document.documentElement.removeAttribute('data-theme');
        });
        
        await page.goto('/chat/');
        
        await use(page);
    },
});

export {expect} from '@playwright/test';
