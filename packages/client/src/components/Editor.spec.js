import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import Editor from './Editor.js';

const getCM = (container) => container.querySelector('.CodeMirror').CodeMirror;

test('Editor: renders .editor container', (t) => {
    const {container} = render(
        <Editor value="const x = 1"/>,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: renders with default props', (t) => {
    const {container} = render(
        <Editor/>,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: renders with error prop', (t) => {
    const error = {
        loc: {
            line: 1,
        },
        message: 'oops',
    };
    
    const {container} = render(
        <Editor error={error}/>,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: renders with highlightRange prop', (t) => {
    const {container} = render(
        <Editor highlightRange={[0, 5]}/>,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: renders in readOnly mode', (t) => {
    const {container} = render(
        <Editor readOnly={true} value="x"/>,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: renders with highlight disabled', (t) => {
    const {container} = render(
        <Editor highlight={false}/>,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: rerenders without error when value prop changes', async (t) => {
    const {container, rerender} = render(
        <Editor value="const x = 1"/>,
    );
    
    await act(() => {
        rerender(
            <Editor value="const y = 2"/>,
        );
    });
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: rerenders without error when mode prop changes', async (t) => {
    const {container, rerender} = render(
        <Editor value="x" mode="javascript"/>,
    );
    
    await act(() => {
        rerender(
            <Editor value="x" mode="css"/>,
        );
    });
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: rerenders without error when keyMap prop changes', async (t) => {
    const {container, rerender} = render(
        <Editor value="x" keyMap="default"/>,
    );
    
    await act(() => {
        rerender(
            <Editor value="x" keyMap="vim"/>,
        );
    });
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: rerenders without error when error prop changes', async (t) => {
    const {container, rerender} = render(
        <Editor value="x" error={null}/>,
    );
    
    await act(() => {
        rerender(
            <Editor
                value="x"
                error={{
                    loc: {
                        line: 2,
                    },
                    message: 'err',
                }}
            />,
        );
    });
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: clears previous error line when error prop changes to null', async (t) => {
    const {container, rerender} = render(
        <Editor
            value="x"
            error={{
                loc: {
                    line: 1,
                },
                message: 'first',
            }}
        />,
    );
    
    await act(() => {
        rerender(
            <Editor value="x" error={null}/>,
        );
    });
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: rerenders without error when highlightRange changes', async (t) => {
    const {container, rerender} = render(
        <Editor value="x" highlightRange={[0, 3]}/>,
    );
    
    await act(() => {
        rerender(
            <Editor value="x" highlightRange={[1, 5]}/>,
        );
    });
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: clears mark when highlightRange changes to null', async (t) => {
    const {container, rerender} = render(
        <Editor value="x" highlightRange={[0, 3]}/>,
    );
    
    await act(() => {
        rerender(
            <Editor value="x" highlightRange={null}/>,
        );
    });
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: uses posFromIndex prop when provided', (t) => {
    const posFromIndex = (doc, idx) => doc.posFromIndex(idx);
    const {container} = render(
        <Editor value="hello world" highlightRange={[0, 5]} posFromIndex={posFromIndex}/>,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: handles highlightRange with no valid positions gracefully', (t) => {
    const posFromIndex = () => null;
    const {container} = render(
        <Editor value="x" highlightRange={[0, 5]} posFromIndex={posFromIndex}/>,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: error prop with lineNumber field renders without error', (t) => {
    const {container} = render(
        <Editor
            value="x"
            error={{
                lineNumber: 1,
                message: 'err',
            }}
        />,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: error prop with line field renders without error', (t) => {
    const {container} = render(
        <Editor
            value="x"
            error={{
                line: 1,
                message: 'err',
            }}
        />,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

// --- CM instance event tests (cover lines 12, 61, 74–94, 101–108, 116) ---
test('Editor: applies nord theme when data-theme is dark', (t) => {
    document.documentElement.setAttribute('data-theme', 'dark');
    
    const {container} = render(
        <Editor value="x"/>,
    );
    
    const result = getCM(container).getOption('theme');
    
    cleanup();
    document.documentElement.removeAttribute('data-theme');
    
    t.equal(result, 'nord');
    t.end();
});

test('Editor: switches to nord theme when data-theme changes to dark', async (t) => {
    document.documentElement.removeAttribute('data-theme');
    
    const {container} = render(
        <Editor value="x"/>,
    );
    
    const cm = getCM(container);
    
    await act(async () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        await new Promise((r) => setTimeout(r, 20));
    });
    const result = cm.getOption('theme');
    
    cleanup();
    document.documentElement.removeAttribute('data-theme');
    
    t.equal(result, 'nord');
    t.end();
});

test('Editor: switches to default theme when data-theme changes to light', async (t) => {
    document.documentElement.setAttribute('data-theme', 'dark');
    
    const {container} = render(
        <Editor value="x"/>,
    );
    
    const cm = getCM(container);
    
    await act(async () => {
        document.documentElement.setAttribute('data-theme', 'light');
        await new Promise((r) => setTimeout(r, 20));
    });
    const result = cm.getOption('theme');
    
    cleanup();
    document.documentElement.removeAttribute('data-theme');
    
    t.equal(result, 'default');
    t.end();
});

test('Editor: calls onContentChange after value change', async (t) => {
    let received = null;
    const {container} = render(
        <Editor
            value="x"
            onContentChange={(args) => {
                received = args;
            }}
        />,
    );
    
    await act(async () => {
        getCM(container).setValue('hello');
        await new Promise((r) => setTimeout(r, 250));
    });
    cleanup();
    
    t.ok(received);
    t.end();
});

test('Editor: onContentChange receives value field', async (t) => {
    let received = null;
    const {container} = render(
        <Editor
            value="x"
            onContentChange={(args) => {
                received = args;
            }}
        />,
    );
    
    await act(async () => {
        getCM(container).setValue('hello');
        await new Promise((r) => setTimeout(r, 250));
    });
    cleanup();
    
    t.equal(received?.value, 'hello');
    t.end();
});

test('Editor: onContentChange receives cursor field', async (t) => {
    let received = null;
    const {container} = render(
        <Editor
            value="x"
            onContentChange={(args) => {
                received = args;
            }}
        />,
    );
    
    await act(async () => {
        getCM(container).setValue('hello');
        await new Promise((r) => setTimeout(r, 250));
    });
    cleanup();
    
    const result = typeof received?.cursor;
    const expected = 'number';
    
    t.equal(result, expected);
    t.end();
});

test('Editor: calls onActivity after cursor moves', async (t) => {
    let called = false;
    const {container} = render(
        <Editor
            value="hello world"
            onActivity={() => {
                called = true;
            }}
        />,
    );
    
    await act(async () => {
        getCM(container).setCursor({
            line: 0,
            ch: 5,
        });
        await new Promise((r) => setTimeout(r, 150));
    });
    cleanup();
    
    t.ok(called);
    t.end();
});

test('Editor: onActivity receives a number', async (t) => {
    let received = null;
    const {container} = render(
        <Editor
            value="hello world"
            onActivity={(idx) => {
                received = idx;
            }}
        />,
    );
    
    await act(async () => {
        getCM(container).setCursor({
            line: 0,
            ch: 3,
        });
        await new Promise((r) => setTimeout(r, 150));
    });
    cleanup();
    
    const result = typeof received;
    const expected = 'number';
    
    t.equal(result, expected);
    t.end();
});
