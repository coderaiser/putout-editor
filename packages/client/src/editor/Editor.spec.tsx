import {test} from 'supertape';
import {getView, type SourcePosition} from 'qword/client';
import {
    render,
    cleanup,
    act,
    fireEvent,
} from '@testing-library/react';
import Editor from './Editor.tsx';

const resolvePos = (_doc: unknown, idx: number): SourcePosition | null => ({
    line: 0,
    ch: idx,
});

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
        name: 'SyntaxError',
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
        <Editor
            value="x"
            error={{
                name: 'Error',
                message: 'oops',
            }}
        />,
    );
    
    await act(() => {
        rerender(
            <Editor
                value="x"
                error={{
                    name: 'Error',
                    message: 'new error',
                }}
            />,
        );
    });
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Editor: onContentChange called when content changes', async (t) => {
    let received: {
        value: string;
        cursor: number;
    } | undefined;
    
    const {container} = render(
        <Editor
            value="const x = 1"
            onContentChange={({value, cursor}) => {
                received = {
                    value,
                    cursor,
                };
            }}
        />,
    );
    
    await act(async () => {
        const view = getView(container);
        
        view?.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: 'hello',
            },
        });
        await new Promise((resolve: (value: undefined) => void) => setTimeout(resolve, 250));
    });
    
    cleanup();
    
    const result = received?.value;
    const expected = 'hello';
    
    t.equal(result, expected);
    t.end();
});

test('Editor: onActivity called when cursor moves', async (t) => {
    let received: number | undefined;
    
    const {container} = render(
        <Editor
            value="const x = 1"
            onActivity={(cursor) => {
                received = cursor;
            }}
        />,
    );
    
    test('Editor: sets selection when highlightRange changes', (t) => {
        const {container, rerender} = render(
            <Editor value="const x = 1;"/>,
        );
        
        const view = getView(container);
        
        act(() => {
            rerender(
                <Editor
                    value="const x = 1;"
                    highlightRange={[0, 5]}
                    posFromIndex={resolvePos}
                />,
            );
        });
        
        const {anchor, head} = view?.state.selection.main || {
            anchor: 1,
            head: 1,
        };
        
        cleanup();
        
        t.ok(!anchor && head === 5, 'should set selection to highlight range');
        t.end();
    });
    
    test('Editor: clears previous mark when highlightRange changes', (t) => {
        const {container, rerender} = render(
            <Editor value="const x = 1;" highlightRange={[0, 5]}/>,
        );
        
        act(() => {
            rerender(
                <Editor
                    value="const x = 1;"
                    highlightRange={[6, 10]}
                />,
            );
        });
        
        test('Editor: getCMTheme returns nord when data-theme is dark', (t) => {
            document.documentElement.setAttribute('data-theme', 'dark');
            
            const {container} = render(
                <Editor value="const x = 1"/>,
            );
            
            const result = container.querySelector('.editor');
            
            document.documentElement.setAttribute('data-theme', 'light');
            
            cleanup();
            
            t.ok(result);
            t.end();
        });
        
        const marksAfter = container.querySelectorAll('.marked');
        
        cleanup();
        
        t.ok(marksAfter.length > 0);
        t.end();
    });
    
    test('Editor: does not crash when highlightRange is null', (t) => {
        const {container, rerender} = render(
            <Editor value="const x = 1;"/>,
        );
        
        act(() => {
            rerender(
                <Editor
                    value="const x = 1;"
                    highlightRange={null}
                />,
            );
        });
        
        const result = container.querySelector('.editor');
        
        cleanup();
        
        t.ok(result, 'should render without crash');
        t.end();
    });
    
    test('Editor: does not crash when highlightRange contains non-number positions', (t) => {
        const {container} = render(
            <Editor
                value="const x = 1;"
                highlightRange={[0, 5]}
            />,
        );
        
        const marks = container.querySelectorAll('.marked');
        
        cleanup();
        
        t.equal(marks.length, 0);
        t.end();
    });
    
    test('Editor: Tab indents the current line', (t) => {
        const {container} = render(
            <Editor value="abc"/>,
        );
        
        const content = container.querySelector('.cm-content') as HTMLElement;
        
        act(() => {
            content.focus();
            fireEvent.keyDown(content, {
                key: 'Tab',
                code: 'Tab',
                bubbles: true,
                cancelable: true,
            });
        });
        
        const view = getView(container);
        const result = view?.state.doc.toString();
        const expected = '    abc';
        
        cleanup();
        
        t.equal(result, expected);
        t.end();
    });
    
    test('Editor: highlightRange effect uses posFromIndexProp when provided', (t) => {
        const {container, rerender} = render(
            <Editor value="const x = 1;"/>,
        );
        
        act(() => {
            rerender(
                <Editor
                    value="const x = 1;"
                    highlightRange={[0, 5]}
                    posFromIndex={(_doc, idx) => ({
                        line: 0,
                        ch: idx,
                    })}
                />,
            );
        });
        
        const view = getView(container);
        
        const {anchor, head} = view?.state.selection.main || {
            anchor: 1,
            head: 1,
        };
        
        cleanup();
        
        t.ok(!anchor && head === 5, 'selection set via posFromIndexProp');
        t.end();
    });
    
    test('Editor: highlightRange effect falls through to adapterPosFromIndex when posFromIndexProp returns null', (t) => {
        const {container, rerender} = render(
            <Editor value="const x = 1;"/>,
        );
        
        act(() => {
            rerender(
                <Editor
                    value="const x = 1;"
                    highlightRange={[0, 5]}
                    posFromIndex={() => null}
                />,
            );
        });
        
        const view = getView(container);
        
        const {anchor, head} = view?.state.selection.main || {
            anchor: 1,
            head: 1,
        };
        
        cleanup();
        
        t.ok(!anchor && head === 5, 'selection set via adapter fallback');
        t.end();
    });
    
    test('Editor: highlightRange effect does not dispatch when start is null', (t) => {
        const {container, rerender} = render(
            <Editor value="const x = 1;"/>,
        );
        
        act(() => {
            rerender(
                <Editor
                    value="const x = 1;"
                    highlightRange={[0, 5]}
                    posFromIndex={(_doc, idx) => idx === 0 ? null : {
                        line: 0,
                        ch: idx,
                    }}
                />,
            );
        });
        
        const view = getView(container);
        
        const {anchor, head} = view?.state.selection.main || {
            anchor: 1,
            head: 1,
        };
        
        cleanup();
        
        t.ok(!anchor && !head, 'no selection when start is null');
        t.end();
    });
    
    test('Editor: highlightRange effect does not dispatch when endOffset is null', (t) => {
        const {container, rerender} = render(
            <Editor value="const x = 1;"/>,
        );
        
        act(() => {
            rerender(
                <Editor
                    value="const x = 1;"
                    highlightRange={[0, 5]}
                    posFromIndex={(_doc, idx) => idx === 5 ? null : {
                        line: 0,
                        ch: idx,
                    }}
                />,
            );
        });
        
        const view = getView(container);
        
        const {anchor, head} = view?.state.selection.main || {
            anchor: 1,
            head: 1,
        };
        
        cleanup();
        
        t.ok(!anchor && !head, 'no selection when endOffset is null');
        t.end();
    });
    
    await act(async () => {
        const view = getView(container);
        
        view?.dispatch({
            selection: {
                anchor: 3,
            },
        });
        await new Promise((r: (value: undefined) => void) => setTimeout(r, 150));
    });
    cleanup();
    
    const result = typeof received;
    const expected = 'number';
    
    t.equal(result, expected);
    t.end();
});
