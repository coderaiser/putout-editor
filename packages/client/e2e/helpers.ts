import {expect, type Page} from '@playwright/test';

/**
 * Open the application and wait for the first editor to be present.
 */
export async function openEditor(page: Page) {
    await page.goto('/');
    await expect(page.locator('.cm-editor').first()).toBeVisible();
}

/**
 * Open the application with the Source editor active.
 *
 * On desktop the source editor is always rendered; on mobile it lives on the
 * Source tab, which is not the default tab.
 */
export async function openSourceEditor(page: Page) {
    await page.goto('/');
    
    if (await page.locator('.mobile-tabs').isVisible()) {
        const sourceTab = page.getByRole('tab', {name: /source/i});
        await sourceTab.tap();
        await expect(sourceTab).toHaveAttribute('aria-selected', 'true');
    }
    
    await expect(page.locator('.cm-editor').first()).toBeVisible();
}

/**
 * Open the application with the AST output active.
 *
 * On desktop the AST panel is always rendered; on mobile it lives on the AST
 * tab, which is not the default tab.
 */
export async function openAst(page: Page) {
    await page.goto('/');
    
    if (await page.locator('.mobile-tabs').isVisible()) {
        const astTab = page.getByRole('tab', {name: /ast/i});
        await astTab.tap();
        await expect(astTab).toHaveAttribute('aria-selected', 'true');
    }
    
    await expect(page.locator('.output').first()).toBeVisible();
}

/**
 * Replace the whole source editor content with `value`.
 *
 * The editor defaults to the Vim keymap, so we first switch to insert mode
 * (`i`) before selecting everything with ControlOrMeta+A. This keeps the same
 * interaction working on Chromium, WebKit, macOS, and CI environments.
 */
export async function replaceEditorContent(page: Page, value: string) {
    const editor = page.locator('.cm-content').first();
    await editor.click();
    await page.keyboard.press('i');
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(value);
    
    // Wait for the editor's 200ms content-change debounce to dispatch so
    // that the source value is persisted to the store before we switch tabs.

    await page.waitForTimeout(400);
}