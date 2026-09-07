import {test, expect} from '@playwright/test';
import {
    openAst,
    openSourceEditor,
    replaceEditorContent,
} from './helpers.ts';

/**
 * Keep the AST output visible after an edit.
 *
 * On desktop the source editor and AST output are shown side-by-side. On
 * mobile the source and AST panels live on separate tabs, so after editing we
 * switch to the AST tab to observe the result.
 */
async function showAstAfterEdit(page) {
    if (await page.locator('.mobile-tabs').isVisible())
        await page.getByRole('tab', {name: /ast/i}).tap();
}

test('typing in source editor updates AST', async ({page}) => {
    await openSourceEditor(page);
    await replaceEditorContent(page, 'const x = 1;');
    await showAstAfterEdit(page);
    await expect(page.locator('.output').first()).toContainText('VariableDeclaration');
});

test('syntax error renders an error message', async ({page}) => {
    await openSourceEditor(page);
    await replaceEditorContent(page, 's/');
    await showAstAfterEdit(page);
    await expect(page.locator('.output').first().locator('pre.parse-error')).toBeVisible();
});

test('syntax error contains useful information', async ({page}) => {
    await openSourceEditor(page);
    await replaceEditorContent(page, 's/');
    await showAstAfterEdit(page);
    const error = page.locator('.output').first().locator('pre.parse-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/Unexpected token/i);
});

test('theme toggle changes document theme', async ({page}) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');
    
    // the desktop toolbar renders the theme control on wide screens, the
    // mobile menu on narrow ones.
    const container = await page.locator('#MobileMenu').isVisible()
        ? '#MobileMenu'
        : '#Toolbar';
    
    await page.locator(container).getByRole('button', {name: /theme/i}).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('switching AST view changes the output mode', async ({page}) => {
    await openAst(page);
    const jsonButton = page.getByRole('button', {name: /json/i});
    await jsonButton.click();
    await expect(page.locator('.output .cm-editor').first()).toBeVisible();
});