import {test, expect, type Page} from './test.ts';

const box = (page: Page) => page.getByTestId('input').locator('.cm-content');

const send = async (page: Page, text: string) => {
    await box(page).click();
    await page.keyboard.insertText(text);
    await page.keyboard.press('Control+Enter');
};

test('probe', async ({page}) => {
    const dump = async (label) => {
        const result = await page.evaluate(() => ({
            lines: [...document.querySelectorAll('[data-testid="input"] .cm-line')].map((n) => n.textContent),
            system: [...document.querySelectorAll('[data-testid="message"]')].map((n) => n.textContent?.slice(0, 70)),
            rows: document.querySelectorAll('[data-testid="ast-row"]').length,
            panel: document.querySelector('.console-panel')?.className ?? null,
        }));
        
        console.log(label, JSON.stringify(result));
    };
    
    await dump('initial');
    
    await send(page, '/ast');
    await page.waitForTimeout(400);
    await dump('afterAst');
    
    await send(page, '/console');
    await page.waitForTimeout(400);
    await dump('afterConsole');
    
    expect(true).toBe(true);
});





