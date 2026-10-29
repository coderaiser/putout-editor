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
 * The thread is not empty on load — it opens seeded with a worked `source`
 * example — so a bare `toHaveCount(0)` for "nothing was sent" would pass on a
 * build that sent the line and failed on a build that did not, purely by
 * counting the seed. `SEEDED` is that count, so "no new message" is expressed
 * as "still only the seed" and the assertion is about what the spec did.
 */
const SEEDED = 2;

const userMessages = (page: Page) => page.locator('.message--user');

/**
 * `getBoundingClientRect()` rather than `offsetWidth` or `scrollWidth`: the first
 * rounds to an integer, the second includes overflow but does not say *where* it
 * is, and neither reports the left edge — so "the send button hangs off the
 * right" cannot be told from "something else does" with either. The plan's
 * numbers came from this.
 */
const rectOf = async (page: Page, selector: string) => {
    const result = await page
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
    
    return result;
};

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

/** The width of `iPhone 12`, and the number every assertion below is written against. */
const VIEWPORT = 390;

/**
 * Compare `scrollWidth`, not `innerWidth`: the viewport width does not
 * change. Wait for `.input` first: before React mounts, `scrollWidth` is the
 * viewport width and the check passes on a wide layout. See
 * `docs/testing.md`.
 */
test('the composer fits the viewport width', async ({page}) => {
    await expect(page.getByTestId('input')).toBeVisible();
    
    const result = await page.evaluate(() => document.documentElement.scrollWidth);
    
    const expected = VIEWPORT;
    
    expect(result).toBe(expected);
});

test('the send button is on screen', async ({page}) => {
    const {right} = await rectOf(page, '.input__send');
    const expected = {
        onScreen: right <= VIEWPORT,
        right,
    };
    
    expect(expected.onScreen).toBe(true);
});

/**
 * On a touchscreen too, the send button is inside the textarea. The size of
 * the hit area has its own spec.
 */
test('the send button sits inside the textarea boundary on a touchscreen', async ({page}) => {
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
 * A 32px button with a 44px hit area. Scan a row and a column with
 * `document.elementFromPoint` and count the button pixels. A corner probe at
 * `right + 6` is on the exclusive edge.
 */
test('the send button has a thumb-sized hit area on a touchscreen', async ({page}) => {
    const send = await rectOf(page, '.input__send');
    
    const hit = await page.evaluate(({top, right, bottom, left}) => {
        // inside `evaluate`, so these cannot come from module scope: the function
        // body is serialised and run in the page.
        const HIT = '#';
        const MISS = '.';
        
        // 8px past each painted edge: enough to see past the 32px button, and
        // short of the textarea's own 12px padding so nothing else claims it.
        const slop = 8;
        
        // A character rather than a boolean, so the scan can accumulate a count
        // without an `if` on a truthy value at every pixel.
        const mark = (x: number, y: number) => {
            const element = document.elementFromPoint(x, y);
            
            return element && element.closest('.input__send') ? HIT : MISS;
        };
        
        const middleX = (left + right) / 2;
        const middleY = (top + bottom) / 2;
        
        let width = 0;
        
        // a horizontal row through the middle of the button
        for (let x = Math.floor(left - slop); x <= Math.floor(right + slop); x++)
            if (mark(x, middleY) === HIT)
                width++;
        
        let height = 0;
        
        // a vertical column through the middle of the button
        for (let y = Math.floor(top - slop); y <= Math.floor(bottom + slop); y++)
            if (mark(middleX, y) === HIT)
                height++;
        
        return {
            height,
            width,
        };
    }, send);
    
    const expected = {
        height: 44,
        width: 44,
    };
    
    expect(hit).toEqual(expected);
});

/**
 * The textarea keeps a right margin for the button.
 *
 * Containment would pass for a button laid over the middle of the box; the
 * padding is what stops the text running under it.
 */
test('the textarea reserves room for the send button on a touchscreen', async ({page}) => {
    const send = await rectOf(page, '.input__send');
    
    const padding = await page
        .locator('.input__box')
        .first()
        .evaluate((element) => {
            const {paddingRight} = getComputedStyle(element);
            
            return parseInt(paddingRight, 10);
        });
    
    const result = {
        fitsIn: padding >= send.right - send.left,
    };
    
    const expected = {
        fitsIn: true,
    };
    
    expect(result).toEqual(expected);
});

/**
 * The left padding is the thread gutter, not the 52px button lane: on a
 * 390px phone that is a seventh of the composer.
 */
test('the textarea placeholder is not pushed right by the button lane', async ({page}) => {
    // Wait for `.cm-content`: before the stylesheet applies, `paddingLeft` is `''`.
    await expect(page.locator('.input__box .cm-content')).toBeVisible();
    
    const padding = await page
        .locator('.input__box')
        .first()
        .evaluate((element) => {
            const {paddingLeft} = getComputedStyle(element);
            
            return parseInt(paddingLeft, 10);
        });
    
    expect(padding).toBe(16);
});

test('the autocomplete dropdown is on screen', async ({page}) => {
    // A **prefix**, not an empty box: there is no sigil to type any more, so the
    // dropdown opens on a command name being started — and an empty box is
    // deliberately quiet, which is the other half of that rule.
    await box(page).click();
    await page.keyboard.type('c');
    
    const {left, right} = await rectOf(page, '.autocomplete');
    const expected = {
        left,
        right,
        withinViewport: left >= 0 && right <= VIEWPORT,
    };
    
    expect(expected.withinViewport).toBe(true);
});

/**
 * Vertical geometry: the composer is at the bottom and the thread fills the
 * space under the header. `getBoundingClientRect()` and
 * `page.viewportSize()` use the same unit.
 */
test('the thread fills the space under the header', async ({page}) => {
    await expect(page.getByTestId('input')).toBeVisible();
    
    const measured = await page.evaluate(() => {
        const of = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
        
        return {
            headerBottom: Math.round(of('.chat-header').bottom),
            threadTop: Math.round(of('.chat__thread').top),
            threadHeight: Math.round(of('.chat__thread').height),
            bodyHeight: Math.round(of('.chat-app__body').height),
        };
    });
    
    // The thread starts where the header ends, and fills the body it is given.
    // `> 0` was the first version and it was **too weak to fail**: collapsing
    // `.chat` to zero still leaves the thread's own 48px of padding, so it
    // measured 48 and passed. Measured against the body instead — 534 of 611
    // today — a collapse reads as 48 of 611 and cannot pass.
    const expected = {
        threadStartsUnderHeader: true,
        threadFillsMostOfTheBody: true,
    };
    
    expect({
        threadStartsUnderHeader: measured.threadTop === measured.headerBottom,
        threadFillsMostOfTheBody: measured.threadHeight > measured.bodyHeight / 2,
    }).toEqual(expected);
});

/**
 * The composer sits at the bottom, not floating.
 *
 * `gap` is `viewportHeight - input.bottom`, and it is **0** today — the composer's
 * bottom edge *is* the viewport's bottom edge. The threshold of 120 is slack, not
 * a target: it catches a composer stranded mid-page without turning a one-pixel
 * rounding difference into a failure.
 */
test('the composer is at the bottom of the viewport', async ({page}) => {
    await expect(page.getByTestId('input')).toBeVisible();
    
    const measured = await page.evaluate(() => {
        const {bottom} = document.querySelector('.input')!.getBoundingClientRect();
        
        return Math.round(globalThis.innerHeight - bottom);
    });
    
    const expected = 0;
    
    expect(measured).toBe(expected);
});

/**
 * The send button is below the header and above the fold.
 *
 * Measured: `top` 600, `bottom` 646, on a 664px viewport. The `52` in the lower
 * bound is the header's height — the button must not be behind it, which is what
 * a collapsed thread looks like.
 */
test('the send button is below the header and above the fold', async ({page}) => {
    await expect(page.getByTestId('send')).toBeVisible();
    
    const measured = await page.evaluate(() => {
        const {top, bottom} = document.querySelector('[data-testid="send"]')!.getBoundingClientRect();
        
        return {
            top: Math.round(top),
            viewportHeight: globalThis.innerHeight,
            withinViewport: bottom <= globalThis.innerHeight,
        };
    });
    
    // The button belongs in the **lower half** of the viewport, not merely below
    // the header. `top > 52` was the first version and it was too weak to fail:
    // a collapsed `.chat` puts the button at y≈101, which clears 52 and passes.
    // Measured today: top 600 of 664. A collapse reads as 101 of 664.
    const expected = {
        inLowerHalf: true,
        withinViewport: true,
    };
    
    expect({
        inLowerHalf: measured.top > measured.viewportHeight / 2,
        withinViewport: measured.withinViewport,
    }).toEqual(expected);
});

/**
 * The document does not scroll: `.chat-app` uses `100dvh`, which changes when
 * the page scrolls. The thread scrolls itself.
 */
test('the document does not scroll', async ({page}) => {
    const measured = await page.evaluate(() => document.documentElement.scrollHeight <= globalThis.innerHeight + 1);
    const expected = true;
    
    expect(measured).toBe(expected);
});

/**
 * A sentence is not a command. Send with a tap, the way a phone user sends.
 * Check the message: an unknown command also shows `.error-block`.
 */
test('a sentence is told to start with a sigil on a touchscreen', async ({page}) => {
    await box(page).click();
    await page.keyboard.type('hello world');
    await page
        .getByTestId('send')
        .tap();
    
    const error = page.locator('.error-block');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Start with /');
});

test('air between a command and its answer', async ({page}) => {
    await send(page, '/help');
    
    const result = await page.evaluate(() => {
        const pills = [...document.querySelectorAll('.message--user')];
        const user = pills.at(-1)!.getBoundingClientRect();
        
        const answers = [...document.querySelectorAll('.chat__message .message:not(.message--user)')];
        const answer = answers.at(-1)!.getBoundingClientRect();
        
        return answer.top - user.bottom;
    });
    
    const expected = 8;
    
    expect(result).toBeGreaterThanOrEqual(expected);
});

/**
 * The other half of the binding, and the reason the desktop one exists.
 *
 * `devices['iPhone 12']` reports `(pointer: coarse)`, so `Enter` is a newline
 * here — the virtual keyboard's own return key, with no chord available to send
 * anything else. The two specs are in two projects because a binding chosen by
 * pointer type is not a binding one project can check.
 */
test('Enter is a newline on a touchscreen, and sends nothing', async ({page}) => {
    await box(page).click();
    await page.keyboard.type('/help');
    await page.keyboard.press('Enter');
    
    // A newline does not send. `toHaveText` drops the trailing break; the count checks the send.
    await expect(box(page)).toHaveText('/help\n');
    await expect(userMessages(page)).toHaveCount(SEEDED);
});

test('Ctrl+Enter sends on a touchscreen too', async ({page}) => {
    await box(page).click();
    await page.keyboard.type('/help');
    await page.keyboard.press('Control+Enter');
    
    await expect(userMessages(page)).toHaveCount(SEEDED + 1);
    await expect(box(page)).toHaveText('');
});

/**
 * The code preview is hidden on a touchscreen. Use `toBeHidden()`, not
 * `toHaveCount(0)`: the element is mounted with `display: none`.
 */
test('ast hides the code preview on a touchscreen', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    const preview = page
        .getByTestId('chat')
        .locator('.ast-code');
    
    await expect(preview).toBeHidden();
});

/**
 * In the console panel on a touchscreen, a tap selects a row and does not
 * fold it. `space` folds. Scope to `.console-panel`: `ast` also puts a tree
 * in the thread. The seed sets the buffer, so `/ast` alone works.
 */
test('a tap in the console panel selects and toggles a row', async ({page}) => {
    await send(page, '/ast');
    await send(page, '/console');
    
    const panel = page.locator('.console-panel');
    const rows = panel.getByTestId('ast-row');
    
    // `useTreeState` folds everything below depth 1, and a collapsed row is
    // still **drawn** — so the seed's rule gives six visible rows rather than
    // the two a `Program` and its first child alone would.
    const initialCount = await rows.count();
    
    // `ExportNamedDeclaration` is depth 1 with children, so its fold is visible
    await rows
        .nth(1)
        .tap();
    
    // selected, AND toggled — count changed
    await expect(rows.nth(1)).toHaveClass(/ast-row--selected/);
    const afterTap = await rows.count();
    
    expect(afterTap).not.toBe(initialCount);
    
    // `space` folds it back — the fold was the tap's to do
    await panel
        .getByTestId('ast-output')
        .press(' ');
    
    // back to the folded state
    await expect(rows).toHaveCount(initialCount);
});

/**
 * The panel's status bar, which is the other thing `mobile` decides.
 *
 * The full hint is 62 characters, wraps to four lines on a 390px screen and
 * teaches `jk` and `tab switch` — keys a touchscreen does not have. The thread's
 * copy showed the short one; the panel's did not, because it never received the
 * prop.
 */
test('the console panel shows the short hint on a touchscreen', async ({page}) => {
    await send(page, '/ast');
    await send(page, '/console');
    
    const status = page
        .locator('.console-panel')
        .getByTestId('ast-status');
    
    await expect(status).toContainText('↑↓ · space · /');
    await expect(status).not.toContainText('jk');
    await expect(status).not.toContainText('tab switch');
});

/**
 * On a touchscreen the tree gets the full width. Compare with the viewport.
 */
test('ast gives the tree the full width on a touchscreen', async ({page}) => {
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
        // within a pixel: the two are the same box
        fullWidth: measured.tree - measured.body > -1,
    }).toEqual({
        fullWidth: expected,
    });
});

/**
 * The short hint, and the absence of the keyboard-only bindings.
 *
 * Both halves: the full hint is 62 characters and wraps to four lines on a
 * 390px screen, and its tail — `jk navigate`, `tab switch` — is keys a
 * touchscreen does not have. A version that only shortened the text but kept
 * `jk` would pass a length check and still be teaching the wrong thing.
 */
test('ast shows the short hint on a touchscreen', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    const status = page
        .getByTestId('chat')
        .getByTestId('ast-status');
    
    await expect(status).toContainText('↑↓ · space · /');
    await expect(status).not.toContainText('jk');
    await expect(status).not.toContainText('tab switch');
});

/**
 * The hint fits on one line.
 *
 * The reason the short hint exists, asserted as geometry. `clientHeight` is the
 * rendered height, so "wraps to four lines" becomes `clientHeight > lineHeight`
 * — and the threshold is one line of slack for the sub-pixel rounding the other
 * mobile specs already have to allow for.
 */
test('ast hint is one line tall on a touchscreen', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    const measured = await page.evaluate(() => {
        const help = document.querySelector('.ast-status__help') as HTMLElement;
        const {lineHeight} = getComputedStyle(help);
        
        return {
            height: help.getBoundingClientRect().height,
            lineHeight: parseFloat(lineHeight),
        };
    });
    
    const expected = true;
    
    expect({
        singleLine: measured.height <= measured.lineHeight * 1.5,
    }).toEqual({
        singleLine: expected,
    });
});

/**
 * The opening thread fits the viewport: the seed is on screen before any
 * input. Compare `scrollWidth`, not `innerWidth`.
 */
test('the opening thread fits the viewport width', async ({page}) => {
    await expect(page.getByTestId('input')).toBeVisible();
    
    const result = await page.evaluate(() => document.documentElement.scrollWidth);
    const expected = VIEWPORT;
    
    expect(result).toBe(expected);
});

/**
 * No element is past the right edge out of reach of a scroll. Skip elements
 * inside an `overflow-x: auto` ancestor (`.source-block`): they scroll in
 * their own box. `scrollWidth` alone does not say which element overflows.
 */
test('nothing hangs off the right edge out of reach of a scroll', async ({page}) => {
    await expect(page.getByTestId('input')).toBeVisible();
    
    const wide = await page.evaluate(() => {
        const scrolls = [
            'auto',
            'scroll',
            'hidden',
        ];
        
        const result: string[] = [];
        
        for (const element of document.querySelectorAll('*')) {
            const {right} = element.getBoundingClientRect();
            
            if (right <= innerWidth + 1)
                continue;
            
            let parent = element.parentElement;
            let reachable = false;
            
            while (parent) {
                if (scrolls.includes(getComputedStyle(parent).overflowX)) {
                    reachable = true;
                    
                    break;
                }
                
                parent = parent.parentElement;
            }
            
            if (!reachable)
                result.push(`${element.tagName}.${element.className}`);
        }
        
        return result;
    });
    
    const expected: string[] = [];
    
    expect(wide).toEqual(expected);
});

/**
 * The input is at the bottom of the screen on load. Guards `flex: 1` on
 * `.chat`: the seed makes the thread scroll.
 */
test('the input is at the bottom of the viewport on load', async ({page}) => {
    await expect(page.getByTestId('input')).toBeVisible();
    
    // Measure both numbers in the page: on `iPhone 12` `page.viewportSize()` differs by 18px.
    const measured = await page.evaluate(() => {
        const input = document.querySelector('.input') as HTMLElement;
        
        return {
            bottom: input.getBoundingClientRect().bottom,
            viewport: innerHeight,
        };
    });
    
    // Within a pixel of the fold: the composer is the last thing on the page.
    expect(measured.viewport - measured.bottom).toBeLessThanOrEqual(1);
});

/**
 * On a phone, `/help` command names do not wrap. At `max-width: 480px` each
 * row has one column. `scrollWidth > clientWidth` means overflow.
 */
test('/help shows command names without wrapping mid-name', async ({page}) => {
    await send(page, '/help');
    
    const firstName = page
        .locator('.help-block__name')
        .first();
    
    await expect(firstName).toBeVisible();
    
    const overflows = await firstName.evaluate((el) => el.scrollWidth > el.clientWidth + 2);
    expect(overflows).toBe(false);
});

/**
 * `/flow` renders FlowBlock on a touchscreen too — source panel and graph panel
 * both inside the viewport, asserted with `scrollWidth`, never `innerWidth`.
 */
test('/flow fits both panels inside the viewport on a touchscreen', async ({page}) => {
    await send(page, '/flow\nfunction f() { return a; b(); c(); }');
    
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
    
    const overflows = await page.evaluate(() => {
        const source = document.querySelector('.flow-output__source');
        const graph = document.querySelector('.flow-output__graph');
        const w = document.documentElement.scrollWidth;
        
        return {
            source: source && source.scrollWidth > w,
            graph: graph && graph.scrollWidth > w,
            body: document.documentElement.scrollWidth > globalThis.innerWidth,
        };
    });
    
    expect(overflows.source).toBe(false);
    expect(overflows.graph).toBe(false);
    expect(overflows.body).toBe(false);
});

/** Tapping the caret on a collapsed `/ast` row expands it on a touchscreen. */
test('/ast: tap the caret on a collapsed row expands it', async ({page}) => {
    await send(page, '/source\nconst add = (a, b) => a + b;');
    await send(page, '/ast');
    
    const rows = page
        .getByTestId('chat')
        .getByTestId('ast-row');
    
    // Program starts expanded (▾). Collapse it first, then verify ▸, then re-expand.
    const caret = rows
        .locator('.ast-row__caret')
        .first();
    
    await caret.tap(); // collapse Program
    await expect(caret).toHaveText('▸');
    
    const folded = await rows.count();
    
    await caret.tap();
    
    // expand Program
    const expanded = await rows.count();
    
    expect(expanded).toBeGreaterThan(folded);
});

/** A tap on a learn row with children toggles it, on a touchscreen too. */
test('a tap on a learn row with children toggles it', async ({page}) => {
    await send(page, '/learn');
    
    const rows = page
        .getByTestId('chat')
        .getByTestId('learn-row');
    
    await expect(rows).toHaveCount(5);
    
    // `nodes` is the first section, and it has children — tap folds it open
    await rows
        .nth(1)
        .tap();
    
    const opened = await rows.count();
    expect(opened).toBeGreaterThan(5);
    
    // tap again folds it back
    await rows
        .nth(1)
        .tap();
    
    await expect(rows).toHaveCount(5);
});

/** Regression: cursor stays at end after autocomplete on touchscreen. */
test('cursor stays at end after autocomplete on touchscreen', async ({page}) => {
    await box(page).tap();
    await page.keyboard.insertText('/sou');
    
    // Tap the autocomplete row to complete — the box fills with '/source '
    await page
        .locator('.autocomplete__row')
        .first()
        .tap();
    
    const content = await page
        .locator('.cm-content')
        .textContent();
    
    // The completion landed in the box (not cleared, not mangled)
    expect(content).toContain('/source');
});

/** Regression: `/flow` falls back to `state.source` on a touchscreen too. */
test('/flow uses source when no body is given on touchscreen', async ({page}) => {
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

/** Regression: the composer applies syntax highlighting on a touchscreen too.
 * `setOption` runs in a `useEffect` after mount — the same path as desktop.
 */
test('the composer applies syntax highlighting on a touchscreen', async ({page}) => {
    await box(page).tap();
    await page.keyboard.insertText('/source\nconst a = 1;');
    
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
