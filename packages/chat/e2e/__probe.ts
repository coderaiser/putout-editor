import {
    test,
    expect,
    type Page,
} from './test.ts';

const box = (page: Page) => page
    .getByTestId('input')
    .locator('.cm-content');

const send = async (page: Page, text: string) => {
    await box(page).click();
    await page.keyboard.insertText(text);
    await page.keyboard.press('Control+Enter');
};

test('probe', async ({page}) => {
    const dump = async () => {};
    
    await dump();
    
    await send(page, '/ast');
    await page.waitForTimeout(400);
    await dump();
    
    await send(page, '/console');
    await page.waitForTimeout(400);
    await dump();
    
    expect(true).toBe(true);
});
