import {test, expect} from './test.ts';

test('mobile menu is visible', async ({page}) => {
    await expect(page.locator('#MobileMenu')).toBeVisible();
});

test('desktop toolbar controls are hidden on mobile', async ({page}) => {
    // the compact toolbar info row remains
    await expect(page.locator('#Toolbar')).toBeVisible();
    
    // desktop menu triggers are hidden on mobile
    await expect(
        page
            .locator('#Toolbar')
            .getByText('babel', {
                exact: true,
            })
            .first(),
    ).toBeHidden();
    
    // mobile menu is shown instead
    await expect(page.locator('#MobileMenu')).toBeVisible();
});

test('logo is visible', async ({page}) => {
    await expect(page.locator('#Toolbar h1')).toBeVisible();
});

test('snippet dropdown opens', async ({page}) => {
    const snippet = page.getByRole('button', {
        name: /snippet/i,
    });
    
    await snippet.tap();
    await expect(
        page
            .getByRole('menu')
            .first(),
    ).toBeVisible();
});

test('snippet dropdown exposes accessible semantics', async ({page}) => {
    const snippet = page.getByRole('button', {
        name: /snippet/i,
    });
    
    await expect(snippet).toHaveAttribute('aria-expanded', 'false');
    await snippet.tap();
    await expect(snippet).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('menu')).toBeVisible();
});

test('parser dropdown opens', async ({page}) => {
    const parser = page.getByRole('button', {
        name: /babel/i,
    });
    
    await parser.tap();
    await expect(
        page
            .getByRole('menu')
            .first(),
    ).toBeVisible();
});

test('dropdown closes on outside tap', async ({page}) => {
    const snippet = page.getByRole('button', {
        name: /snippet/i,
    });
    
    await snippet.tap();
    await expect(
        page
            .getByRole('menu')
            .first(),
    ).toBeVisible();
    
    // tapping the editor closes the dropdown
    await page
        .locator('.cm-editor')
        .first()
        .tap();
    await expect(
        page
            .getByRole('menu')
            .first(),
    ).toBeHidden();
});

test('mobile tabs render', async ({page}) => {
    await expect(page.locator('.mobile-tabs')).toBeVisible();
});

test('mobile tabs contain four controls', async ({page}) => {
    const tabs = page
        .locator('.mobile-tabs')
        .getByRole('tab');
    
    await expect(tabs).toHaveCount(4);
});

test('source tab opens the editor', async ({page}) => {
    await page
        .getByRole('tab', {
            name: /source/i,
        })
        .tap();
    await expect(
        page
            .locator('.cm-editor')
            .first(),
    ).toBeVisible();
});

test('ast tab opens the AST output', async ({page}) => {
    await page
        .getByRole('tab', {
            name: /ast/i,
        })
        .tap();
    await expect(
        page
            .locator('.output')
            .first(),
    ).toBeVisible();
});
