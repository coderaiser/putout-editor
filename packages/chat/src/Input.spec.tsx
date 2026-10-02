import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import type {ReactNode} from 'react';
import {commands} from '@putout/editor-commands';
import {makeStore} from '#test/store';
import Input, {matches, describeOf} from './Input.tsx';

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

const options = () => [...document.querySelectorAll('.autocomplete__row')].map(({textContent}) => textContent || '');

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
    
    test('Input: down arrow moves the pick', (t) => {
        box();
        
        type('/');
        press('ArrowDown');
        
        const picked = document.querySelector('.autocomplete__row--picked');
        const result = picked !== null;
        const expected = true;
        
        cleanup();
        
        t.equal(result, expected);
        t.end();
    });
    
    test('Input: up arrow wraps the pick back to the end of the list', (t) => {
        box();
        
        type('/');
        press('ArrowUp');
        
        const rows = [...document.querySelectorAll('.autocomplete__row')];
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
    
    test('Input: Enter sends the line', (t) => {
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
    
    test('Input: Enter empties the box after sending', (t) => {
        box();
        
        type('/help');
        press('Enter');
        
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
            press('Enter');
            
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
        
        test('Input: down arrow returns towards empty', (t) => {
            box(['/help']);
            
            press('ArrowUp');
            press('ArrowDown');
            
            const result = value();
            const expected = '';
            
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
            
            cleanup();
            
            t.equal(result, expected);
            t.end();
        });
        
        test('Input: recall walks back down to the empty box and up again', (t) => {
            box(['/help']);
            
            press('ArrowUp');
            press('ArrowDown');
            press('ArrowUp');
            
            const result = value();
            const expected = '/help';
            
            cleanup();
            
            t.equal(result, expected);
            t.end();
        });
        
        const result = value();
        const expected = '';
        
        cleanup();
        
        t.equal(result, expected);
        t.end();
    });
    
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

test('Input: Enter sends a command that is already typed in full', (t) => {
    sent.length = 0;
    box();
    
    // `/ast` is a complete name, so the dropdown still shows one row. Enter has
    
    // to send rather than complete: otherwise a fully typed command takes two
    
    // Enters, which is the bug this pins.
    type('/ast');
    press('Enter');
    
    const result = sent;
    const expected = ['/ast'];
    
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

test('Input: Enter empties the box after sending', (t) => {
    box();
    
    type('/help');
    press('Enter');
    
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
    press('Enter');
    
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
