import {
    test,
    expect,
    type Page,
} from './test.ts';

const box = (page: Page) => page.getByRole('textbox');

/**
 * `fill` then `Enter`, not `type` then `Enter`: `fill` sets the value in one go,
 * and a multi-line `/source` body would otherwise be typed key by key, so the
 * `Enter` that ends a line would submit the form mid-source.
 */
const send = async (page: Page, text: string) => {
    await box(page).fill(text);
    await page.keyboard.press('Enter');
};

test('renders the chat application', async ({page}) => {
    await expect(page.getByTestId('app')).toBeVisible();
});

test('shows ast tree for pasted source', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    const tree = page.getByTestId('ast-output');
    
    await expect(tree).toBeVisible();
    await expect(tree).toContainText('Program');
    await expect(tree).toContainText('VariableDeclaration');
});

test('search filters tree', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    const search = page.getByTestId('ast-search');
    
    await search.fill('VariableDeclaration');
    
    // The ancestor stays on screen and is *dimmed* — that is the filter's
    
    // design, not a leftover row: a match is only reachable through its parents.
    
    // So the first row is `Program` and the match is the next one. Asserting on
    
    // `.first()` would have passed for a filter that kept everything and failed
    
    // for a filter that worked.
    const rows = page.getByTestId('ast-row');
    
    await expect(rows.first()).toHaveClass(/ast-row--dimmed/);
    await expect(rows.nth(1)).toContainText('VariableDeclaration');
    
    // And the nodes that match nothing are gone: the tree had four drawn rows
    
    // for this source and the query leaves two.
    await expect(rows).toHaveCount(2);
});

test('console panel toggles on /console', async ({page}) => {
    await expect(page.getByTestId('console-panel')).toHaveCount(0);
    
    await send(page, '/console');
    
    await expect(page.locator('.console-panel')).toBeVisible();
});

test('the header button opens the console without a command', async ({page}) => {
    // The button dispatches `toggleConsole` itself rather than sending `/console`,
    // so this is a different path to the same panel — and the one a user takes.
    await expect(page.locator('.chat-console')).toHaveCount(0);
    
    await page
        .getByTestId('console-toggle')
        .click();
    
    await expect(page.locator('.chat-console')).toBeVisible();
    await expect(page.getByTestId('console-toggle')).toContainText('⊟');
});

test('error shown for unknown command', async ({page}) => {
    await send(page, '/notacommand');
    
    await expect(page.locator('.error-block')).toBeVisible();
});

test('autocomplete opens on slash', async ({page}) => {
    await box(page).fill('/');
    
    await expect(page.locator('.autocomplete')).toBeVisible();
    await expect(page.locator('.autocomplete')).toContainText('/ast');
});
