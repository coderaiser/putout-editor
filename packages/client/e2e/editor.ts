import {montag} from 'montag';
import {
    test,
    expect,
    type Page,
} from './test.ts';

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
    await tapTab(page, /source/i);
    
    const cmContent = page
        .getByTestId('editor-source')
        .locator('.cm-content');
    
    // tap() works on both mobile and desktop; click() fails on mobile Safari
    await cmContent.tap();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(text);
    await page.waitForTimeout(600);
}

async function replaceTransform(page: Page, text: string) {
    await tapTab(page, /transform/i);
    
    const cmContent = page
        .getByTestId('editor-transform')
        .locator('.cm-content');
    
    await cmContent.tap();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(text);
    await page.waitForTimeout(600);
}

async function showAst(page: Page) {
    await tapTab(page, /ast/i);
    
    // Wait for AST panel to render after tab switch on mobile
    await page.waitForTimeout(300);
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
    
    await expect(
        page
            .getByTestId('ast-output')
            .getByRole('textbox'),
    ).toContainText('Unexpected token');
});

test('syntax error in editor-source does not show stack trace', async ({page}) => {
    await replaceContent(page, 'function() {\n  \n}');
    await showAst(page);
    
    await expect(
        page
            .getByTestId('ast-output')
            .getByRole('textbox'),
    ).not.toContainText('at ');
});

test('transform error in editor-transform renders codeframe', async ({page}) => {
    await replaceContent(page, 'const x = 1;');
    await replaceTransform(page, 'export const report = () => "error";\nexport const traverse = () => ({ throw new Error("oops") });');
    await showResult(page);
    
    await expect(
        page
            .getByTestId('editor-transform-output')
            .getByRole('textbox'),
    ).toBeVisible();
});

test('transform error in editor-transform shows error in codeframe not stack trace', async ({page}) => {
    await replaceContent(page, 'const x = 1;');
    await replaceTransform(page, 'export const report = () => "error";\nexport const traverse = () => { throw new Error("oops"); };');
    await showResult(page);
    
    await expect(
        page
            .getByTestId('editor-transform-output')
            .getByRole('textbox'),
    ).not.toContainText('at Object.<anonymous>');
});

test('valid plugin with report and replace does not show cannot determine error', async ({page}) => {
    await replaceContent(page, 'a ? b : c;');
    await replaceTransform(page, montag`
        export const report = () => \`Use 'if condition' instead of 'ternary expression'\`;
        export const replace = () => ({
            '__a ? __b : __c': 'if (__a) __b; else __c;',
        });
    `);
    await showResult(page);
    
    await expect(page.getByTestId('editor-transform-output')).not.toContainText('Cannot determine type of plugin');
});

test('valid plugin with report and replace shows transformed code', async ({page}) => {
    await replaceContent(page, 'a ? b : c;');
    await replaceTransform(page, montag`
        export const report = () => \`Use 'if condition' instead of 'ternary expression'\`;
        export const replace = () => ({
            '__a ? __b : __c': 'if (__a) __b; else __c;',
        });
    `);
    await showResult(page);
    
    const result = page.getByTestId('editor-transform-output');
    const expected = 'if (a)    b;else    c';
    
    await expect(result).toContainText(expected);
});

test('theme toggle changes document theme', async ({page}) => {
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
    await showAst(page);
    
    await expect(page.getByTestId('ast-output')).toBeVisible();
    await page
        .getByRole('button', {
            name: /json/i,
        })
        .click();
    await expect(
        page
            .getByTestId('ast-output')
            .getByRole('textbox'),
    ).toBeVisible();
});
