import {test} from 'supertape';
import {Provider} from 'react-redux';
import type {ReactNode} from 'react';
import {commands} from '@putout/editor-commands';
import {
    render,
    cleanup,
    act,
    fireEvent,
} from '@testing-library/react';
import {makeStore} from '#test/store';
import Input, {
    matches,
    describeOf,
    enterSends,
    growTo,
    isCoarsePointer,
} from './Input.tsx';

const sent: string[] = [];
const push = sent.push.bind(sent);

/**
 * `Input` reads the recall cursor from the store, so every render needs a
 * `Provider` — and it is `makeStore`, the factory the page uses, so a spec
 * cannot pass against a store the app never builds.
 */
const box = (history: string[] = []) => {
    const store = makeStore({
        history,
    });
    
    const wrapper = ({children}: {children: ReactNode;}) => (
        <Provider store={store}>
            {children}
        </Provider>
    );
    
    return render(<Input
        history={history}
        onSend={push}
    />, {
        wrapper,
    });
};

const input = () => document.querySelector('[data-testid="input"]') as HTMLTextAreaElement;
const value = () => input().value;

const type = (text: string) => fireEvent.change(input(), {
    target: {
        value: text,
    },
});

const press = (key: string, shiftKey = false) => fireEvent.keyDown(input(), {
    key,
    shiftKey,
});

/**
 * The two halves of the send chord. They are separate helpers rather than
 * `press(key, false, modifier)` because a modifier is not a boolean flag on
 * this handler: `metaKey` is the macOS half, and folding it into a third
 * positional argument is how a spec ends up pressing `Meta+Enter` while
 * believing it pressed `Ctrl+Enter`.
 */
const pressCtrl = (key: string) => fireEvent.keyDown(input(), {
    key,
    ctrlKey: true,
});

const pressMeta = (key: string) => fireEvent.keyDown(input(), {
    key,
    metaKey: true,
});

const options = () => [...document.querySelectorAll('.autocomplete__row')].map(({textContent}) => textContent || '');

/**
 * happy-dom *does* implement `matchMedia`, and answers `false` for
 * `(pointer: coarse)` — so every other spec in this file is the **desktop**
 * case without saying so. This is the other one: a stub that reports a
 * touchscreen, where `Enter` is a newline.
 *
 * `state.coarse` is mutable and the stub reads it on every call, so a spec can
 * flip the device mid-test — the case `useEffect`'s `change` listener exists
 * for, and the one a mount-time-only read could never answer.
 *
 * Installed and removed around the call rather than for the file, because the
 * component reads it at mount — a spec that leaves it behind would quietly
 * change every spec that runs after it.
 */
interface Pointer {
    coarse: boolean;
    listeners: Set<(event: MediaQueryListEvent) => void>;
}

// The deprecated `addListener`/`removeListener` pair is here because
// `MediaQueryList` still declares it and happy-dom's own implementation
// answers it. `noop` is the file's existing name for that.
const noop = () => {};

const withPointer = (fn: (pointer: Pointer) => void) => {
    const original = globalThis.matchMedia;
    
    const pointer: Pointer = {
        coarse: true,
        listeners: new Set(),
    };
    
    globalThis.matchMedia = ((query: string) => ({
        get matches() {
            return query === '(pointer: coarse)' && pointer.coarse;
        },
        media: query,
        onchange: null,
        addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
            pointer.listeners.add(listener);
        },
        removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
            pointer.listeners.delete(listener);
        },
        dispatchEvent: () => true,
        addListener: noop,
        removeListener: noop,
    })) as unknown as typeof globalThis.matchMedia;
    
    fn(pointer);
    
    cleanup();
    globalThis.matchMedia = original;
    
    return pointer;
};

/** Fire the query's own `change` listeners, as a browser does on an orientation flip. */
const flip = (pointer: Pointer) => {
    act(() => {
        for (const listener of pointer.listeners)
            listener({} as MediaQueryListEvent);
    });
};

test('Input: Enter is a newline on a coarse pointer, and sends nothing', (t) => {
    sent.length = 0;
    
    withPointer(() => {
        box();
        type('/help');
        press('Enter');
    });
    
    const result = sent;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: a coarse pointer still sends on Ctrl+Enter', (t) => {
    sent.length = 0;
    
    withPointer(() => {
        box();
        type('/help');
        pressCtrl('Enter');
    });
    
    const result = sent;
    const expected = ['/help'];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The mount-time read is not the whole of it: a tablet undocked into a
 * keyboard changes the answer while the page is up, and re-mounting to find out
 * would throw away the composer mid-sentence. So the `change` listener applies
 * it — and this is the only test that reaches that callback.
 */
test('Input: the binding follows a change of pointer type', (t) => {
    sent.length = 0;
    
    withPointer((pointer) => {
        box();
        type('/help');
        
        pointer.coarse = false;
        flip(pointer);
        
        press('Enter');
    });
    
    const result = sent;
    const expected = ['/help'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: the pointer listener is removed on unmount', (t) => {
    sent.length = 0;
    
    let attached = 0;
    
    const pointer = withPointer((registered) => {
        box();
        attached = registered.listeners.size;
    });
    
    // `withPointer` calls `cleanup()`, which runs the effect's own teardown. So
    // this asserts the *detach*: a `removeEventListener` that never ran would
    // leave the listener attached to a `MediaQueryList` that outlives the
    // component.
    const result = {
        attached,
        detached: pointer.listeners.size,
    };
    
    const expected = {
        attached: 1,
        detached: 0,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: the effect does nothing without matchMedia', (t) => {
    sent.length = 0;
    
    const original = globalThis.matchMedia;
    
    Reflect.deleteProperty(globalThis, 'matchMedia');
    
    box();
    type('/help');
    press('Enter');
    
    const result = sent;
    const expected = ['/help'];
    
    cleanup();
    globalThis.matchMedia = original;
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: isCoarsePointer is false without matchMedia', (t) => {
    const original = globalThis.matchMedia;
    
    Reflect.deleteProperty(globalThis, 'matchMedia');
    
    const result = isCoarsePointer();
    const expected = false;
    
    globalThis.matchMedia = original;
    
    t.equal(result, expected);
    t.end();
});

test('Input: enterSends is true for a fine pointer', (t) => {
    const result = enterSends(false);
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

test('Input: enterSends is false for a coarse pointer', (t) => {
    const result = enterSends(true);
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});

test('Input: typing / opens the autocomplete', (t) => {
    box();
    
    type('/');
    
    const result = document.querySelector('[data-testid="autocomplete"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: the autocomplete lists every command', (t) => {
    box();
    
    type('/');
    
    const result = options().length === commands.size;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: the autocomplete narrows as a name is typed', (t) => {
    box();
    
    type('/tra');
    
    const result = options().length;
    const expected = 1;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: Tab completes the picked command into the box', (t) => {
    box();
    
    type('/tra');
    press('Tab');
    
    const result = value();
    const expected = '/transform ';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: Enter completes while the autocomplete is open', (t) => {
    box();
    
    type('/tra');
    press('Enter');
    
    const result = value();
    const expected = '/transform ';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The desktop binding, and the half of the reversal of `69f5634` that the rest of
 * this file no longer covers: happy-dom answers `false` for `(pointer: coarse)`,
 * so an unmounted `matchMedia` stub *is* the desktop case here.
 */
test('Input: Enter sends the line on a keyboard', (t) => {
    sent.length = 0;
    box();
    
    type('/help');
    press('Enter');
    
    const result = sent;
    const expected = ['/help'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The reason `69f5634` chose the newline, and the escape hatch it leaves: a
 * `/source` body is more than one line, so `Shift+Enter` is how you get there
 * without pasting.
 */
test('Input: Shift+Enter is a newline on a keyboard', (t) => {
    sent.length = 0;
    box();
    
    type('/source');
    press('Enter', true);
    
    const result = sent;
    const expected: string[] = [];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: Shift+Enter does not complete while the autocomplete is open', (t) => {
    box();
    
    type('/tra');
    press('Enter', true);
    
    const result = {
        options: options().length,
        value: value(),
    };
    
    const expected = {
        options: 1,
        value: '/tra',
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: Ctrl+Enter sends a command that is already typed in full', (t) => {
    sent.length = 0;
    box();
    
    // `/ast` is a complete name, so the dropdown still shows one row. The send
    
    // chord has to work anyway — a dropdown is not a reason to swallow the
    
    // only key that sends.
    type('/ast');
    pressCtrl('Enter');
    
    const result = sent;
    const expected = ['/ast'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: Ctrl+Enter sends while a partial name is still open', (t) => {
    sent.length = 0;
    box();
    
    type('/hel');
    pressCtrl('Enter');
    
    const result = sent;
    const expected = ['/hel'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: Cmd+Enter also sends the line', (t) => {
    sent.length = 0;
    box();
    
    // `Cmd+Enter` is the same handler as `Ctrl+Enter` — a macOS user has no
    
    // Control key chord worth the name, and shipping one half of a shortcut
    
    // per platform is a bug waiting for the first laptop without a Control.
    type('/help');
    pressMeta('Enter');
    
    const result = sent;
    const expected = ['/help'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: down arrow moves the pick down the list', (t) => {
    box();
    
    type('/');
    press('ArrowDown');
    
    const first = document.querySelector('.autocomplete__row');
    const result = first && first.classList.contains('autocomplete__row--picked');
    const expected = false;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: up arrow wraps the pick to the end of the list', (t) => {
    box();
    
    type('/');
    press('ArrowUp');
    
    const rows = [...document.querySelectorAll('.autocomplete__row')] as Element[];
    const last = rows.at(-1) as Element;
    const result = last.classList.contains('autocomplete__row--picked');
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: Escape closes the autocomplete and empties the box', (t) => {
    box();
    
    type('/');
    press('Escape');
    
    const result = {
        options: options().length,
        value: value(),
    };
    
    const expected = {
        options: 0,
        value: '',
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: a non-slash line closes the autocomplete', (t) => {
    box();
    
    type('hello');
    
    const result = options().length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: Ctrl+Enter empties the box after sending', (t) => {
    box();
    
    type('/help');
    pressCtrl('Enter');
    
    const result = value();
    const expected = '';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: Shift+Enter does not send', (t) => {
    sent.length = 0;
    box();
    
    type('/help');
    press('Enter', true);
    
    const result = sent;
    const expected: string[] = [];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: an empty line is not sent', (t) => {
    sent.length = 0;
    box();
    
    type('   ');
    pressCtrl('Enter');
    
    const result = sent;
    const expected: string[] = [];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: up arrow on an empty box recalls the last line', (t) => {
    box(['/help', '/ast']);
    
    press('ArrowUp');
    
    const result = value();
    const expected = '/ast';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: recall walks back down towards the empty box', (t) => {
    box(['/help', '/ast']);
    
    press('ArrowUp');
    press('ArrowUp');
    press('ArrowDown');
    
    const result = value();
    const expected = '/ast';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: up arrow twice reaches further back', (t) => {
    box(['/help', '/ast']);
    
    press('ArrowUp');
    press('ArrowUp');
    
    const result = value();
    const expected = '/help';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: up arrow at the oldest entry stays on the oldest', (t) => {
    box(['/help']);
    
    press('ArrowUp');
    press('ArrowUp');
    press('ArrowUp');
    
    const result = value();
    const expected = '/help';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: down arrow returns towards empty', (t) => {
    box(['/help']);
    
    press('ArrowUp');
    press('ArrowDown');
    
    const result = value();
    const expected = '';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: down arrow past the newest returns to empty', (t) => {
    box(['/help', '/ast']);
    
    press('ArrowUp');
    press('ArrowUp');
    press('ArrowDown');
    press('ArrowDown');
    
    const result = value();
    const expected = '';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: clicking a row completes that command', (t) => {
    box();
    
    type('/tra');
    
    const rows = [...document.querySelectorAll('.autocomplete__row')] as HTMLElement[];
    const row = rows.at(0) as HTMLElement;
    
    fireEvent.mouseDown(row);
    
    const result = value();
    const expected = '/transform ';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: a completed command leaves the dropdown behind', (t) => {
    box();
    
    type('/tra');
    
    const rows = [...document.querySelectorAll('.autocomplete__row')] as HTMLElement[];
    const row = rows.at(0) as HTMLElement;
    
    fireEvent.mouseDown(row);
    
    const result = document.querySelector('[data-testid="autocomplete"]');
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Input: matches returns nothing for a line that is not a command', (t) => {
    const result = matches('hello');
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: matches finds every command for a bare slash', (t) => {
    const result = matches('/').length;
    const expected = commands.size;
    
    t.equal(result, expected);
    t.end();
});

test('Input: matches narrows on a prefix', (t) => {
    const result = matches('/he');
    const expected = ['/help'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: matches returns nothing when nothing starts with the prefix', (t) => {
    const result = matches('/zzz');
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: the send button sends the line', (t) => {
    sent.length = 0;
    box();
    
    type('/help');
    
    const button = document.querySelector('[data-testid="send"]') as HTMLButtonElement;
    
    fireEvent.click(button);
    
    const result = sent;
    const expected = ['/help'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: the send button names its shortcut', (t) => {
    box();
    
    // The button is the primary way to send and the label is an arrow, so the
    
    // keyboard half has to be discoverable somewhere: a `↑` with no tooltip
    
    // leaves the chord to be guessed.
    const button = document.querySelector('[data-testid="send"]') as HTMLButtonElement;
    
    const result = {
        label: button.textContent,
        title: button.title,
    };
    
    const expected = {
        label: '↑',
        title: 'Send (Ctrl+Enter)',
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: describeOf returns the description of a known command', (t) => {
    const command = commands.get('ast');
    const result = describeOf('/ast');
    const expected = command && command.description;
    
    t.equal(result, expected);
    t.end();
});

test('Input: describeOf returns nothing for a name that is not a command', (t) => {
    const result = describeOf('/notacommand');
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

/**
 * jsdom lays nothing out, so `scrollHeight` is 0 for every element. The stub
 * is what makes this test say something: without it `growTo` would set every
 * height to `0px` and pass, which is the same green as a box that never grows.
 */
const withScrollHeight = (height: number, run: (element: HTMLTextAreaElement) => void) => {
    const element = document.createElement('textarea');
    
    Object.defineProperty(element, 'scrollHeight', {
        configurable: true,
        value: height,
    });
    
    run(element);
    
    return element.style.height;
};

test('Input: growTo sizes the box to its content', (t) => {
    const result = withScrollHeight(96, growTo);
    const expected = '96px';
    
    t.equal(result, expected);
    t.end();
});

test('Input: growTo clears the height first, so shrinking works', (t) => {
    const element = document.createElement('textarea');
    const set: string[] = [];
    
    // `style.height` is the observation point: the point of writing `'auto'`
    // before the measurement is that a box which has already grown would
    // otherwise measure itself and never shrink back.
    Object.defineProperty(element, 'style', {
        configurable: true,
        get() {
            return {
                set height(value: string) {
                    set.push(value);
                },
            };
        },
    });
    
    Object.defineProperty(element, 'scrollHeight', {
        configurable: true,
        value: 24,
    });
    
    growTo(element);
    
    const result = set;
    const expected = [
        'auto',
        '24px',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('Input: growTo does nothing without a box', (t) => {
    growTo(null);
    
    const result = ['survived'];
    const expected = ['survived'];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * `growTo` reads the cap from the computed style, so the box has to be in the
 * document: jsdom resolves `max-height` to `''` on a detached element, which
 * would make the comparison a `NaN` one and leave the "taller than the cap" arm
 * unreachable. The cap is the real `200px` from `chat.css` — the point is not
 * the number but that the function asks the stylesheet rather than carrying a
 * copy of it.
 */
const withOverflow = (height: number, maxHeight: string, run: (element: HTMLTextAreaElement) => void) => {
    const element = document.createElement('textarea');
    
    Object.defineProperty(element, 'scrollHeight', {
        configurable: true,
        value: height,
    });
    
    element.style.maxHeight = maxHeight;
    document.body.append(element);
    
    run(element);
    
    const {overflowY} = element.style;
    
    element.remove();
    
    return overflowY;
};

test('Input: growTo shows no scrollbar while the box is under the cap', (t) => {
    // The regression: `overflow-y: auto` in the stylesheet draws a scrollbar
    // track on a one-row box, and it is there for the whole time the user is
    // typing the first line.
    const result = withOverflow(96, '200px', growTo);
    const expected = 'hidden';
    
    t.equal(result, expected);
    t.end();
});

test('Input: growTo brings the scrollbar back once the box hits the cap', (t) => {
    // Hiding it and never bringing it back would be the other half of the same
    // bug: a pasted file taller than the cap would be unreachable.
    const result = withOverflow(240, '200px', growTo);
    const expected = 'auto';
    
    t.equal(result, expected);
    t.end();
});

/**
 * The composer is a Claude-style box: the button is **inside** the textarea.
 *
 * The layout itself is `chat.css` and only geometry can check it — that is
 * `e2e/desktop.ts` and `e2e/mobile.ts`, which assert containment against
 * `getBoundingClientRect()`. jsdom returns zeros for layout, so a spec here can
 * only assert the *structure* the stylesheet depends on, and that structure is
 * load-bearing rather than incidental:
 *
 * `.input` is `position: relative`, and `.input__send` is `position: absolute`
 * inside it. Move the button out of `.input` — one wrapper div — and every rule
 * in the stylesheet silently stops applying, the button falls back to `static`,
 * and **no unit spec fails**. The DOM relationship is the contract the CSS is
 * written against, so it gets a spec.
 */
test('Input: the send button is a sibling of the textarea inside .input', (t) => {
    box();
    
    const parent = (document.querySelector('.input__send') as HTMLElement).parentElement as HTMLElement;
    const children = [...parent.children] as HTMLElement[];
    const result = {
        // `position: absolute` resolves against `.input`, so the button has to
        // be its child and not a child of something else.
        insideInput: parent.classList.contains('input'),
        
        // after the textarea in source order, so it paints over it
        afterBox: children.findIndex(({classList}) => classList.contains('input__send')) >
            children.findIndex(({classList}) => classList.contains('input__box')),
    };
    
    const expected = {
        insideInput: true,
        afterBox: true,
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The button is a real `<button type="button">`, not a clickable `<div>`.
 *
 * It is absolutely positioned *over* the textarea now, so a keyboard user
 * reaching it with `Tab` lands on it — and `Enter`/`Space` only send if it is a
 * button. A `<div onClick>` would break both, and the geometry specs would still
 * be green.
 */
test('Input: the send button is a type=button element a keyboard can activate', (t) => {
    box();
    
    const send = document.querySelector('.input__send') as HTMLButtonElement;
    const result = {
        // `submit` inside a form would reload the page instead of sending
        type: send.type,
    };
    
    const expected = {
        type: 'button',
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * It is not disabled: a button that can never be pressed would still satisfy
 * every containment and padding assertion above, and the one send affordance a
 * touchscreen has would be silently dead.
 */
test('Input: the send button is not disabled', (t) => {
    box();
    
    const send = document.querySelector('.input__send') as HTMLButtonElement;
    const result = {
        disabled: send.disabled,
    };
    
    const expected = {
        disabled: false,
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});
