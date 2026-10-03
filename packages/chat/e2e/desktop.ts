import {
    test,
    expect,
    type Page,
} from './test.ts';

const box = (page: Page) => page.getByRole('textbox');

/**
 * `fill` then `Ctrl+Enter`, not `type` then `Enter`: `fill` sets the value in one
 * go, and a multi-line `/source` body would otherwise be typed key by key, so
 * the `Enter` that ends a line would land in the middle of the source instead of
 * being part of the send chord.
 */
const send = async (page: Page, text: string) => {
    await box(page).fill(text);
    await page.keyboard.press('Control+Enter');
};

/**
 * The tree in the *thread*, as opposed to the one in the console panel.
 *
 * `/ast` answers twice — once as a message and once in the panel — so every
 * `ast-*` testid on the page is duplicated the moment `/ast` has run, and a bare
 * `getByTestId('ast-search')` is a strict-mode violation rather than a passing
 * test. The panel is a sibling of `[data-testid="chat"]`, not a descendant, so
 * scoping to the thread picks the message copy.
 */
const tree = (page: Page) => page
    .getByTestId('chat')
    .getByTestId('ast-output');

const search = (page: Page) => page
    .getByTestId('chat')
    .getByTestId('ast-search');

const userMessages = (page: Page) => page.locator('.message--user');

test('renders the chat application', async ({page}) => {
    await expect(page.getByTestId('app')).toBeVisible();
});

test('shows ast tree for pasted source', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    await expect(tree(page)).toBeVisible();
    await expect(tree(page)).toContainText('Program');
    await expect(tree(page)).toContainText('VariableDeclaration');
});

test('search filters tree', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    await search(page).fill('VariableDeclaration');
    
    // The ancestor stays on screen and is *dimmed* — that is the filter's
    
    // design, not a leftover row: a match is only reachable through its parents.
    
    // So the first row is `Program` and the match is the next one. Asserting on
    
    // `.first()` would have passed for a filter that kept everything and failed
    
    // for a filter that worked.
    const rows = page
        .getByTestId('chat')
        .getByTestId('ast-row');
    
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

test('the panel ✕ closes the console', async ({page}) => {
    await send(page, '/console');
    await expect(page.locator('.console-panel')).toBeVisible();
    
    // The `✕` is the only way to dismiss the panel without typing a command —
    
    // the header button this replaced could only ever open it.
    await page
        .getByTestId('console-close')
        .click();
    
    await expect(page.locator('.chat-console')).toHaveCount(0);
});

test('/ast opens the console panel on its own', async ({page}) => {
    await expect(page.getByTestId('console-panel')).toHaveCount(0);
    
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    // No second `/console`: the tree just asked for *is* the panel, and a
    
    // toggle here would close the panel on a second `/ast`.
    await expect(page.locator('.console-panel')).toBeVisible();
    await expect(
        page
            .locator('.console-panel [data-testid="ast-row"]')
            .first(),
    ).toBeVisible();
});

test('Ctrl+Enter sends the line', async ({page}) => {
    await box(page).fill('/help');
    await page.keyboard.press('Control+Enter');
    
    await expect(userMessages(page)).toHaveCount(1);
    await expect(box(page)).toHaveValue('');
});

test('Enter adds a newline and does not send', async ({page}) => {
    await box(page).fill('/help');
    await page.keyboard.press('Enter');
    
    // Both halves are the point: a newline that also sent would post a
    
    // half-typed line, and this is the assertion that would have caught it.
    await expect(box(page)).toHaveValue('/help\n');
    await expect(userMessages(page)).toHaveCount(0);
});

test('Shift+Enter builds a multi-line /source body', async ({page}) => {
    await box(page).fill('/source\nconst a = 1;');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.insertText('const b = 2;');
    
    await expect(box(page)).toHaveValue('/source\nconst a = 1;\nconst b = 2;');
    
    await page.keyboard.press('Control+Enter');
    
    // Two lines of source survived as a body rather than being sent as two
    
    // separate commands, which is the whole reason `/source` takes a rest.
    await expect(userMessages(page)).toHaveCount(1);
    await expect(page.locator('.source-block__line')).toHaveCount(2);
});

test('the send button sends the line', async ({page}) => {
    // The button is the primary way to send now that `Enter` is a newline, so
    // it is the one path that cannot be about the chord at all.
    await box(page).fill('/help');
    await page
        .getByTestId('send')
        .click();
    
    await expect(userMessages(page)).toHaveCount(1);
    await expect(box(page)).toHaveValue('');
});

test('/console again hides the panel', async ({page}) => {
    await send(page, '/console');
    await expect(page.locator('.chat-console')).toBeVisible();
    
    await send(page, '/console');
    
    await expect(page.locator('.chat-console')).toHaveCount(0);
});

test('up arrow recalls the last sent line', async ({page}) => {
    await send(page, '/help');
    
    await expect(box(page)).toHaveValue('');
    
    await box(page).press('ArrowUp');
    
    await expect(box(page)).toHaveValue('/help');
});

test('the header has no console toggle button', async ({page}) => {
    // `App.spec.tsx` asserts the same thing in jsdom; this is the user-facing
    // half, and it is the one that would read as a missing button.
    await expect(page.getByTestId('console-toggle')).toHaveCount(0);
    await expect(page.locator('.chat-header__actions')).toHaveCount(0);
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
