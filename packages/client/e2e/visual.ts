import {test, expect} from './test.ts';
import {createPutoutEditor, EDITOR_SOURCE} from './putout-editor.ts';

// test fixture clears localStorage and removes data-theme before each test
// so theme always starts from 'light' — no explicit reset needed

// the parse-time readout ('.output .toolbar .time') is not deterministic —
// mask it so screenshots diff only real style changes
const time = (page: any) => page.locator('.output .toolbar .time');

test('default light mode', async ({page}) => {
    await expect(page).toHaveScreenshot('default-light.png', {
        fullPage: true,
        mask: [time(page)],
    });
});

test('dark mode', async ({page}) => {
    await page
        .getByTestId('toolbar')
        .getByRole('button', {name: /theme/i})
        .click();
    await expect(page).toHaveScreenshot('default-dark.png', {
        fullPage: true,
        mask: [time(page)],
    });
});

test('parse error state', async ({page}) => {
    const editor = createPutoutEditor(page);
    const {write, press} = await editor.get(EDITOR_SOURCE);
    await page.getByTestId('editor-source').locator('.cm-content').click();
    await press('i');
    await press('ControlOrMeta+A');
    await write('function() {}');
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot('parse-error.png', {
        fullPage: true,
        mask: [time(page)],
    });
});

test('toolbar dropdown open', async ({page}) => {
    await page
        .getByTestId('toolbar')
        .getByText('babel', {exact: true})
        .first()
        .hover();
    await expect(page).toHaveScreenshot('dropdown-open.png', {
        fullPage: true,
        mask: [time(page)],
    });
});

test('dark mode parse error', async ({page}) => {
    await page
        .getByTestId('toolbar')
        .getByRole('button', {name: /theme/i})
        .click();
    const editor = createPutoutEditor(page);
    const {write, press} = await editor.get(EDITOR_SOURCE);
    await page.getByTestId('editor-source').locator('.cm-content').click();
    await press('i');
    await press('ControlOrMeta+A');
    await write('function() {}');
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot('parse-error-dark.png', {
        fullPage: true,
        mask: [time(page)],
    });
});