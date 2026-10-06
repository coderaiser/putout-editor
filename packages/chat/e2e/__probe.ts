import {test} from '@playwright/test';

test('probe', async ({page}) => {
    await page.goto('http://localhost:8080/chat/');
    await page.waitForTimeout(500);
    const box = page.getByTestId('input');
    await box.fill('/source\nconst x = 42;');
    await page.keyboard.press('Control+Enter');
    await page.waitForTimeout(300);
    await box.fill('/ast');
    await page.keyboard.press('Control+Enter');
    await page.waitForTimeout(600);
    const html = await page.locator('[data-testid="chat"]').innerHTML();
    const idx = html.indexOf('ast-code');
    console.log('HAS_AST_CODE: ' + (idx >= 0));
    if (idx >= 0) console.log('SNIP: ' + html.slice(Math.max(0, idx - 120), idx + 260));
    console.log('PREVIEW_COUNT: ' + await page.locator('.ast-code-preview').count());
    console.log('OLD_CLASS_COUNT: ' + await page.locator('.ast-code').count());
});
