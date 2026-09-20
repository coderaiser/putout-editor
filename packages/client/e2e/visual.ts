import {test, expect} from './test.ts';

test('parse error state renders pre element', async ({page}) => {
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('function() {}');
    await page.waitForTimeout(600);
    
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
        .locator('.menuButton')
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
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('function() {}');
    await page.waitForTimeout(600);
    
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('pre.parse-error')).toBeVisible();
});
