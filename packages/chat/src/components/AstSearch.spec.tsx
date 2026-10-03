import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import AstSearch from './AstSearch.tsx';

const read = (selector: string) => {
    const element = document.querySelector(selector);
    
    return element && element.textContent;
};

const noop = () => {};

const search = (over: {
    query?: string;
    shown?: number;
    focused?: boolean;
    onQueryChange?: (query: string) => void;
    onFocusChange?: (focused: boolean) => void;
} = {}) => render(
    <AstSearch
        focused={false}
        onFocusChange={noop}
        onQueryChange={noop}
        query=""
        shown={5}
        {...over}
    />,
);

const input = () => document.querySelector('[data-testid="ast-search"]') as HTMLInputElement;

test('AstSearch: binds the query to the input value', (t) => {
    search({
        query: 'Identifier',
    });
    
    const result = input().value;
    const expected = 'Identifier';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstSearch: shows the shown count', (t) => {
    search({
        shown: 14,
    });
    
    const result = read('.ast-search__count');
    const expected = '14 shown';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstSearch: typing reports the new query', (t) => {
    const typed: string[] = [];
    const push = typed.push.bind(typed);
    
    search({
        onQueryChange: push,
    });
    
    fireEvent.change(input(), {
        target: {
            value: 'Arrow',
        },
    });
    
    cleanup();
    
    const expected = ['Arrow'];
    const result = typed;
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstSearch: focus reports that it has focus', (t) => {
    const focused: boolean[] = [];
    const push = focused.push.bind(focused);
    
    search({
        onFocusChange: push,
    });
    
    fireEvent.focus(input());
    
    cleanup();
    
    const expected = [true];
    const result = focused;
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstSearch: blur reports that it lost focus', (t) => {
    const focused: boolean[] = [];
    const push = focused.push.bind(focused);
    
    search({
        onFocusChange: push,
    });
    
    fireEvent.blur(input());
    
    cleanup();
    
    const expected = [false];
    const result = focused;
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstSearch: renders the search icon', (t) => {
    search();
    
    const result = read('.ast-search__icon');
    const expected = '⌕ ';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * `focused` becoming true **moves real focus**, not just the component's state.
 *
 * `autoFocus` only fires at mount, and the plan's own trap: a tree that mounts
 * with `focused=false` and later receives `focused=true` from `Tab` or `/` gets
 * nothing. So the component calls `focus()` in a `useEffect` keyed on `focused`,
 * and this is the spec for the mid-session case — the first render is `false`,
 * the re-render is `true`, which is exactly what no `autoFocus` covers.
 *
 * A **spy on the element's own `focus`**, because asserting `document.activeElement`
 * would pass in a DOM that implements focus and fail in one that does not, and
 * would say nothing about *who* focused it.
 */
test('AstSearch: ref.focus() is called when focused flips to true', (t) => {
    const calls: number[] = [];
    const push = calls.push.bind(calls);
    
    const {rerender} = render(
        <AstSearch
            focused={false}
            onFocusChange={noop}
            onQueryChange={noop}
            query=""
            shown={5}
        />,
    );
    
    const element = input();
    const original = element.focus;
    
    element.focus = () => {
        push(1);
        original.call(element);
    };
    
    rerender(
        <AstSearch
            focused
            onFocusChange={noop}
            onQueryChange={noop}
            query=""
            shown={5}
        />,
    );
    
    const result = calls.length;
    
    cleanup();
    
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

/**
 * The other half: it is called **once**, and only on the transition to true.
 *
 * A `useEffect` with no dependency array would refocus on every keystroke — the
 * caret jumps to the end of what was just typed, which is the bug this guard is
 * for. Re-rendering with `focused` still `true` must not call it again, so this
 * rerenders once more and reads the total.
 */
test('AstSearch: ref.focus() is not called again while focused stays true', (t) => {
    const calls: number[] = [];
    const push = calls.push.bind(calls);
    
    const {rerender} = render(
        <AstSearch
            focused={false}
            onFocusChange={noop}
            onQueryChange={noop}
            query=""
            shown={5}
        />,
    );
    
    const element = input();
    const original = element.focus;
    
    element.focus = () => {
        push(1);
        original.call(element);
    };
    
    // twice focused, then a re-render with the same prop
    for (const focused of [true, true]) {
        rerender(
            <AstSearch
                focused={focused}
                onFocusChange={noop}
                onQueryChange={noop}
                query=""
                shown={5}
            />,
        );
    }
    
    const result = calls.length;
    
    cleanup();
    
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});
