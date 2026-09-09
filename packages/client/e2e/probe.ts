import {test} from '@playwright/test';

test('probe: inspect editor activeLine and console', async ({page}) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('/');
    await page.getByTestId('editor-source').locator('.cm-content').click();
    await page.waitForTimeout(500);
    const activeLines = await page.getByTestId('editor-source').locator('.cm-activeLine').count();
    console.log('PROBE_RESULT activeLines=' + activeLines + ' errors=' + JSON.stringify(errors));
});
