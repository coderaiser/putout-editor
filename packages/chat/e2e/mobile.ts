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
