import {test as base} from '@playwright/test';

export {type Page, type BrowserContext} from 'playwright';

/**
 * Each test starts on the chat page with empty storage.
 *
 * The chat is a second entry, so `/chat` is named here rather than in each spec —
 * a test that forgot it would silently assert against the editor's page, which
 * also has a textbox, and the failure would read as a missing button.
 *
 * The page is built to `out/chat/index.html`, so this is the directory URL. The
 * trailing slash is not written because `/chat` answers with a 302 to `/chat/`
 * and Playwright follows it; naming the redirect target directly keeps a spec
 * from depending on a redirect it does not care about.
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
