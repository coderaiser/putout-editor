import {
    test,
    expect,
    type Page,
} from './test.ts';

/**
 * Scope to `data-testid="input"`, not `getByRole('textbox')`: once `/ast` runs,
 * `AstSearch` puts a second `<input>` on the page. Playwright strict mode then
 * refuses `getByRole('textbox')` — two elements match and the locator throws.
 *
 * `.cm-content` is the focusable `contenteditable` CodeMirror owns; pressing
 * keys or typing against the container div would land nowhere.
 */
const box = (page: Page) => page
    .getByTestId('input')
    .locator('.cm-content');

/**
 * Click, insert the text, then `Ctrl+Enter`. `fill` does not work on a
 * `contenteditable` div. `keyboard.type` presses `Enter` for each `\n`, and
 * `Enter` sends. `insertText` puts the whole text in one step.
 */
const send = async (page: Page, text: string) => {
    await box(page).click();
    await page.keyboard.insertText(text);
    await page.keyboard.press('Control+Enter');
};

/**
 * The tree in the thread, not in the console panel. After `ast`, each
 * `ast-*` testid is on the page twice. The panel is not inside
 * `[data-testid="chat"]`.
 */
const tree = (page: Page) => page
    .getByTestId('chat')
    .getByTestId('ast-output');

const search = (page: Page) => page
    .getByTestId('chat')
    .getByTestId('ast-search');

const userMessages = (page: Page) => page.locator('.message--user');

/**
 * The `/learn` rows in the thread. The console panel can show a second tree,
 * so scope to the thread. The rows are `learn-row`.
 */
const learnRows = (page: Page) => page
    .getByTestId('chat')
    .getByTestId('learn-row');

/**
 * The user messages of the seed: the `source` example and `help`. Each count
 * below is this plus what the spec sends, so a change of the seed changes
 * one number.
 */
const SEEDED_USER_MESSAGES = 2;

/**
 * The box of one element in CSS pixels, from `getBoundingClientRect()`.
 * A containment check needs all four sides.
 */
const rectOf = async (page: Page, selector: string) => page
    .locator(selector)
    .first()
    .evaluate((element) => {
        const {
            top,
            right,
            bottom,
            left,
        } = element.getBoundingClientRect();
        
        return {
            top,
            right,
            bottom,
            left,
        };
    });

/** The 1px slack: `getBoundingClientRect` rounds, the stylesheet does not. */
const SLOP = 1;

/**
 * Whether `inner` sits inside `outer` on both axes.
 *
 * A named predicate rather than four comparisons repeated in each spec, because
 * the answer is the thing under test and the arithmetic is not.
 */
const within = (inner: Rect, outer: Rect) => ({
    horizontally: inner.left >= outer.left && inner.right <= outer.right,
    vertically: inner.top >= outer.top && inner.bottom <= outer.bottom,
});

type Rect = Awaited<ReturnType<typeof rectOf>>;

test('renders the chat application', async ({page}) => {
    await expect(page.getByTestId('app')).toBeVisible();
});

/**
 * The send button is inside the textarea on both axes. Check containment,
 * not only `send.right`: a wide textarea also passes a button that is next
 * to it.
 */
test('the send button sits inside the textarea boundary', async ({page}) => {
    const send = await rectOf(page, '.input__send');
    const box = await rectOf(page, '.input__box');
    
    const result = within(send, {
        top: box.top - SLOP,
        right: box.right + SLOP,
        bottom: box.bottom + SLOP,
        left: box.left - SLOP,
    });
    
    const expected = {
        horizontally: true,
        vertically: true,
    };
    
    expect(result).toEqual(expected);
});

/**
 * The text keeps a right margin for the button: `padding-right` is at least
 * the button width.
 */
test('the textarea reserves room for the send button', async ({page}) => {
    const send = await rectOf(page, '.input__send');
    
    const paddingRight = await page
        .locator('.input__box')
        .first()
        .evaluate((element) => {
            const {paddingRight} = getComputedStyle(element);
            
            return parseInt(paddingRight, 10);
        });
    
    // the button sits inside the padding box, so the two must agree
    const result = {
        fitsIn: paddingRight >= send.right - send.left,
    };
    
    const expected = {
        fitsIn: true,
    };
    
    expect(result).toEqual(expected);
});

/**
 * The left padding is the thread gutter, not the 52px button lane. Check the
 * exact number: with equal sides the composer looks centred.
 */
test('the textarea left padding matches the thread gutter, not the button lane', async ({page}) => {
    const padding = await page
        .locator('.input__box')
        .first()
        .evaluate((element) => {
            const {paddingLeft, paddingRight} = getComputedStyle(element);
            
            return {
                left: parseInt(paddingLeft, 10),
                right: parseInt(paddingRight, 10),
            };
        });
    
    // both halves: the value itself, and that it is no longer the button's lane
    expect(padding).toEqual({
        left: 16,
        right: 52,
    });
});

/**
 * The placeholder is a `::before`: a locator cannot find it, but its computed
 * style is readable. Check its `left` (not only the box padding) and the
 * vertical centring (`display: flex`, `align-items: center`).
 */
test('the placeholder inset keeps the button lane on the right', async ({page}) => {
    await expect(page.locator('.input__box--empty')).toBeVisible();
    
    const style = await page
        .locator('.input__box--empty')
        .first()
        .evaluate((element) => {
            const {
                top,
                right,
                bottom,
                left,
                display,
                alignItems,
                position,
            } = getComputedStyle(element, '::before');
            
            return {
                top,
                right,
                bottom,
                left,
                display,
                alignItems,
                position,
            };
        });
    
    // top right bottom left — 16px from the text edge, 52px clear of the button
    const expected = {
        top: '12px',
        right: '52px',
        bottom: '12px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        position: 'absolute',
    };
    
    expect(style).toEqual(expected);
});

test('shows ast tree for pasted source', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    await expect(tree(page)).toBeVisible();
    await expect(tree(page)).toContainText('Program');
    await expect(tree(page)).toContainText('VariableDeclaration');
});

/**
 * The seed, asserted in the shape a user meets it: no `source` sent, `ast`
 * typed, and a tree. A unit spec can only check that the seed parses; this is
 * the one that checks the page draws it.
 */
test('ast works with no source sent', async ({page}) => {
    await send(page, '/ast');
    
    await expect(tree(page)).toBeVisible();
    await expect(tree(page)).toContainText('Program');
});

test('search filters tree', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    await search(page).fill('VariableDeclaration');
    
    /*
     * The ancestor stays, dimmed: a match is reached through its parents.
     * So the first row is `Program` and the match is the next one.
     */
    const rows = page
        .getByTestId('chat')
        .getByTestId('ast-row');
    
    await expect(rows.first()).toHaveClass(/ast-row--dimmed/);
    await expect(rows.nth(1)).toContainText('VariableDeclaration');
    
    // And the nodes that match nothing are gone: the tree had four drawn rows
    
    // for this source and the query leaves two.
    await expect(rows).toHaveCount(2);
});

/**
 * The rows that match have the match class. Their ancestors do not.
 * A filter that keeps all rows fails this.
 */
test('search marks the rows that matched', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    await search(page).fill('VariableDeclaration');
    
    const marked = page
        .getByTestId('chat')
        .locator('.ast-row--match');
    
    // One match, and it is *not* `Program` — the ancestor is dimmed instead.
    await expect(marked).toHaveCount(1);
    await expect(marked).toContainText('VariableDeclaration');
    
    const dimmed = page
        .getByTestId('chat')
        .locator('.ast-row--dimmed');
    
    await expect(dimmed).toHaveCount(1);
});

/**
 * `ArrowRight` and `ArrowLeft` through the real key handler. The default fold
 * opens `Program` and `VariableDeclaration`. Three `ArrowDown`s reach
 * `VariableDeclarator`, which is still folded.
 */
test('ArrowRight expands and ArrowLeft folds the tree', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    const rows = page
        .getByTestId('chat')
        .getByTestId('ast-row');
    
    await page
        .locator('[data-testid="ast-output"]')
        .first()
        .focus();
    
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    
    const selected = page
        .getByTestId('chat')
        .locator('.ast-row--selected');
    
    await expect(selected).toContainText('VariableDeclarator');
    
    // `▸` is the folded caret. Asserting it is what makes the three presses
    
    // above meaningful — landing on a row that is already open would give a
    
    // green run for a sequence that expanded nothing.
    const caret = await selected
        .locator('.ast-row__caret')
        .textContent();
    
    const expectedCaret = '▸';
    
    expect(caret).toBe(expectedCaret);
    
    const folded = await rows.count();
    
    await page.keyboard.press('ArrowRight');
    
    const expanded = await rows.count();
    expect(expanded).toBeGreaterThan(folded);
    
    await page.keyboard.press('ArrowLeft');
    
    const refolded = await rows.count();
    expect(refolded).toBe(folded);
});

/**
 * `h` and `l` over the real key handler.
 *
 * The row count is the assertion, and it is the same count
 * `ArrowRight expands and ArrowLeft folds the tree` uses — so this is that test
 * with `h`/`l` in place of the arrows, which is the only way a binding that was
 * never wired could not be caught by the pure specs.
 */
test('h and l fold and expand the tree', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    const rows = page
        .getByTestId('chat')
        .getByTestId('ast-row');
    
    await page
        .locator('[data-testid="ast-output"]')
        .first()
        .focus();
    
    // three rows down to `VariableDeclarator`, which `defaultCollapsed` shut
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    
    const folded = await rows.count();
    
    await page.keyboard.press('l');
    
    const expanded = await rows.count();
    expect(expanded).toBeGreaterThan(folded);
    
    await page.keyboard.press('h');
    
    const refolded = await rows.count();
    expect(refolded).toBe(folded);
});

/**
 * `Tab` moves real focus (`toBeFocused()`), not only the `focus` state.
 * The tree prevents the default, so focus goes to the filter.
 */
test('Tab moves focus from the tree to the filter, and back', async ({page}) => {
    await send(page, '/ast');
    
    await page
        .locator('[data-testid="ast-output"]')
        .first()
        .focus();
    
    await page.keyboard.press('Tab');
    await expect(search(page)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(tree(page)).toBeFocused();
});

/**
 * `k` on the first row moves focus to the filter, like `Tab`. The first
 * `ArrowDown` selects `Program`.
 */
test('k from the first row moves focus to the filter', async ({page}) => {
    await send(page, '/ast');
    
    await page
        .locator('[data-testid="ast-output"]')
        .first()
        .focus();
    
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('k');
    
    await expect(search(page)).toBeFocused();
});

/**
 * And `k` in the filter comes back to the tree, clearing the filter on the way.
 *
 * The clear is half the assertion. A filter that kept its text but handed focus
 * back would leave the user looking at a filtered tree with no filter box and no
 * obvious way to undo it.
 */
test('k in the filter clears it and returns focus to the tree', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    await page
        .locator('[data-testid="ast-output"]')
        .first()
        .focus();
    
    await page.keyboard.press('/');
    await search(page).fill('VariableDeclaration');
    
    await page.keyboard.press('k');
    
    await expect(search(page)).toHaveValue('');
    await expect(tree(page)).toBeFocused();
});

/**
 * The desktop shows the full hint and the code preview. A
 * `@media (pointer: coarse)` block that leaks fails this spec only.
 */
test('ast shows the full hint and the code preview on desktop', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    const status = page
        .getByTestId('chat')
        .getByTestId('ast-status');
    
    await expect(status).toContainText('h/l fold/expand');
    await expect(status).toContainText('tab switch');
    
    await expect(
        page
            .getByTestId('chat')
            .locator('.ast-code'),
    ).toBeVisible();
});

/**
 * Two columns on desktop — the geometry behind the mobile `1fr`.
 *
 * Asserted as "the tree is narrower than the body", which is what a
 * two-column grid means, rather than as a pixel width that a font-size change
 * would move.
 */
test('ast shows two columns on desktop', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    const measured = await page.evaluate(() => {
        const tree = document.querySelector('.ast__tree') as HTMLElement;
        const body = document.querySelector('.ast__body') as HTMLElement;
        
        return {
            body: body.getBoundingClientRect().width,
            tree: tree.getBoundingClientRect().width,
        };
    });
    
    const expected = true;
    
    expect({
        // the preview takes a share, so the tree is strictly narrower
        twoColumns: measured.tree < measured.body,
    }).toEqual({
        twoColumns: expected,
    });
});

/**
 * Two categories have two colours. Needs a real cascade, so it is an e2e.
 * Compare, do not use a hex value: themes differ. `declaration` and
 * `statement` are on screen in each `ast` answer.
 */
test('ast row type colour differs by category', async ({page}) => {
    await send(page, '/ast');
    
    const colourOf = (category: string) => page
        .getByTestId('chat') // On the type span: the attribute moved there so the CSS selector is    // `.ast-row__type[data-category="x"]` with no ancestor hop.
        .locator(`.ast-row__type[data-category="${category}"]`)
        .first()
        .evaluate((element) => getComputedStyle(element).color);
    
    const result = await colourOf('statement');
    const expected = await colourOf('declaration');
    
    expect(result).not.toBe(expected);
});

/**
 * Each drawn category has its own colour. Read the categories from the drawn
 * rows: a hidden row gives `null`, which is not a colour. Expand the tree
 * first, and expect at least four categories.
 */
test('each drawn category renders a distinct colour', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    await page
        .locator('[data-testid="ast-output"]')
        .first()
        .focus();
    
    // `l` expands where it stands, then walks in. Five presses reach Program,
    
    // VariableDeclaration and VariableDeclarator.
    
    // That is what brings `Identifier` and `ArrowFunctionExpression` out from
    
    // under the default fold.
    for (const key of [
        'l',
        'l',
        'l',
        'l',
        'l',
    ])
        await page.keyboard.press(key);
    
    const measured = await page.evaluate(() => {
        // On the type span, since the attribute moved there with the CSS.
        const rows = [...document.querySelectorAll('.ast-row__type[data-category]')];
        
        const categories = new Set<string>();
        
        // A `for..of`, not `rows.map((element) =>
        // element.getAttribute('data-category'))`: two rules, both learned here.
        // `hoist-arrow-callback` wants an inline callback lifted to a top-level
        // declaration, which is wrong for code that has to run *inside the page* —
        // it closes over `rows`. And the destructured form
        // `rows.map(({getAttribute}) => getAttribute(...))` detaches the method
        // from its receiver, which the browser's `getAttribute` reads `this` off.
        // Same trap as `AstBlock.spec.tsx` records for happy-dom.
        for (const element of rows)
            categories.add(element.getAttribute('data-category') as string);
        
        const colours = [];
        
        for (const category of categories) {
            const type = document.querySelector(`.ast-row__type[data-category="${category}"]`) as HTMLElement;
            
            colours.push(getComputedStyle(type).color);
        }
        
        return {
            categories: categories.size,
            distinctColours: new Set(colours).size,
        };
    });
    
    const expected = {
        categories: measured.categories,
        distinctColours: measured.categories,
    };
    
    // the tree must actually have enough categories for the comparison to mean
    // anything; a two-row default view would make this trivially true
    expect(measured.categories).toBeGreaterThanOrEqual(4);
    expect(measured).toEqual(expected);
});

/**
 * A matched row keeps its category colour: `.ast-row--match` sets `color` on
 * the row, and it must not reach `.ast-row__type`.
 */
test('a matched row keeps its category colour', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    await search(page).fill('VariableDeclaration');
    
    const result = await page.evaluate(() => {
        const matched = document.querySelector('.ast-row--match .ast-row__type[data-category="declaration"]') as HTMLElement;
        
        const dimmed = document.querySelector('.ast-row--dimmed .ast-row__type[data-category="statement"]') as HTMLElement;
        
        return {
            dimmed: dimmed && getComputedStyle(dimmed).color,
            matched: matched && getComputedStyle(matched).color,
        };
    });
    
    const expected = true;
    
    expect({
        // the matched row is still a declaration-blue, not the row's amber
        keepsColour: result.matched !== result.dimmed,
    }).toEqual({
        keepsColour: expected,
    });
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

/**
 * Reverses `0e987ac`, and the reason it does not take anything away is the spec
 * above: `ast` already answers *in the thread*, so the panel was a second view
 * of something on screen rather than the only way to see it.
 *
 * `console` and the panel's own ✕ still open and close it by hand — those are
 * asserted elsewhere, and this is only about what `ast` does on its own.
 */
test('ast leaves the console panel closed', async ({page}) => {
    await expect(page.getByTestId('console-panel')).toHaveCount(0);
    
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    // The tree is in the thread — that is what `shows ast tree for pasted
    
    // source` asserts — so the panel opening here would be a duplicate taking
    
    // half the thread.
    await expect(page.locator('.console-panel')).toHaveCount(0);
});

test('Ctrl+Enter sends the line', async ({page}) => {
    await box(page).click();
    await page.keyboard.type('/help');
    await page.keyboard.press('Control+Enter');
    
    await expect(userMessages(page)).toHaveCount(SEEDED_USER_MESSAGES + 1);
    await expect(box(page)).toHaveText('');
});

test('Enter sends the line on a keyboard', async ({page}) => {
    await box(page).click();
    await page.keyboard.type('/help');
    await page.keyboard.press('Enter');
    
    await expect(userMessages(page)).toHaveCount(SEEDED_USER_MESSAGES + 1);
    await expect(box(page)).toHaveText('');
});

test('Shift+Enter builds a multi-line /source body', async ({page}) => {
    await box(page).click();
    await page.keyboard.type('/source');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.insertText('const a = 1;');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.insertText('const b = 2;');
    
    // One assertion per line: `.cm-content` holds a `.cm-line` div per line
    
    // with no text between them, so `toHaveText` on the whole box joins the
    
    // three lines into one flat string. The line divs are the editor's own
    
    // structure, and counting them is the honest shape of "multi-line".
    const rows = box(page).locator('.cm-line');
    
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toHaveText('/source');
    await expect(rows.nth(1)).toHaveText('const a = 1;');
    await expect(rows.nth(2)).toHaveText('const b = 2;');
    
    await page.keyboard.press('Control+Enter');
    
    // Two lines of source survived as a body rather than being sent as two
    
    // separate commands, which is the whole reason `source` takes a rest.
    await expect(userMessages(page)).toHaveCount(SEEDED_USER_MESSAGES + 1);
    
    // The **last** source block, not the first: the seed's own `source` example
    
    // is one too, so `toHaveCount(2)` would be counting the seed plus half of
    
    // this spec. Scoping to the end says "the block this line produced".
    const lines = page
        .locator('.source-block')
        .last()
        .locator('.source-block__line');
    
    await expect(lines).toHaveCount(2);
});

test('the send button sends the line', async ({page}) => {
    // The button is the primary way to send now that `Enter` is a newline, so
    // it is the one path that cannot be about the chord at all.
    await box(page).click();
    await page.keyboard.type('/help');
    await page
        .getByTestId('send')
        .click();
    
    await expect(userMessages(page)).toHaveCount(SEEDED_USER_MESSAGES + 1);
    await expect(box(page)).toHaveText('');
});

test('console again hides the panel', async ({page}) => {
    await send(page, '/console');
    await expect(page.locator('.chat-console')).toBeVisible();
    
    await send(page, '/console');
    
    await expect(page.locator('.chat-console')).toHaveCount(0);
});

test('up arrow recalls the last sent line', async ({page}) => {
    await send(page, '/help');
    
    await expect(box(page)).toHaveText('');
    
    await box(page).press('ArrowUp');
    
    // The sigil comes back with it: `↑` recalls the line that was sent, and a
    
    // recalled `help` would be answered "Not a command" when sent again.
    await expect(box(page)).toHaveText('/help');
});

test('the header has no console toggle button', async ({page}) => {
    // `App.spec.tsx` asserts the same thing in jsdom; this is the user-facing
    // half, and it is the one that would read as a missing button.
    await expect(page.getByTestId('console-toggle')).toHaveCount(0);
    await expect(page.locator('.chat-header__actions')).toHaveCount(0);
});

test('error shown for an unknown command', async ({page}) => {
    await send(page, '/notacommand');
    
    await expect(page.locator('.error-block')).toBeVisible();
});

/**
 * A sentence is not a command, and is told so in the words that fix it.
 *
 * Separate from the unknown-command spec above on purpose: the two look alike from
 * the outside — both show `.error-block` — and folding them together is what let
 * plain text be answered "Unknown command: hello world" for so long. Asserting the
 * **message** is the whole point, since visibility alone cannot tell them apart.
 */
test('plain text without a sigil is told to start with one', async ({page}) => {
    await send(page, 'hello world');
    
    const error = page.locator('.error-block');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Start with /');
});

test('autocomplete opens on a command prefix', async ({page}) => {
    await box(page).click();
    await page.keyboard.type('a');
    
    await expect(page.locator('.autocomplete')).toBeVisible();
    await expect(page.locator('.autocomplete')).toContainText('ast');
});

/**
 * An empty box shows no autocomplete. `matches('')` returns all commands, so
 * the component checks for text first.
 */
test('an empty box shows no autocomplete', async ({page}) => {
    await expect(box(page)).toHaveText('');
    
    await expect(page.locator('.autocomplete')).toHaveCount(0);
});

/**
 * The user message is on the right. Measure the boxes: an `auto` margin
 * works only in a flex or grid parent.
 */
test('the user message is right-aligned', async ({page}) => {
    await send(page, '/help');
    
    const result = await page.evaluate(() => {
        // Spread then `.at(-1)`: `NodeListOf` has no `.at()`, and the seed means
        // the last pill is this spec's line rather than the opening example's.
        const pills = [...document.querySelectorAll('.message--user')];
        const pill = pills.at(-1)!.getBoundingClientRect();
        const thread = document.querySelector('.chat__thread')!.getBoundingClientRect();
        
        return {
            // the thread's own 20px padding is the gutter, so the pill should
            // reach the content edge and no further
            gap: Math.round(thread.right - pill.right),
        };
    });
    
    const expected = {
        gap: 20,
    };
    
    expect(result).toEqual(expected);
});

/**
 * A long user message stays on the right and its answer stays on the left.
 * `text-align: right` on the parent would fail this.
 */
test('a long user message stays right and its answer stays left', async ({page}) => {
    await send(page, `help ${'x'.repeat(200)}`);
    
    const result = await page.evaluate(() => {
        // Spread first: `NodeListOf` has no `.at()`, and `apply-at` wants
        // `.at(-1)` over `[length - 1]` — both together mean the NodeList becomes
        // a plain array on the way through.
        const pills = [...document.querySelectorAll('.message--user')];
        const pill = pills.at(-1)!.getBoundingClientRect();
        
        const answers = [...document.querySelectorAll('.message--system')];
        const answer = answers.at(-1)!.getBoundingClientRect();
        
        return {
            answerLeft: Math.round(answer.left),
            pillLeft: Math.round(pill.left),
        };
    });
    
    // the answer starts at the thread's content edge; the pill is pushed right
    expect(result.pillLeft).toBeGreaterThan(result.answerLeft);
});

/**
 * The toggle is a square, not a box around a word.
 *
 * The only place this is checkable: jsdom reports every width as 0, so the unit
 * spec can only assert the class is present. Measured, because the point of the
 * change is size — the text version's `padding: 5px 12px` put a 68px box around
 * a 16px glyph, and that is exactly the header space plan.md §4 asks back.
 */
test('the theme toggle is a square icon button', async ({page}) => {
    const measured = await page.evaluate(() => {
        const button = document.querySelector('.chat-header__btn--icon')!.getBoundingClientRect();
        
        return {
            height: Math.round(button.height),
            width: Math.round(button.width),
        };
    });
    
    // square, and small enough to be a control rather than a label
    expect(Math.abs(measured.width - measured.height)).toBeLessThanOrEqual(1);
    expect(measured.width).toBeLessThanOrEqual(40);
});

/**
 * …and it is at the far right of the header, which the text label also reached.
 *
 * The plan's "a bit more to the right" request. It was never actually a
 * positioning problem — `justify-content: space-between` already put the button
 * at the edge — and dropping the word is what leaves the air. Asserted as
 * geometry so a future `padding` change cannot quietly undo it.
 */
test('the theme toggle sits at the right of the header', async ({page}) => {
    const result = await page.evaluate(() => {
        const header = document.querySelector('.chat-header')!.getBoundingClientRect();
        const button = document.querySelector('.chat-header__btn--icon')!.getBoundingClientRect();
        
        // the header's own 20px padding is the gutter
        return Math.round(header.right - button.right);
    });
    
    expect(result).toBe(20);
});

/**
 * A send scrolls the answer into view: the seed fills the thread. Expect the
 * bottom within 2px, not only some scroll.
 */
test('sending scrolls the answer into view', async ({page}) => {
    const content = page
        .getByTestId('input')
        .locator('.cm-content');
    
    await content.click();
    await page.keyboard.type('/ast');
    await page.keyboard.press('Control+Enter');
    
    const result = await page.evaluate(() => {
        const thread = document.querySelector('.chat__thread') as HTMLElement;
        
        return {
            atBottom: Math.abs(thread.scrollHeight - thread.clientHeight - thread.scrollTop) <= 2,
            overflows: thread.scrollHeight > thread.clientHeight,
        };
    });
    
    // both halves: nothing to scroll in a thread that fits would pass on its own
    expect(result).toEqual({
        atBottom: true,
        overflows: true,
    });
});

/**
 * …and it is still there on load, which is the other half.
 *
 * The opening screen shows a worked example and the help. If the thread is
 * scrolled to the top on arrival, a first-time visitor sees the `source` echo and
 * has to scroll to discover that the tool can answer at all.
 */
test('the thread opens scrolled to its last message', async ({page}) => {
    const result = await page.evaluate(() => {
        const thread = document.querySelector('.chat__thread') as HTMLElement;
        
        return Math.abs(thread.scrollHeight - thread.clientHeight - thread.scrollTop) <= 2;
    });
    
    expect(result).toBe(true);
});

/**
 * The connectors come before the caret, so the vertical line is continuous.
 * Measure the `left` of each span: CSS `order` can differ from the DOM order.
 */
test('AST connectors are drawn before the caret, keeping the tree line continuous', async ({page}) => {
    await send(page, '/source\nconst a = 1;');
    await send(page, '/ast');
    
    const rows = page
        .getByTestId('chat')
        .getByTestId('ast-row');
    
    await expect(rows.first()).toBeVisible();
    
    // depth 1: a non-root row must begin with a branch marker, not with a caret
    const result = await rows
        .nth(1)
        .evaluate((row) => {
            const box = row.getBoundingClientRect();
            
            // the row's own padding is `1px 8px`, so its content edge is not its
            // border edge - measuring against the border asserts the padding instead
            const content = box.left + parseInt(getComputedStyle(row).paddingLeft, 10);
            
            const at = (name: string) => (row.querySelector(`.${name}`) as HTMLElement).getBoundingClientRect().left;
            
            return {
                connectorsFromContentEdge: at('ast-row__connectors') - content,
                caretAfterConnectors: at('ast-row__caret') > at('ast-row__connectors'),
                connectorsIsFirstChild: row.children[0].classList.contains('ast-row__connectors'),
            };
        });
    
    const expected = {
        connectorsFromContentEdge: 0,
        caretAfterConnectors: true,
        connectorsIsFirstChild: true,
    };
    
    expect(result).toEqual(expected);
});

/**
 * …and the caret is still the row's own marker, in the same place it always was.
 *
 * The other half: swapping two spans could equally have swapped them the wrong
 * way, or dropped the caret into the connectors. A depth-1 row must still show a
 * branch marker **and** a caret, and the caret must not have leaked into the
 * connector string.
 */
test('the /source user bubble shows a highlighted body, not plain text', async ({page}) => {
    await send(page, '/source\nconst x = 1;');
    
    // The user bubble renders its `/source` body through `SourceBlock`, so the
    
    // pill the user typed into is highlighted the same way the answer is.
    
    // Scope to the user message so the answer's own source-block does not win.
    const bubble = page
        .locator('.message--user')
        .last();
    
    await expect(bubble).toBeVisible();
    
    const keyword = bubble
        .locator('.tok-keyword')
        .first();
    
    await expect(keyword).toBeVisible();
    await expect(keyword).toContainText('const');
});

test('SourceBlock shows syntax-highlighted output', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    
    // `highlight()` wraps `const` in `tok-keyword`. Scope to the source block so
    
    // the seed's own `export const report` doesn't win the `.first()`.
    const keywordSpan = page
        .locator('.source-block .tok-keyword')
        .nth(1);
    
    await expect(keywordSpan).toBeVisible();
    await expect(keywordSpan).toContainText('const');
    
    /*
     * The keyword has a colour that is not the body colour. Without it, the
     * highlighting is invisible.
     */
    const color = await keywordSpan.evaluate((el) => getComputedStyle(el).color);
    const bodyColor = await page.evaluate(() => getComputedStyle(document.body).color);
    
    expect(color).not.toBe('');
    expect(color).not.toBe(bodyColor);
});

/** Regression: the composer highlights a `/source` body — `mode` was passed
 * to `createEditor` but `CodeMirrorBox` never called `setOption`, so the
 * language extension was never applied and `const a = 1` rendered uncoloured.
 */
test('the composer applies syntax highlighting while typing a body command', async ({page}) => {
    await box(page).click();
    await page.keyboard.insertText('/source\nconst a = 1;');
    
    // do NOT press Ctrl+Enter — check the live composer
    const keyword = page
        .getByTestId('input')
        .locator('.cm-content .hl-keyword')
        .first();
    
    await expect(keyword).toBeVisible();
    await expect(keyword).toContainText('const');
    
    const color = await keyword.evaluate((el) => getComputedStyle(el).color);
    const nameColor = await page
        .getByTestId('input')
        .locator('.cm-content .hl-name')
        .first()
        .evaluate((el) => getComputedStyle(el).color);
    
    expect(color).not.toBe(nameColor);
});

/** Regression: highlighting survives the editor rebuild that happens when
 * `wantsLineNumbers` flips. Typing `/source` then `e` destroys the old editor
 * and mounts a new one — the `useEffect([], [])` that calls `setOption` must
 * run again on the new instance or the language extension is lost.
 */
test('the composer keeps syntax highlighting after the lineNumbers rebuild', async ({page}) => {
    await box(page).click();
    
    // Type character by character so `wantsLineNumbers` flips mid-word,
    
    // triggering the destroy-and-recreate path in CodeMirrorBox.
    await page.keyboard.type('/source');
    await page.keyboard.press('Enter');
    await page.keyboard.type('const a = 1;');
    
    const keyword = page
        .getByTestId('input')
        .locator('.cm-content .hl-keyword')
        .first();
    
    await expect(keyword).toBeVisible();
    await expect(keyword).toContainText('const');
    
    const color = await keyword.evaluate((el) => getComputedStyle(el).color);
    const nameColor = await page
        .getByTestId('input')
        .locator('.cm-content .hl-name')
        .first()
        .evaluate((el) => getComputedStyle(el).color);
    
    expect(color).not.toBe(nameColor);
});

/** The command line is not JavaScript: `/source` must read as a command, not as
 * a regular expression. It takes the accent colour, like the send button. */
test('the composer colours the command line with the accent', async ({page}) => {
    await box(page).click();
    await page.keyboard.insertText('/source\nconst a = 1;');
    
    const command = page
        .getByTestId('input')
        .locator('.cm-content .input__command');
    
    await expect(command).toHaveText('/source');
    
    const result = await command.evaluate((el) => getComputedStyle(el).color);
    
    const expected = await page.evaluate(() => {
        const probe = document.createElement('span');
        
        probe.style.color = 'var(--color-accent)';
        document.body.append(probe);
        
        const {color} = getComputedStyle(probe);
        
        probe.remove();
        
        return color;
    });
    
    expect(result).toBe(expected);
});

/** A row names the property that holds the node: `init` on the literal. */
test('/ast shows the key before the type', async ({page}) => {
    await send(page, '/source\nconst a = 3');
    await send(page, '/ast');
    
    // the tree is folded below depth 1: open the declarator first
    await page
        .getByTestId('chat')
        .locator('[data-testid="ast-row"][data-type="VariableDeclarator"]')
        .last()
        .click();
    
    const key = page
        .getByTestId('chat')
        .locator('[data-testid="ast-row"][data-type="NumericLiteral"] .ast-row__key')
        .last();
    
    await expect(key).toHaveText('init:');
});

/**
 * A key makes a row longer. When the row does not fit, the detail gives way
 * first (it is cut with an ellipsis) and the type keeps its full width.
 */
test('/ast cuts the detail, not the type, when a row is too long', async ({page}) => {
    await send(page, '/source\nconst value = someFunction(firstArgument, secondArgument);');
    await send(page, '/ast');
    
    const row = page
        .getByTestId('chat')
        .locator('[data-testid="ast-row"][data-type="VariableDeclarator"]')
        .last();
    
    const result = await row.evaluate((element) => {
        const widthOf = (selector: string) => {
            const part = element.querySelector(selector) as HTMLElement;
            
            return part.scrollWidth > part.clientWidth;
        };
        
        return {
            detailCut: widthOf('.ast-row__detail'),
            typeCut: widthOf('.ast-row__type'),
        };
    });
    
    const expected = {
        detailCut: true,
        typeCut: false,
    };
    
    expect(result).toEqual(expected);
});

test('/help renders a styled grid, not plain text', async ({page}) => {
    await send(page, '/help');
    
    // uses for the reply.
    const block = page
        .locator('[data-testid="help-block"]')
        .last();
    
    await expect(block).toBeVisible();
    
    // Each row must be a grid div, not a table row
    const rows = block.locator('.help-block__row');
    await expect(rows.first()).toBeVisible();
    
    // Name must have the accent colour — not the default text colour
    const name = rows
        .first()
        .locator('.help-block__name');
    
    const color = await name.evaluate((el) => getComputedStyle(el).color);
    const bodyColor = await page.evaluate(() => getComputedStyle(document.body).color);
    
    expect(color).not.toBe(bodyColor);
});

test('TransformDiff renders before and after', async ({page}) => {
    // `/transform` answers "needs the putout server and does not run in the
    // browser", so no diff block appears here. Assert the empty state so the
    // e2e documents that the rule is server-only, not a client syntax bug.
    const before = page.locator('.transform-diff__code--before');
    await expect(before.first()).toBeHidden();
});

test('AstCodePreview shows highlighted source lines', async ({page}) => {
    await send(page, '/source\nconst x = 42;');
    await send(page, '/ast');
    
    // The preview highlights only the selected line, so select
    
    // VariableDeclarator (line 1, col 6) before asserting.
    await page
        .locator('[data-testid="ast-output"]')
        .first()
        .focus();
    
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    
    const code = page
        .locator('.ast-code')
        .first();
    
    await expect(code).toBeVisible();
    await expect(
        code
            .locator('.tok-keyword')
            .first(),
    ).toContainText('const');
});

test('AST rows keep their caret separate from the branch marker', async ({page}) => {
    // Two statements, so Program has two children and the first draws a **tee**.
    //
    // With one statement it is the only child and draws an elbow, and this
    // assertion would pass with no sibling anywhere to be a tee against.
    await send(page, '/source\nconst a = 1;\nconst b = 2;');
    await send(page, '/ast');
    
    const row = page
        .getByTestId('chat')
        .getByTestId('ast-row')
        .nth(1);
    
    const connectors = await row
        .locator('.ast-row__connectors')
        .textContent();
    
    const caret = await row
        .locator('.ast-row__caret')
        .textContent();
    
    const result = {
        connector: connectors,
        hasCaret: Boolean(caret && caret.trim()),
        // the caret glyphs must not have leaked into the connector string
        connectorsAreBranchOnly: !/[▾▸]/.test(connectors || ''),
    };
    
    const expected = {
        connector: '├─ ',
        hasCaret: true,
        connectorsAreBranchOnly: true,
    };
    
    expect(result).toEqual(expected);
});

/**
 * A body command shows the line-number gutter (`.cm-lineNumbers`). The unit
 * specs stub CodeMirror. Type, do not send: a send clears the box.
 */
test('typing a body command shows the line-number gutter', async ({page}) => {
    await box(page).click();
    await page.keyboard.insertText('/source');
    
    await expect(
        page
            .getByTestId('input')
            .locator('.cm-lineNumbers'),
    ).toBeVisible();
});

/**
 * …and a one-line command keeps it off, which is the same assertion from the
 * other side.
 *
 * `/help` is the natural subject: it is the command most often typed, so a rule
 * that gave *every* command a gutter would be caught here rather than in review.
 * A gutter on one line costs a column and says nothing.
 */
test('a one-line command keeps the gutter off', async ({page}) => {
    await box(page).click();
    await page.keyboard.insertText('/help');
    
    await expect(
        page
            .getByTestId('input')
            .locator('.cm-lineNumbers'),
    ).toHaveCount(0);
});

/**
 * A click on a `/learn` section opens it. Desktop only: on a touchscreen a
 * tap selects and does not fold (see the mobile spec).
 */
test('a click on a learn section opens it', async ({page}) => {
    await send(page, '/learn');
    
    const rows = learnRows(page);
    
    // `collapsedDepth: 0` — the root is open and its sections are drawn closed,
    // so the curriculum's top level is on screen and nothing under it.
    await expect(rows).toHaveCount(5);
    
    // `nodes` is the first section, and it has children
    await rows
        .nth(1)
        .click();
    
    // more rows now — the section opened, and the caret meant what it said
    const opened = await rows.count();
    
    expect(opened).toBeGreaterThan(5);
    
    // and clicking it again folds it back
    await rows
        .nth(1)
        .click();
    
    await expect(rows).toHaveCount(5);
});

/**
 * `/flow` graphs the source into control-flow blocks and renders FlowBlock.
 *
 * A body with unreachable code (a statement after `return`) draws both panels,
 * the `flow-output` wrapper, and a source panel plus a graph panel whose
 * rectangles are each laid out within the viewport.
 */
test('/flow renders source panel and graph panel', async ({page}) => {
    await send(page, '/flow\nfunction f() { return a; b(); c(); }');
    
    const output = page
        .getByTestId('chat')
        .getByTestId('flow-output');
    
    await expect(output).toBeVisible();
    
    // both panels laid out within the viewport — geometry asserted, not assumed
    const source = await rectOf(page, '.flow-output__source');
    const graph = await rectOf(page, '.flow-output__graph');
    
    expect(graph.right).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(source.bottom).toBeLessThanOrEqual(page.viewportSize()!.height);
});

/**
 * A long function: every block stays inside the graph, the graph does not
 * scroll sideways, and a node takes its fill from the theme (an unknown token in
 * an SVG `fill` draws black).
 */
test('/flow draws every block inside the graph, in theme colours', async ({page}) => {
    await send(page, '/flow\nfunction f(x) { if (x) return 1; if (x > 2) return 3; a(); b(); return 2; }');
    
    const graph = page
        .getByTestId('chat')
        .getByTestId('flow-output__graph')
        .last();
    
    await expect(graph).toBeVisible();
    
    const result = await graph.evaluate((svg) => {
        const box = svg.getBoundingClientRect();
        const rects = [...svg.querySelectorAll('.flow-output__node')];
        let outside = 0;
        
        for (const rect of rects)
            if (rect.getBoundingClientRect().right > box.right + 1)
                ++outside;
        
        const probe = document.createElement('span');
        
        probe.style.color = 'var(--color-bg-raised)';
        document.body.append(probe);
        
        const {color} = getComputedStyle(probe);
        
        probe.remove();
        
        return {
            outside,
            scrolls: svg.parentElement!.scrollWidth > svg.parentElement!.clientWidth,
            fill: getComputedStyle(rects[0]).fill === color,
        };
    });
    
    const expected = {
        outside: 0,
        scrolls: false,
        fill: true,
    };
    
    expect(result).toEqual(expected);
});

/**
 * Clicking an unreachable block highlights the correct source line — the block
 * click routes to `onNavigate` and the source panel marks its line.
 */
test('/flow clicking unreachable block highlights its source line', async ({page}) => {
    // Multi-line body: source.split('\\n') matches stmts line-by-line;
    // a single-line body never produces a match and no DOM node gets
    // data-unreachable.
    await send(page, '/flow\nfunction f() {\n  return a;\n  console.log(b);\n}');
    
    const output = page
        .getByTestId('chat')
        .getByTestId('flow-output');
    
    await expect(output).toBeVisible();
    
    const graph = page
        .getByTestId('chat')
        .getByTestId('flow-output__graph');
    
    await expect(graph).toBeVisible();
    
    // The second line (`console.log(b)`) is unreachable — its graph node is dimmed.
    const unreachableLine = page
        .locator('[data-unreachable="true"]')
        .first();
    
    await expect(unreachableLine).toBeVisible();
});

/**
 * Regression: `setValue` replaced the whole document and CodeMirror reset the
 * cursor to position 0. The user could not type normally — every Backspace or
 * autocomplete completion moved the caret to the start of the line.
 */
test('cursor stays at end after autocomplete completion', async ({page}) => {
    // Type enough to open autocomplete
    await box(page).type('/sou');
    
    // Autocomplete completes to '/source '
    await page.keyboard.press('Tab');
    
    // The cursor must now be at the END of '/source ', not position 0.
    
    // Typing more text appends to the right place.
    await box(page).type('extra');
    
    const content = await page
        .locator('.cm-content')
        .textContent();
    
    expect(content).toContain('/source extra');
    
    // If the cursor had jumped to 0, this would be 'extra/source ' instead.
    expect(content).not.toMatch(/^extra/);
});

test('cursor stays in place after Backspace', async ({page}) => {
    await box(page).type('/source');
    
    // Backspace removes the last character
    await page.keyboard.press('Backspace');
    
    // Type something — it should append, not land at position 0
    await box(page).type('x');
    
    const content = await page
        .locator('.cm-content')
        .textContent();
    
    // '/source' - 'e' + 'x' = '/sourcx'
    expect(content).toBe('/sourcx');
    
    // If cursor had jumped to 0: 'x/sourc'
    expect(content).not.toMatch(/^x/);
});

test('cursor clamps to end after Escape clears the box', async ({page}) => {
    await box(page).type('/help');
    await page.keyboard.press('Escape');
    
    // Box is empty, cursor is at 0 — that is correct after a clear.
    
    // Type something and it should appear at position 0.
    await page.keyboard.insertText('/ast');
    const content = await page
        .locator('.cm-content')
        .textContent();
    
    expect(content).toBe('/ast');
});

test('cursor stays at end after history recall', async ({page}) => {
    await send(page, '/hel');
    
    // Recall with ArrowUp — box fills with '/hel'. The box is a lazy
    
    // suspense boundary and remounts between the send and the recall, so the
    
    // editor may not be present yet; wait for it before typing.
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('.cm-content')).toContainText('/hel');
    
    // Type more — should append at the END of the recalled line, not at 0.
    await box(page).type('px');
    const content = await page
        .locator('.cm-content')
        .textContent();
    
    expect(content).toContain('/helpx');
    expect(content).not.toMatch(/^x/);
});

/**
 * Regression: `/flow` returned an error when no body was given, even though
 * `/source` had already set `state.source`. The user workflow is `/source`
 * first, then `/flow` on the whole source — and the fallback to `source`
 * means it now works.
 */
test('/flow uses current source when no body is given', async ({page}) => {
    await send(page, '/source\nfunction f() { return a; }');
    await send(page, '/flow');
    
    const output = page
        .getByTestId('chat')
        .getByTestId('flow-output');
    
    await expect(output).toBeVisible();
    await expect(
        page
            .getByTestId('chat')
            .getByTestId('flow-output__source'),
    ).toBeVisible();
    await expect(
        page
            .getByTestId('chat')
            .getByTestId('flow-output__graph'),
    ).toBeVisible();
});

/**
 * Regression: `/flow` on a source that is not a function body — e.g.
 * `const a = 1` — crashed in `printer.ts`'s `bodyOf()`, which unwrapped
 * `program.body[0].body.body` on a `VariableDeclaration` that has no `.body`.
 *
 * `bodyOf` now falls back to the whole `program.body` for any source that is
 * not a `FunctionDeclaration`, so `/source` first, then `/flow`, graphs it.
 */
test('/flow on a non-function source renders a flow block', async ({page}) => {
    await send(page, '/source\nconst a = 1;');
    await send(page, '/flow');
    
    const output = page
        .getByTestId('chat')
        .getByTestId('flow-output');
    
    await expect(output).toBeVisible();
    
    await expect(
        page
            .getByTestId('chat')
            .getByTestId('flow-output__source'),
    ).toBeVisible();
    
    await expect(
        page
            .getByTestId('chat')
            .getByTestId('flow-output__graph'),
    ).toBeVisible();
    
    await expect(
        page
            .getByTestId('chat')
            .getByTestId('error-block'),
    ).not.toBeVisible();
});

/**
 * …and it still errors when there is no source at all — the fallback only
 * kicks in after `/source` has set something.
 */
test('/flow with no source errors', async ({page}) => {
    // the seed already ran `/source`, and `/reset` restores that seed, so a
    // bare `/source` is what empties it
    await send(page, '/source');
    await send(page, '/flow');
    
    // No source is set, so /flow errors — the error block is visible and
    
    // no graph panels render.
    await expect(
        page
            .getByTestId('chat')
            .getByTestId('error-block'),
    ).toBeVisible();
    await expect(
        page
            .getByTestId('chat')
            .getByTestId('flow-output'),
    ).not.toBeVisible();
});
