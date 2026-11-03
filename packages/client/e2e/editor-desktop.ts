import {montag} from 'montag';
import {
    createPutoutEditor,
    EDITOR_SOURCE,
    EDITOR_TRANSFORM,
} from '#e2e/desktop';
import {
    test,
    expect,
    type Page,
} from './test.ts';

async function replaceContent(page: Page, text: string) {
    const {write} = await createPutoutEditor(page).get(EDITOR_SOURCE);
    await write(text);
    await page.waitForTimeout(600);
}

async function replaceTransform(page: Page, text: string) {
    const {write} = await createPutoutEditor(page).get(EDITOR_TRANSFORM);
    await write(text);
    await page.waitForTimeout(600);
}

async function showAst(page: Page) {
    await page.waitForTimeout(300);
}

async function showResult() {
    // no-op on desktop: result panel is always visible
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
    await showResult();
    
    await expect(
        page
            .getByTestId('editor-code')
            .getByRole('textbox'),
    ).toBeVisible();
});

test('transform error in editor-transform shows error in codeframe not stack trace', async ({page}) => {
    await replaceContent(page, 'const x = 1;');
    await replaceTransform(page, 'export const report = () => "error";\nexport const traverse = () => { throw new Error("oops"); };');
    await showResult();
    
    await expect(
        page
            .getByTestId('editor-code')
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
    await showResult();
    
    await expect(page.getByTestId('editor-code')).not.toContainText('Cannot determine type of plugin');
});

test('valid plugin with report and replace shows transformed code', async ({page}) => {
    await replaceContent(page, 'a ? b : c;');
    await replaceTransform(page, montag`
        export const report = () => \`Use 'if condition' instead of 'ternary expression'\`;
        export const replace = () => ({
            '__a ? __b : __c': 'if (__a) __b; else __c;',
        });
    `);
    await showResult();
    
    const result = page.getByTestId('editor-code');
    const expected = 'if (a)    b;else    c';
    
    await expect(result).toContainText(expected);
});

test('theme toggle changes document theme', async ({page}) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');
    
    await page
        .getByTestId('toolbar')
        .getByRole('button', {
            name: /theme/i,
        })
        .click();
    
    await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('switching AST view changes the output mode', async ({page}) => {
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

test('printer error on blur of editor-transform is shown in editor-transform', async ({page}) => {
    await replaceTransform(page, 'struct S {}');
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    
    await expect(page.getByTestId('editor-transform')).toContainText('not supported yet');
});

test('printer error in editor-transform is cleared when the code changes', async ({page}) => {
    await replaceTransform(page, 'struct S {}');
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    
    await replaceTransform(page, 'export const report = () => `x`;');
    
    await expect(page.getByTestId('editor-transform')).not.toContainText('not supported yet');
});

test('printer error in editor-transform does not overlap the editor text', async ({page}) => {
    await replaceTransform(page, 'struct S {}');
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    
    const error = page.getByTestId('format-error');
    
    await expect(error).toBeVisible();
    
    const errorBox = await error.boundingBox();
    const lastLineBox = await page
        .getByTestId('editor-transform')
        .locator('.cm-line')
        .last()
        .boundingBox();
    
    expect(errorBox!.y).toBeGreaterThanOrEqual(lastLineBox!.y + lastLineBox!.height);
});

test('editor-code result has no trailing empty line', async ({page}) => {
    await replaceContent(page, 'const a = 1;');
    
    const lines = page
        .getByTestId('editor-code')
        .locator('.cm-line');
    
    await expect(lines).toHaveCount(1);
});

test('editor-code error has no trailing empty line', async ({page}) => {
    await replaceTransform(page, 'export const replace = () => ({');
    
    const lastLine = page
        .getByTestId('editor-code')
        .locator('.cm-line')
        .last();
    
    await expect(lastLine).not.toHaveText('');
});
