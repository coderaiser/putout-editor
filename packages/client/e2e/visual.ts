import {test, expect} from './test.ts';

test('parse error state renders pre element', async ({page}) => {
    const cmContent = page
        .getByTestId('editor-source')
        .locator('.cm-content');
    
    await cmContent.click({
        clickCount: 3,
    });
    await cmContent.pressSequentially('function() {}');
    await page.waitForTimeout(600);
    
    const astOutput = page.getByTestId('ast-output');
    await expect(astOutput).toContainText('Unexpected token');
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

test('toolbar dropdown opens on click', async ({page}) => {
    await page
        .getByTestId('toolbar')
        .getByRole('button', {
            name: 'Snippet',
            exact: true,
        })
        .click();
    
    await expect(
        page
            .getByTestId('toolbar')
            .getByTestId('snippet-menu'),
    ).toBeVisible();
});

test('parse error visible in dark mode', async ({page}) => {
    await page
        .getByTestId('toolbar')
        .getByRole('button', {
            name: /theme/i,
        })
        .click();
    
    const cmContent = page
        .getByTestId('editor-source')
        .locator('.cm-content');
    
    await cmContent.click({
        clickCount: 3,
    });
    await cmContent.pressSequentially('function() {}');
    await page.waitForTimeout(600);
    
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    
    const astOutput = page.getByTestId('ast-output');
    await expect(astOutput).toContainText('Unexpected token');
});
