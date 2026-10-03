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
