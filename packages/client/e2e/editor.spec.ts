import {test, expect} from '@playwright/test';
import {createPutoutEditor, EDITOR_SOURCE} from './putout-editor.ts';

async function replaceContent(page, text: string) {
    const editor = createPutoutEditor(page);
    await editor.goto();

    if (await page.locator('.mobile-tabs').isVisible())
        await page.getByRole('tab', {name: /source/i}).tap();

    await page.locator(`[data-name="${EDITOR_SOURCE}"] .cm-content`).click();
    const {write, press} = await editor.get(EDITOR_SOURCE);
    await press('i');
    await press('ControlOrMeta+A');
    await write(text);
    await page.waitForTimeout(400);
}

async function showAst(page) {
    if (await page.locator('.mobile-tabs').isVisible())
        await page.getByRole('tab', {name: /ast/i}).tap();
}

test('typing in source editor updates AST', async ({page}) => {
    await replaceContent(page, 'const x = 1;');
    await showAst(page);
    await expect(page.locator('.output').first()).toContainText('VariableDeclaration');
});

test('syntax error renders an error message', async ({page}) => {
    await replaceContent(page, 's/');
    await showAst(page);
    await expect(page.locator('.output').first().locator('pre.parse-error')).toBeVisible();
});

test('syntax error contains useful information', async ({page}) => {
    await replaceContent(page, 's/');
    await showAst(page);
    const error = page.locator('.output').first().locator('pre.parse-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/Unexpected token/i);
});

test('theme toggle changes document theme', async ({page}) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');
    const container = await page.locator('#MobileMenu').isVisible()
        ? '#MobileMenu'
        : '#Toolbar';
    await page.locator(container).getByRole('button', {name: /theme/i}).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('switching AST view changes the output mode', async ({page}) => {
    await page.goto('/');
    if (await page.locator('.mobile-tabs').isVisible())
        await page.getByRole('tab', {name: /ast/i}).tap();
    await expect(page.locator('.output').first()).toBeVisible();
    await page.getByRole('button', {name: /json/i}).click();
    await expect(page.locator('.output .cm-editor').first()).toBeVisible();
});

test('vim mode preserves indent after consecutive Enter presses', async ({page}) => {
    const editor = createPutoutEditor(page);
    await editor.goto();

    if (await page.locator('.mobile-tabs').isVisible())
        await page.getByRole('tab', {name: /source/i}).tap();

    await page.locator(`[data-name="${EDITOR_SOURCE}"] .cm-content`).click();
    const {write, press, read} = await editor.get(EDITOR_SOURCE);

    await press('i');
    await press('ControlOrMeta+A');
    await write('    hello');
    await press('Enter');
    await press('Enter');
    await write('X');
    await press('Escape');

    const result = await read();
    expect(result).toContain('  X');
});

test('vim mode works after switching keymap away and back', async ({page}) => {
    const isMobile = await page.locator('.mobile-tabs').isVisible();

    test.skip(isMobile, 'mobile menu has no keymap control');

    const editor = createPutoutEditor(page);
    await editor.goto();

    await page.locator('#Toolbar #ToolbarKeyMap').hover();
    await page.getByRole('button', {name: 'default'}).click();
    await page.mouse.move(0, 0);

    await page.locator('#Toolbar #ToolbarKeyMap').hover();
    await page.getByRole('button', {name: 'vim'}).click();
    await page.mouse.move(0, 0);

    await page.locator(`[data-name="${EDITOR_SOURCE}"] .cm-content`).click();
    const {write, press, read} = await editor.get(EDITOR_SOURCE);

    await press('Escape');
    await write('ihello');
    await press('Escape');

    const result = await read();
    expect(result).not.toContain('ihello');
});

test('vim paste preserves yanked line indentation', async ({page}) => {
    const editor = createPutoutEditor(page);
    await editor.goto();

    if (await page.locator('.mobile-tabs').isVisible()) {
        await page.getByRole('tab', {name: /source/i}).tap();
    }

    await page.locator(`[data-name="${EDITOR_SOURCE}"] .cm-content`).click();
    const {write, press, read} = await editor.get(EDITOR_SOURCE);
    await press('ControlOrMeta+A');
    await write('for (const [index, element] of elements.entries()) {\n    if (compare(element, "heading(2, \\"Rules\\")")) {\n        rules.push(element);\n    }\n}');
    await press('Escape');

    // go to line 4 (the "}"), yank 3 lines upward (v k k y), then paste below (p)
    await write('4G');
    await press('0');
    await press('v');
    await press('k');
    await press('k');
    await press('y');
    await press('p');

    const lines = (await read()).split('\n');
    // the pasted block should preserve original indentation
    const closingBraceLine = lines.find((line, idx) => idx > 4 && line.trim() === '}');

    expect(closingBraceLine).toBe('}');
});

