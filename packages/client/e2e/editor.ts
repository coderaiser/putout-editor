import {
    test,
    expect,
    type Page,
} from '@playwright/test';
import {
    createPutoutEditor,
    EDITOR_SOURCE,
    EDITOR_TRANSFORM,
} from './putout-editor.ts';

async function isMobileLayout(page: Page) {
    return await page
        .getByTestId('mobile-menu')
        .isVisible();
}

async function tapTab(page: Page, name: RegExp) {
    if (!await isMobileLayout(page))
        return;
    
    await page
        .getByRole('tab', {
            name,
        })
        .tap();
}

async function replaceContent(page: Page, text: string) {
    const editor = createPutoutEditor(page);
    await editor.goto();
    
    await tapTab(page, /source/i);
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    const {write, press} = await editor.get(EDITOR_SOURCE);
    await press('i');
    await press('ControlOrMeta+A');
    await write(text);
    await page.waitForTimeout(400);
}

async function replaceTransform(page: Page, text: string) {
    const editor = createPutoutEditor(page);
    await editor.goto();
    
    await tapTab(page, /transform/i);
    
    await page
        .getByTestId('editor-transform')
        .locator('.cm-content')
        .click();
    const {write, press} = await editor.get(EDITOR_TRANSFORM);
    await press('i');
    await press('ControlOrMeta+A');
    await write(text);
    await page.waitForTimeout(400);
}

async function showAst(page: Page) {
    await tapTab(page, /ast/i);
}

async function showResult(page: Page) {
    await tapTab(page, /code/i);
}

test('typing in source editor updates AST', async ({page}) => {
    await replaceContent(page, 'const x = 1;');
    await showAst(page);
    await expect(page.getByTestId('ast-output')).toContainText('VariableDeclaration');
});

test('syntax error in editor-source renders codeframe', async ({page}) => {
    await replaceContent(page, 'function() {\n  \n}');
    await showAst(page);
    
    await expect(page
        .getByTestId('ast-output')
        .getByRole('textbox')).toContainText('Unexpected token');
});

test('syntax error in editor-source does not show stack trace', async ({page}) => {
    await replaceContent(page, 'function() {\n  \n}');
    await showAst(page);
    
    await expect(page
        .getByTestId('ast-output')
        .getByRole('textbox')).not.toContainText('at ');
});

test('transform error in editor-transform renders codeframe', async ({page}) => {
    await replaceContent(page, 'const x = 1;');
    await replaceTransform(page, 'export const report = () => "error";\nexport const traverse = () => ({ throw new Error("oops") });');
    await showResult(page);
    
    await expect(page
        .getByTestId('editor-transform-output')
        .getByRole('textbox')).toBeVisible();
});

test('transform error in editor-transform shows error in codeframe not stack trace', async ({page}) => {
    await replaceContent(page, 'const x = 1;');
    await replaceTransform(page, 'export const report = () => "error";\nexport const traverse = () => { throw new Error("oops"); };');
    await showResult(page);
    
    await expect(page
        .getByTestId('editor-transform-output')
        .getByRole('textbox')).not.toContainText('at Object.<anonymous>');
});

test('theme toggle changes document theme', async ({page}) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');
    
    const container = await isMobileLayout(page)
        ? page.getByTestId('mobile-menu')
        : page.getByTestId('toolbar');
    
    await container
        .getByRole('button', {
            name: /theme/i,
        })
        .click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('switching AST view changes the output mode', async ({page}) => {
    await page.goto('/');
    await showAst(page);
    
    await expect(page.getByTestId('ast-output')).toBeVisible();
    await page
        .getByRole('button', {
            name: /json/i,
        })
        .click();
    await expect(page
        .getByTestId('ast-output')
        .getByRole('textbox')).toBeVisible();
});
