import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
    fireEvent,
} from '@testing-library/react';
import {getView, setValue} from 'qword/client';
import type {KeyboardEvent} from 'react';
import CodeMirrorBox from './CodeMirrorBox.tsx';

const noop = (): void => {};

const CONTENT = '.cm-content';

const mount = (overrides: {value?: string; onChange?: (next: string) => void; onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void} = {}) => render(
    <CodeMirrorBox
        onChange={overrides.onChange || noop}
        onKeyDown={overrides.onKeyDown || noop}
        value={overrides.value || ''}
    />,
);

const content = (): HTMLElement => document.querySelector(CONTENT) as HTMLElement;

const docOf = (): string => {
    const boxes = [...document.querySelectorAll('[data-testid="box"]')];
    const element = boxes[boxes.length - 1] as HTMLElement;
    const view = getView(element);
    
    return view ? view.state.doc.toString() : '';
};

test('CodeMirrorBox: mounts a CodeMirror editor', (t) => {
    mount();
    
    const result = document.querySelector('.cm-editor') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('CodeMirrorBox: className lands on the container', (t) => {
    render(
        <CodeMirrorBox
            className="input__box"
            onChange={noop}
            onKeyDown={noop}
            value=""
        />,
    );
    
    const result = document.querySelector('.input__box') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('CodeMirrorBox: data-testid lands on the container', (t) => {
    render(
        <CodeMirrorBox
            data-testid="input"
            onChange={noop}
            onKeyDown={noop}
            value=""
        />,
    );
    
    const result = document.querySelector('[data-testid="input"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('CodeMirrorBox: the container carries the empty class while the value is empty', (t) => {
    render(
        <CodeMirrorBox
            className="input__box"
            onChange={noop}
            onKeyDown={noop}
            value=""
        />,
    );
    
    const result = document.querySelector('.input__box.input__box--empty') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('CodeMirrorBox: the empty class is gone once text arrives', (t) => {
    const {rerender} = render(
        <CodeMirrorBox
            className="input__box"
            onChange={noop}
            onKeyDown={noop}
            value=""
        />,
    );
    
    act(() => {
        rerender(
            <CodeMirrorBox
                className="input__box"
                onChange={noop}
                onKeyDown={noop}
                value="/help"
            />,
        );
    });
    
    const result = document.querySelector('.input__box--empty');
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('CodeMirrorBox: data-placeholder lands on the container', (t) => {
    render(
        <CodeMirrorBox
            onChange={noop}
            onKeyDown={noop}
            placeholder="/help"
            value=""
        />,
    );
    
    const result = document.querySelector('[data-placeholder="/help"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('CodeMirrorBox: unmount destroys the editor without throwing', (t) => {
    mount();
    cleanup();
    
    const result = document.querySelector('.cm-editor');
    const expected = null;
    
    t.equal(result, expected);
    t.end();
});

test('CodeMirrorBox: typing calls onChange with the new text', (t) => {
    const calls: string[] = [];
    
    render(
        <CodeMirrorBox
            data-testid="box"
            onChange={(next) => calls.push(next)}
            onKeyDown={noop}
            value=""
        />,
    );
    
    const element = document.querySelector('[data-testid="box"]') as HTMLElement;
    
    act(() => {
        setValue(getView(element)!, '/help');
    });
    
    const result = calls;
    const expected = ['/help'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});


test('CodeMirrorBox: an outside value change is pushed into the editor', (t) => {
    const {rerender} = render(
        <CodeMirrorBox
            data-testid="box"
            onChange={noop}
            onKeyDown={noop}
            value=""
        />,
    );
    
    act(() => {
        rerender(
            <CodeMirrorBox
                data-testid="box"
                onChange={noop}
                onKeyDown={noop}
                value="/ast"
            />,
        );
    });
    
    const result = docOf();
    const expected = '/ast';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('CodeMirrorBox: the echo of its own change is not pushed back', (t) => {
    const {rerender} = render(
        <CodeMirrorBox
            data-testid="box"
            onChange={noop}
            onKeyDown={noop}
            value=""
        />,
    );
    
    const element = document.querySelector('[data-testid="box"]') as HTMLElement;
    
    act(() => {
        setValue(getView(element)!, '/help');
    });
    
    act(() => {
        rerender(
            <CodeMirrorBox
                data-testid="box"
                onChange={noop}
                onKeyDown={noop}
                value="/help"
            />,
        );
    });
    
    const result = docOf();
    const expected = '/help';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('CodeMirrorBox: keydown reaches onKeyDown', (t) => {
    const calls: string[] = [];
    
    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
        calls.push(event.key);
    };
    
    mount({
        onKeyDown,
    });
    
    fireEvent.keyDown(content(), {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
    });
    
    const result = calls;
    const expected = ['Enter'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('CodeMirrorBox: preventDefault in onKeyDown stops the editor handling the key', (t) => {
    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
        event.preventDefault();
    };
    
    render(
        <CodeMirrorBox
            data-testid="box"
            onChange={noop}
            onKeyDown={onKeyDown}
            value="tra"
        />,
    );
    
    const before = docOf();
    
    fireEvent.keyDown(content(), {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
    });
    
    const result = {
        before,
        after: docOf(),
    };
    
    const expected = {
        before: 'tra',
        after: 'tra',
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('CodeMirrorBox: modifiers reach onKeyDown intact', (t) => {
    const calls: Array<{key: string; ctrlKey: boolean; shiftKey: boolean; metaKey: boolean}> = [];
    
    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
        calls.push({
            key: event.key,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
        });
    };
    
    mount({
        onKeyDown,
    });
    
    fireEvent.keyDown(content(), {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
    });
    
    const result = calls;
    
    const expected = [{
        key: 'Enter',
        ctrlKey: true,
        shiftKey: false,
        metaKey: false,
    }];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('CodeMirrorBox: the content opts out of iOS text rewriting', (t) => {
    mount();
    
    const result = {
        autocapitalize: content().getAttribute('autocapitalize'),
        autocorrect: content().getAttribute('autocorrect'),
        spellcheck: content().getAttribute('spellcheck'),
    };
    
    const expected = {
        autocapitalize: 'none',
        autocorrect: 'off',
        spellcheck: 'false',
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});
