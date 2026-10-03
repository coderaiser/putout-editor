import {
    test,
    expect,
    type Page,
} from './test.ts';

const box = (page: Page) => page.getByRole('textbox');

/**
 * The geometry of one element, in CSS pixels.
 *
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
            const {left, right} = element.getBoundingClientRect();
            
            return {
                left,
                right,
            };
        });
    
    return result;
};

/**
 * `fill` then `Ctrl+Enter`, not `type` then `Enter`, for the reason
 * `desktop.ts` gives: a multi-line body would have its `Enter` land mid-source.
 */
const send = async (page: Page, text: string) => {
    await box(page).fill(text);
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

test('the autocomplete dropdown is on screen', async ({page}) => {
    await box(page).fill('/');
    
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
test('air between a command and its answer', async ({page}) => {
    await send(page, '/help');
    
    const result = await page.evaluate(() => {
        const user = document.querySelector('.message--user')!.getBoundingClientRect();
        
        const answer = document.querySelector('.chat__message .message:not(.message--user)')!.getBoundingClientRect();
        
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
    await box(page).fill('/help');
    await page.keyboard.press('Enter');
    
    // Both halves are the point: a newline that also sent would post a
    
    // half-typed line, and this is the assertion that would have caught it.
    await expect(box(page)).toHaveValue('/help\n');
    await expect(page.locator('.message--user')).toHaveCount(0);
});

test('Ctrl+Enter sends on a touchscreen too', async ({page}) => {
    await box(page).fill('/help');
    await page.keyboard.press('Control+Enter');
    
    await expect(page.locator('.message--user')).toHaveCount(1);
    await expect(box(page)).toHaveValue('');
});
