import {
    test,
    expect,
    type Page,
} from './test.ts';

const box = (page: Page) => page.getByRole('textbox');

/**
 * `fill` then `Ctrl+Enter`, not `type` then `Enter`: `fill` sets the value in one
 * go, and a multi-line `source` body would otherwise be typed key by key, so
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
 * `ast` answers twice — once as a message and once in the panel — so every
 * `ast-*` testid on the page is duplicated the moment `ast` has run, and a bare
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

/**
 * How many `.message--user` the seed puts on the page before anything is typed.
 *
 * **Two**: the worked `source` example and the `help` that follows it. Each is a
 * pair of an echo and an answer, and the echo is a user pill — so the seed is
 * two pills, not one, which is the sort of thing to count once here rather than
 * to discover as a failing spec. Every count below is this **plus** what the
 * spec sent, rather than a bare number: a literal `1` would assert the old blank
 * start screen, and a literal `3` would assert today's seed and break the day
 * the seed changes.
 */
const SEEDED_USER_MESSAGES = 2;

/**
 * The full geometry of one element, in CSS pixels.
 *
 * `left`/`right` alone cannot say "inside the box" — that needs `top` and
 * `bottom` as well, and the composer's assertion is two-dimensional: the send
 * button has to be within the textarea on *both* axes, or it is beside it on
 * one and inside on the other.
 *
 * `getBoundingClientRect()` rather than `offsetWidth`/`scrollWidth`, which
 * round and include overflow respectively without saying where anything is.
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
 * The send button inside the textarea, which is Claude's shape and the reason
 * the flex row went away.
 *
 * A **containment** assertion, not a position one: the plan asked for
 * `send.right <= box.right + 2`, which is true for the old 46px button too as
 * long as the textarea is wide — a 720px-wide desktop textarea swallowed a
 * button sitting *outside* it without complaint. Containment is what actually
 * distinguishes "in the corner" from "next to it", and it fails the old layout
 * on the vertical axis, where the old button's bottom was 18px below the box's.
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
 * The button must not sit *on* the text.
 *
 * Containment alone would pass for a button laid over the middle of the box.
 * What makes it a composer is that the text keeps a right margin the button
 * fits in, so the padding is at least the button's width — and this is the
 * assertion that catches `.input__box { padding-right: 52px }` being dropped
 * while the button stays absolutely positioned.
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

test('shows ast tree for pasted source', async ({page}) => {
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
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
    await send(page, 'ast');
    
    await expect(tree(page)).toBeVisible();
    await expect(tree(page)).toContainText('Program');
});

test('search filters tree', async ({page}) => {
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
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

/**
 * The assertion the old `search filters tree` never made.
 *
 * That spec was green throughout and asserted rows and dimming — so a filter
 * that kept everything, and a highlight that was wired to nothing, both passed
 * it. This asks for the *class*: the rows that matched must be marked, and the
 * ancestors on the way to them must not be. A filter working and highlighting
 * nothing is exactly what shipped.
 */
test('search marks the rows that matched', async ({page}) => {
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
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
 * `ArrowRight` and `ArrowLeft`, over the real key handler rather than the pure
 * moves the unit specs cover — this is the only place the binding itself is
 * exercised, and a binding that was never wired passes every pure test.
 *
 * The count is the assertion: expanding a folded node adds rows, folding it
 * takes them away, and the selection is what decides which.
 */

/**
 * `ArrowRight` and `ArrowLeft`, over the real key handler rather than the pure
 * moves the unit specs cover — this is the only place the binding itself is
 * exercised, and a binding that was never wired passes every pure test.
 *
 * `defaultCollapsed` folds everything below depth 1, so `Program` and
 * `VariableDeclaration` are open and `VariableDeclarator` is shut. Three
 * `ArrowDown`s land on it, and it is the first row with children of its own
 * still hidden — which is why the assertion starts from its caret rather than
 * from a row count that would be right by accident one row earlier.
 */
test('ArrowRight expands and ArrowLeft folds the tree', async ({page}) => {
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
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
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
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
 * The tab cycle, over real focus rather than over the component's state.
 *
 * `toBeFocused()` is the whole point: `useTreeState` only owns a `focus`
 * *string*, and a handler that set it while real focus stayed on the tree would
 * pass every unit spec here. This is the check that the string and the caret
 * agree.
 *
 * `Tab` in the tree is `preventDefault`ed, so the browser does not also walk its
 * own tab order — the assertion is that the *filter* has focus, not merely that
 * focus moved.
 */
test('Tab moves focus from the tree to the filter, and back', async ({page}) => {
    await send(page, 'ast');
    
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
 * `k` from the first row hands over to the filter — the same handover as `Tab`,
 * reached with the key a vim user presses, and the other half of the cycle.
 *
 * `ArrowDown` first to put a row under the caret; the default fold leaves two
 * rows drawn, so the first `ArrowDown` lands on `Program` and the second is the
 * one that would have walked to `VariableDeclaration`. This presses it and
 * asserts the filter took focus instead, which is the behaviour the plan's
 * diagram specifies and its prose gets wrong.
 */
test('k from the first row moves focus to the filter', async ({page}) => {
    await send(page, 'ast');
    
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
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
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
 * The desktop keeps **both** halves of the hint: the full text, and the code
 * preview beside the tree.
 *
 * The counterpart to the four mobile specs. A `@media (pointer: coarse)` block
 * that leaked — an unclosed brace, or a selector that matched more than it
 * meant to — would leave the desktop with one column and a hidden preview, and
 * every mobile spec would stay green because they only ever run on a phone.
 */
test('ast shows the full hint and the code preview on desktop', async ({page}) => {
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
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
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
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
 * Two categories render two colours.
 *
 * The assertion the plan asks for, and the only one that can be made about a
 * colour: `getComputedStyle` needs a real cascade, so jsdom is out and this is
 * an e2e. "Different" rather than a hex value, because the same token resolves
 * differently in light and dark and a literal would pin the theme as well as
 * the hue.
 *
 * `declaration` and `statement` are the pair because `VariableDeclaration` and
 * `Program` are both on screen in every `ast` reply, so the spec needs no
 * fixture beyond `send(page, 'ast')`.
 */
test('ast row type colour differs by category', async ({page}) => {
    await send(page, 'ast');
    
    const colourOf = (category: string) => page
        .getByTestId('chat')
        .locator(`[data-category="${category}"] .ast-row__type`)
        .first()
        .evaluate((element) => getComputedStyle(element).color);
    
    const result = await colourOf('statement');
    const expected = await colourOf('declaration');
    
    expect(result).not.toBe(expected);
});

/**
 * Every drawn category renders its own colour.
 *
 * One pair would pass on a stylesheet that colours statements and declarations
 * and leaves everything else on the accent, so this is a **count of distinct
 * colours across distinct categories** — and the categories are read off the
 * drawn rows rather than named, so a category nothing matched cannot be counted
 * as if it had.
 *
 * That is the first version's bug: it probed four named categories and got 3
 * distinct colours out of 4, because two probes returned `null` for rows the
 * default fold had hidden — and `null` was accepted as a colour. So this walks
 * what is actually on screen, which cannot produce a `null`, and asserts that at
 * least four categories are there — the tree is expanded first, or a two-row
 * default view has nothing to compare.
 */
test('each drawn category renders a distinct colour', async ({page}) => {
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
    await page
        .locator('[data-testid="ast-output"]')
        .first()
        .focus();
    
    // `l` expands where it stands, then walks in. Five presses reach Program,
    // VariableDeclaration and VariableDeclarator.
    
    // That is what brings `Identifier` and `ArrowFunctionExpression` out from
    // under the default fold.
    
    for (const key of ['l', 'l', 'l', 'l', 'l'])
        await page.keyboard.press(key);
    
    const measured = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('.ast-row[data-category]')];
        
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
            const type = document.querySelector(
                `.ast-row[data-category="${category}"] .ast-row__type`,
            ) as HTMLElement;
            
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
 * A matched row keeps its category colour.
 *
 * The plan's own trap: `.ast-row--match` sets `color` on the **row**, and if it
 * reached `.ast-row__type` the amber highlight would flatten every filtered type
 * to one colour and the whole scheme would stop working the moment you searched.
 * This asserts the cascade resolves in the right direction rather than trusting
 * the reasoning, because "it should be fine by specificity" is exactly the kind
 * of claim that is fine until someone adds `!important`.
 */
test('a matched row keeps its category colour', async ({page}) => {
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
    await search(page).fill('VariableDeclaration');
    
    const result = await page.evaluate(() => {
        const matched = document.querySelector(
            '.ast-row--match[data-category="declaration"] .ast-row__type',
        ) as HTMLElement;
        
        const dimmed = document.querySelector(
            '.ast-row--dimmed[data-category="statement"] .ast-row__type',
        ) as HTMLElement;
        
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
    
    await send(page, 'console');
    
    await expect(page.locator('.console-panel')).toBeVisible();
});

test('the panel ✕ closes the console', async ({page}) => {
    await send(page, 'console');
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
    
    await send(page, 'source\nconst add = (a, b) => a + b;');
    await send(page, 'ast');
    
    // The tree is in the thread — that is what `shows ast tree for pasted
    
    // source` asserts — so the panel opening here would be a duplicate taking
    
    // half the thread.
    await expect(page.locator('.console-panel')).toHaveCount(0);
});

test('Ctrl+Enter sends the line', async ({page}) => {
    await box(page).fill('help');
    await page.keyboard.press('Control+Enter');
    
    await expect(userMessages(page)).toHaveCount(SEEDED_USER_MESSAGES + 1);
    await expect(box(page)).toHaveValue('');
});

test('Enter sends the line on a keyboard', async ({page}) => {
    await box(page).fill('help');
    await page.keyboard.press('Enter');
    
    await expect(userMessages(page)).toHaveCount(SEEDED_USER_MESSAGES + 1);
    await expect(box(page)).toHaveValue('');
});

test('Shift+Enter builds a multi-line /source body', async ({page}) => {
    await box(page).fill('source\nconst a = 1;');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.insertText('const b = 2;');
    
    await expect(box(page)).toHaveValue('source\nconst a = 1;\nconst b = 2;');
    
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
    await box(page).fill('help');
    await page
        .getByTestId('send')
        .click();
    
    await expect(userMessages(page)).toHaveCount(SEEDED_USER_MESSAGES + 1);
    await expect(box(page)).toHaveValue('');
});

test('console again hides the panel', async ({page}) => {
    await send(page, 'console');
    await expect(page.locator('.chat-console')).toBeVisible();
    
    await send(page, 'console');
    
    await expect(page.locator('.chat-console')).toHaveCount(0);
});

test('up arrow recalls the last sent line', async ({page}) => {
    await send(page, 'help');
    
    await expect(box(page)).toHaveValue('');
    
    await box(page).press('ArrowUp');
    
    await expect(box(page)).toHaveValue('help');
});

test('the header has no console toggle button', async ({page}) => {
    // `App.spec.tsx` asserts the same thing in jsdom; this is the user-facing
    // half, and it is the one that would read as a missing button.
    await expect(page.getByTestId('console-toggle')).toHaveCount(0);
    await expect(page.locator('.chat-header__actions')).toHaveCount(0);
});

test('error shown for an unknown command', async ({page}) => {
    await send(page, 'notacommand');
    
    await expect(page.locator('.error-block')).toBeVisible();
});

test('autocomplete opens on a command prefix', async ({page}) => {
    await box(page).fill('a');
    
    await expect(page.locator('.autocomplete')).toBeVisible();
    await expect(page.locator('.autocomplete')).toContainText('ast');
});

/**
 * An **empty** box shows no dropdown, which is the other half of the rule.
 *
 * `matches('')` answers every command, so the list is reachable through the
 * function; the component gates on a non-empty box so an idle composer is
 * quiet. A dropdown hanging over an empty input on page load would be the
 * behaviour to prevent — it is the reason the gate exists, and it is invisible
 * in every other spec because they all type first.
 */
test('an empty box shows no autocomplete', async ({page}) => {
    await expect(page.getByTestId('input')).toHaveValue('');
    
    await expect(page.locator('.autocomplete')).toHaveCount(0);
});

/**
 * The user's own line is on the **right**, which is what the bubble shape says.
 *
 * Measured, not asserted from the stylesheet. `.message--user` carried
 * `display: inline-block; margin-left: auto`, and an `auto` margin only does
 * anything inside a flex or grid box — its parent `.chat__message` was a plain
 * block, so the pill sat at the left edge and the rounded end was meaningless.
 * A test on `align-self` would have passed without the browser agreeing, so this
 * reads the two boxes and compares where they end.
 */
test('the user message is right-aligned', async ({page}) => {
    await send(page, 'help');
    
    const result = await page.evaluate(() => {
        const pills = document.querySelectorAll('.message--user');
        const pill = pills[pills.length - 1].getBoundingClientRect();
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
 * A **long** line is right-aligned too, not just a short one.
 *
 * The obvious half-measure fix is `text-align: right` on the parent, which
 * right-aligns the system answers as well — every one of them reads as
 * something the tool said rather than something the user typed. This sends a
 * line long enough to hit the `max-width: 85%` cap and checks the answer below
 * it is still on the left, so the two roles cannot be confused by a fix.
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
 * Sending scrolls the answer into view.
 *
 * Found by screenshotting the page after the work above, and it is the worst
 * defect in this file: a user types `ast`, presses send, and **nothing appears to
 * happen** — the tree renders below the fold of a thread that was already full.
 * Measured: `scrollTop` stays `0` after a send, with `scrollHeight` 849 against a
 * 568px box.
 *
 * It is not new, and the seed is why nobody had to notice: an empty thread fits
 * its box, so early on every answer was on screen for free. The seeded `source`
 * example and the help together are 849px of content in a 568px box, which makes
 * the shortfall permanent rather than occasional.
 *
 * `within` 2px of the bottom rather than "scrolled at all": a thread that scrolls
 * to some arbitrary offset would pass a weaker check and still hide the answer.
 */
test('sending scrolls the answer into view', async ({page}) => {
    const box = page.getByRole('textbox');
    
    await box.fill('ast');
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
