import {test, expect} from '@playwright/test';
import {createPutoutEditor} from './putout-editor.ts';

test('renders the editor application', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('#Toolbar')).toBeVisible();
});

test('renders Putout Editor title', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('#Toolbar h1')).toContainText('Putout Editor');
});

test('mobile menu is hidden on desktop', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('#MobileMenu')).toBeHidden();
});

test('source editor renders', async ({page}) => {
    await createPutoutEditor(page).goto();
    await expect(page
        .locator('.cm-editor')
        .first()).toBeVisible();
});

test('AST output renders', async ({page}) => {
    await page.goto('/');
    await expect(page
        .locator('.output')
        .first()).toBeVisible();
});

test('AST view controls render', async ({page}) => {
    await page.goto('/');
    await expect(page.getByRole('button', {
        name: /tree/i,
    })).toBeVisible();
    await expect(page.getByRole('button', {
        name: /json/i,
    })).toBeVisible();
});

test('desktop parser menu opens and changes parser', async ({page}) => {
    await page.goto('/');
    await expect(page
        .locator('#Toolbar')
        .getByText('acorn', {
            exact: true,
        })).toBeHidden();
    await page
        .locator('#Toolbar')
        .getByText('babel', {
            exact: true,
        })
        .first()
        .hover();
    await expect(page.getByRole('button', {
        name: /acorn/i,
    })).toBeVisible();
    await page
        .getByRole('button', {
            name: /acorn/i,
        })
        .click();
    await expect(page
        .locator('#Toolbar')
        .getByText('acorn', {
            exact: true,
        })
        .first()).toBeVisible();
});

test('vim mode works after switching keymap away and back', async ({page}) => {
    const editor = createPutoutEditor(page);
    await editor.goto();

    await page
        .locator('#Toolbar #ToolbarKeyMap')
        .hover();
    await page
        .getByRole('button', {
            name: 'default',
        })
        .click();
    await page.mouse.move(0, 0);

    await page
        .locator('#Toolbar #ToolbarKeyMap')
        .hover();
    await page
        .getByRole('button', {
            name: 'vim',
        })
        .click();
    await page.mouse.move(0, 0);

    await page
        .locator(`[data-name="editor-source"] .cm-content`)
        .click();

    const {write, press, read} = await editor.get('editor-source');

    await press('Escape');
    await write('ihello');
    await press('Escape');

    const result = await read();
    expect(result).not.toContain('ihello');
});
