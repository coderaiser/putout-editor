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
const box = (page: Page) => page.getByTestId('input').locator('.cm-content');

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
 * Click, insert the whole text, then `Ctrl+Enter` — not `fill`, which only
 * targets form controls and has no effect on a `contenteditable` div, and not
 * `keyboard.type`, which presses a real `Enter` for every embedded `\n` — on a
 * keyboard `Enter` *sends*, so a multi-line `source` body would go out as two
 * commands with the first half sent mid-line. `insertText` lands the text
 * atomically: the editor still fires its update, `onChange` still lands in
 * React state, and the key handler only sees the send chord.
 */
const send = async (page: Page, text: string) => {
    await box(page).click();
    await page.keyboard.insertText(text);
    await page.keyboard.press('Control+Enter');
};

/** The width of `iPhone 12`, and the number every assertion below is written against. */
const VIEWPORT = 390;

/**
 * `scrollWidth`, not `innerWidth`.
 *
 * `innerWidth` is 390 on the broken build and on the fixed one — the viewport
 * does not change, the content inside it does. `scrollWidth` is what a user can
 * actually scroll to, so it is the only one of the two that fails on a layout
 * 40px too wide. Comparing `.input`'s own width to `innerWidth` would pass on
 * the broken build too: it is exactly `100%` wide either way, and the overflow is
 * its padding.
 *
 * The wait is not optional, and it is the reason this test is worth reading.
 * `page.goto` resolves on `load`, and React mounts after it, so a measurement
 * taken straight after the navigation reads a document with no `.input` in it —
 * where `scrollWidth` is the viewport width and the assertion passes on a build
 * that is 40px too wide. Measured: `scrollWidth` 390 with `hasInput: false`, then
 * 430 on the very next `evaluate`, with no navigation in between. See
 * `docs/issues/chat.md`.
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
 * The send button inside the textarea — **on touch as well as on a keyboard**.
 *
 * The plan split this by pointer type and kept the button *outside* on a
 * touchscreen, reasoning that it must stay "large and outside the text area".
 * The decision for this run is the opposite one, and it is the same UI Claude
 * ships on a phone: **the button is inside the textarea on every pointer type.**
 *
 * What survives of the plan's concern is the *size*, so it is asserted here
 * separately rather than folded into this spec — a composer whose button is 32px
 * tall needs a hit area of 44 to be usable with a thumb, and containment says
 * nothing about either.
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
 * The thumb-sized part: a 32px button painted inside the box, with a **44px
 * tappable region** around it.
 *
 * Measured by **scanning**, not by probing four corners at a hardcoded offset.
 * The first version of this spec probed at `right + 6` and came back `TEXTAREA`
 * on the two outward corners — the `::before` is `inset: -6px`, so the hit area
 * is exactly 44px and `right + 6` is its *exclusive* edge. A corner probe is
 * therefore one pixel from being a coin flip, and it says nothing about how big
 * the region really is. Walking a row and a column and counting how many pixels
 * belong to the button answers the real question — "how big is the target a
 * thumb gets" — and reports 44 for the same layout a 32px-wide probe would have
 * described as failing.
 *
 * `document.elementFromPoint` rather than a Playwright action, because it asks
 * what is really there instead of what ought to be clickable.
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
 * The **left** padding is the thread's gutter, and on a 390px phone the 52px it
 * used to inherit from the button's lane was a seventh of the whole composer.
 *
 * That is why this is asserted on the mobile project rather than only on the
 * desktop one: the same number is a cosmetic annoyance at 1280px and the reason
 * the placeholder reads as centred on a phone. The value is measured rather than
 * inferred from the thread's own padding, so the two cannot drift apart.
 */
test('the textarea placeholder is not pushed right by the button lane', async ({page}) => {
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
 * Vertical geometry, which the three specs above do not touch at all: they are
 * all horizontal assertions, so a layout that put the composer at the top of the
 * page — behind the header, or floating in the middle — would pass every one of
 * them.
 *
 * `plan-v3.md` §1 calls this a blank-page bug. It is not: `.chat` measures 611px
 * and the composer's bottom edge is the viewport's bottom edge. These specs are
 * here because *that was never asserted*, not because it is currently broken —
 * see `docs/issues/chat.md`.
 *
 * The numbers are `getBoundingClientRect()` values in CSS pixels, which is the
 * same unit `page.viewportSize()` reports, so the two are directly comparable.
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
 * The document must not scroll on its own.
 *
 * This is the load-bearing fact behind `100dvh` on `.chat-app`: `dvh` tracks the
 * *visible* viewport, so a page that scrolls would resize the app shell as the
 * user scrolled. The thread has its own `overflow-y: auto`, so nothing scrolls
 * the document, and `dvh` therefore cannot thrash here. If this ever fails, the
 * `dvh` choice needs revisiting rather than this number.
 */
test('the document does not scroll', async ({page}) => {
    const measured = await page.evaluate(() => document.documentElement.scrollHeight <= globalThis.innerHeight + 1);
    const expected = true;
    
    expect(measured).toBe(expected);
});

/**
 * The gap *inside* one message, not between messages.
 *
 * `.chat__message` already has `gap: 12px` between messages, and a command and
 * its answer are one message: `.message--user` then `<MessageRow>` as two
 * children of a single `.chat__message`. So the flex `gap` counts one child and
 * contributes nothing, and with no margin of their own the echo and the answer
 * sit flush — one block of text.
 *
 * Measured from the bottom of `.message--user` to the top of the answer, which
 * is 0 today. Geometry rather than a screenshot, for the reason the specs above
 * give: a 40px overflow renders a page that looks almost right.
 */
/**
 * A sentence is not a command — and on a touchscreen this is the path most likely
 * to produce one, since the send button is a tap away and there is no `Ctrl+Enter`
 * chord to signal "this is a command".
 *
 * Sent by tapping the button rather than with the chord, so it is the route a
 * phone user actually takes. The **message** is asserted, not just that an error
 * appeared: `.error-block` is what an unknown command shows too, and visibility
 * alone cannot tell the two apart.
 */
test('a sentence is told to start with a sigil on a touchscreen', async ({page}) => {
    await box(page).click();
    await page.keyboard.type('hello world');
    await page.getByTestId('send').tap();
    
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
    
    // Both halves are the point: a newline that also sent would post a
    
    // half-typed line, and this is the assertion that would have caught it.
    // `toHaveText` normalizes the trailing break away, so the `\n` reads as
    // documentation of the newline rather than a byte comparison — the count
    // below is what pins "sends nothing".
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
 * The code preview is gone on a touchscreen.
 *
 * `toBeHidden()`, **not** `toHaveCount(0)`. The element is still mounted —
 * `AstTree` renders it unconditionally and `@media (pointer: coarse)` in
 * `AstTree.css` gives it `display: none` — so a count assertion would fail on
 * the correct implementation and pass on a broken one. `toBeHidden()` matches
 * `display: none` and also matches `visibility: hidden`, which is why the CSS
 * comment pins the two together.
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
 * …and the tree gets the whole width, which is the actual reason.
 *
 * A `minmax(0, 1fr)` two-column grid on 390px gives each column 190px, so the
 * tree — the point of `ast` — was the half that ran out of room. Measured
 * against the viewport rather than against the old value, so the assertion is
 * about "the tree has the screen" and not about a number the grid happens to
 * produce today.
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
 * The opening thread has to fit, because it is what every first visit shows.
 *
 * Found by measuring rather than by reading the plan: the plan's six items do
 * not mention this, and it appeared the moment the thread was seeded. Both
 * seeded answers are wider than 390px — the `source` example is a rule with a
 * `replace` object, and the help table has a `name usage` column that is
 * `white-space: nowrap` — and neither could shrink, so `.chat__thread` grew
 * past the viewport and the whole **document** scrolled sideways.
 *
 * `scrollWidth`, not `innerWidth`, for the reason the composer spec above gives:
 * the viewport does not change, the content inside it does. And the seed is
 * what makes this a load-time assertion rather than a `send()` one — it is on
 * screen before anything is typed.
 */
test('the opening thread fits the viewport width', async ({page}) => {
    await expect(page.getByTestId('input')).toBeVisible();
    
    const result = await page.evaluate(() => document.documentElement.scrollWidth);
    const expected = VIEWPORT;
    
    expect(result).toBe(expected);
});

/**
 * Nothing hangs off the right edge **where the user cannot reach it**.
 *
 * The composer spec above established the technique — probe every element whose
 * `right` is past the viewport — and it is repeated here because the two
 * overflows have nothing to do with each other, so a fix for one that silently
 * fixed the other would mean the measurement stopped measuring.
 *
 * The ancestor walk is the whole point, and it took a failing run to learn. The
 * first version flagged every element past the edge and failed on thirteen of
 * them — all inside `.source-block`, which is `overflow-x: auto` **on purpose**.
 * A long line of code is supposed to be wider than a phone and scroll inside its
 * own box; that is what the box is for. Flagging it measures the styling rather
 * than the defect.
 *
 * What is left after the walk is a real bug: an element the page cannot scroll
 * to reach. That is the `.chat` overflow this work fixed, and it is invisible to
 * a count of `scrollWidth` alone, which says *that* a document overflows and not
 * *what*.
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
 * The input still reaches the bottom of the screen.
 *
 * The seed made the thread tall enough to scroll, which is the first time this
 * page has had content taller than its box on load — so "the composer is
 * reachable" stops being implied by the layout and has to be asserted. This is
 * the regression guard for `flex: 1` on `.chat`: without a definite height the
 * thread would push the input off the bottom rather than scroll.
 */
test('the input is at the bottom of the viewport on load', async ({page}) => {
    await expect(page.getByTestId('input')).toBeVisible();
    
    // **Both** numbers measured inside the page. `page.viewportSize()` is what
    // Playwright was configured with and `getBoundingClientRect()` is what the
    // browser laid out, and on `devices['iPhone 12']` those disagree by 18px —
    // enough for this to fail at `viewport - bottom === 0` and to pass for the
    // wrong reason if the slack were widened. One source, one coordinate system.
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
