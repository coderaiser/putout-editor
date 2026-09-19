import {test, expect} from './test.ts';
import {
    createPutoutEditor,
    EDITOR_SOURCE,
} from './putout-editor.ts';

test('parse error state renders pre element', async ({page}) => {
    const editor = createPutoutEditor(page);
    const {write, press} = await editor.get(EDITOR_SOURCE);
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    await press('i');
    await press('ControlOrMeta+A');
    await write('function() {}');
    await page.waitForTimeout(400);
    
    await expect(page.locator('pre.parse-error')).toBeVisible();
    await expect(page.locator('pre.parse-error')).toContainText('Unexpected token');
});

test('dark mode sets data-theme attribute', async ({page}) => {
    await page
        .getByTestId('toolbar')
        .getByRole('button', {
            name: /theme/i,
        })
        .click();
    
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('toolbar dropdown opens on hover', async ({page}) => {
    await page
        .getByTestId('toolbar')
        .getByText('babel', {
            exact: true,
        })
        .first()
        .hover();
    
    await expect(
        page
            .getByTestId('toolbar')
            .locator('.menuButton ul')
            .first(),
    ).toBeVisible();
});

test('parse error visible in dark mode', async ({page}) => {
    await page
        .getByTestId('toolbar')
        .getByRole('button', {
            name: /theme/i,
        })
        .click();
    
    const editor = createPutoutEditor(page);
    const {write, press} = await editor.get(EDITOR_SOURCE);
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    await press('i');
    await press('ControlOrMeta+A');
    await write('function() {}');
    await page.waitForTimeout(400);
    
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('pre.parse-error')).toBeVisible();
});
