import {test} from 'supertape';
import {getView, setValue} from 'qword/client';
import {withAsyncSelectionChange} from '../test/dom.ts';
import {
    createControlledEditor,
    type ControlledEditor,
    type ControlledEditorOptions,
    type KeyLike,
} from './controlledEditor.ts';

const noop = (): void => {};

interface Mounted {
    container: HTMLElement;
    editor: ControlledEditor;
}

const mount = (overrides: Partial<ControlledEditorOptions> = {}): Mounted => {
    const container = document.createElement('div');
    
    document.body.append(container);
    
    const editor = createControlledEditor(container, {
        value: '',
        onChange: noop,
        onKeyDown: noop,
        ...overrides,
    });
    
    return {
        container,
        editor,
    };
};

const unmount = ({container, editor}: Mounted): void => {
    editor.destroy();
    container.remove();
};

const viewOf = ({container}: Mounted) => getView(container)!;

const docOf = (mounted: Mounted): string => viewOf(mounted).state.doc.toString();

const tick = () => Promise.resolve();

const frame = () => new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
});

const keydown = ({container}: Mounted, key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...init,
    });
    
    container.dispatchEvent(event);
    
    return event;
};

test('controlledEditor: builds an editor in the container', (t) => {
    const mounted = mount();
    
    const result = mounted.container.querySelector('.cm-editor') !== null;
    
    unmount(mounted);
    
    t.ok(result);
    t.end();
});

test('controlledEditor: the editor holds the first value', (t) => {
    const mounted = mount({
        value: '/help',
    });
    
    const result = docOf(mounted);
    const expected = '/help';
    
    unmount(mounted);
    
    t.equal(result, expected);
    t.end();
});

test('controlledEditor: lineNumbers draws the gutter', (t) => {
    const mounted = mount({
        lineNumbers: true,
    });
    
    const result = mounted.container.querySelector('.cm-lineNumbers') !== null;
    
    unmount(mounted);
    
    t.ok(result);
    t.end();
});

test('controlledEditor: no lineNumbers draws no gutter', (t) => {
    const mounted = mount({
        lineNumbers: false,
    });
    
    const result = mounted.container.querySelector('.cm-lineNumbers');
    
    unmount(mounted);
    
    t.notOk(result);
    t.end();
});

test('controlledEditor: the caret starts at the end of the first value', (t) => {
    const mounted = mount({
        value: '/hel',
    });
    
    const result = viewOf(mounted).state.selection.main.head;
    const expected = 4;
    
    unmount(mounted);
    
    t.equal(result, expected);
    t.end();
});

test('controlledEditor: the content opts out of iOS text rewriting', (t) => {
    const mounted = mount();
    const content = mounted.container.querySelector('.cm-content') as HTMLElement;
    
    const result = [
        content.getAttribute('autocapitalize'),
        content.getAttribute('autocorrect'),
        content.getAttribute('spellcheck'),
    ];
    
    const expected = [
        'none',
        'off',
        'false',
    ];
    
    unmount(mounted);
    
    t.deepEqual(result, expected);
    t.end();
});

test('controlledEditor: a change in the editor calls onChange', (t) => {
    const calls: string[] = [];
    
    const onChange = (next: string) => calls.push(next);
    
    const mounted = mount({
        onChange,
    });
    
    setValue(viewOf(mounted), '/help');
    
    const result = calls;
    const expected = ['/help'];
    
    unmount(mounted);
    
    t.deepEqual(result, expected);
    t.end();
});

test('controlledEditor: setValue puts the text in the editor', (t) => {
    const mounted = mount();
    
    withAsyncSelectionChange(() => mounted.editor.setValue('/ast'));
    
    const result = docOf(mounted);
    const expected = '/ast';
    
    unmount(mounted);
    
    t.equal(result, expected);
    t.end();
});

test('controlledEditor: setValue puts the caret at the end', (t) => {
    const mounted = mount({
        value: 'abc',
    });
    
    withAsyncSelectionChange(() => mounted.editor.setValue('/help world'));
    
    const result = viewOf(mounted).state.selection.main.head;
    const expected = 11;
    
    unmount(mounted);
    
    t.equal(result, expected);
    t.end();
});

test('controlledEditor: setValue does not call onChange: the echo is dropped', (t) => {
    const calls: string[] = [];
    
    const onChange = (next: string) => calls.push(next);
    
    const mounted = mount({
        onChange,
    });
    
    withAsyncSelectionChange(() => mounted.editor.setValue('/ast'));
    
    const result = calls;
    const expected: string[] = [];
    
    unmount(mounted);
    
    t.deepEqual(result, expected);
    t.end();
});

test('controlledEditor: setValue with the text it already holds changes nothing', (t) => {
    const mounted = mount({
        value: 'abc',
    });
    
    viewOf(mounted).dispatch({
        selection: {
            anchor: 1,
        },
    });
    
    mounted.editor.setValue('abc');
    
    const result = viewOf(mounted).state.selection.main.head;
    const expected = 1;
    
    unmount(mounted);
    
    t.equal(result, expected);
    t.end();
});

test('controlledEditor: a change after setValue is reported again', (t) => {
    const calls: string[] = [];
    
    const onChange = (next: string) => calls.push(next);
    
    const mounted = mount({
        onChange,
    });
    
    withAsyncSelectionChange(() => mounted.editor.setValue('/ast'));
    setValue(viewOf(mounted), '/help');
    
    const result = calls;
    const expected = ['/help'];
    
    unmount(mounted);
    
    t.deepEqual(result, expected);
    t.end();
});

test('controlledEditor: setValue puts the DOM caret at the end in the next frame', async (t) => {
    const mounted = mount();
    
    withAsyncSelectionChange(() => mounted.editor.setValue('/help'));
    await frame();
    
    const selection = document.getSelection()!;
    
    const result = selection.rangeCount;
    const expected = 1;
    
    unmount(mounted);
    
    t.equal(result, expected);
    t.end();
});

test('controlledEditor: a frame after destroy leaves the selection alone', async (t) => {
    const mounted = mount();
    
    document.getSelection()!.removeAllRanges();
    
    withAsyncSelectionChange(() => mounted.editor.setValue('/help'));
    unmount(mounted);
    await frame();
    
    const result = document.getSelection()!.rangeCount;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('controlledEditor: a frame after the text changed again leaves the selection alone', async (t) => {
    const mounted = mount();
    
    document.getSelection()!.removeAllRanges();
    
    withAsyncSelectionChange(() => mounted.editor.setValue('/help'));
    setValue(viewOf(mounted), '/help world');
    await frame();
    
    const result = document.getSelection()!.rangeCount;
    const expected = 0;
    
    unmount(mounted);
    
    t.equal(result, expected);
    t.end();
});

test('controlledEditor: keydown reaches onKeyDown with the key and the modifiers', (t) => {
    const calls: Omit<KeyLike, 'preventDefault'>[] = [];
    
    const mounted = mount({
        onKeyDown: ({key, shiftKey, ctrlKey, metaKey}) => calls.push({
            key,
            shiftKey,
            ctrlKey,
            metaKey,
        }),
    });
    
    keydown(mounted, 'Enter', {
        ctrlKey: true,
    });
    
    const result = calls;
    
    const expected = [{
        key: 'Enter',
        shiftKey: false,
        ctrlKey: true,
        metaKey: false,
    }];
    
    unmount(mounted);
    
    t.deepEqual(result, expected);
    t.end();
});

test('controlledEditor: preventDefault in onKeyDown stops the key', (t) => {
    const mounted = mount({
        onKeyDown: (event) => event.preventDefault(),
    });
    
    const {defaultPrevented} = keydown(mounted, 'Enter');
    
    const result = defaultPrevented;
    
    unmount(mounted);
    
    t.ok(result);
    t.end();
});

test('controlledEditor: a key that onKeyDown lets go is not prevented', (t) => {
    const mounted = mount();
    
    const {defaultPrevented} = keydown(mounted, 'a');
    
    const result = defaultPrevented;
    
    unmount(mounted);
    
    t.notOk(result);
    t.end();
});

test('controlledEditor: destroy removes the key listener', (t) => {
    const calls: string[] = [];
    
    const mounted = mount({
        onKeyDown: ({key}) => calls.push(key),
    });
    
    mounted.editor.destroy();
    keydown(mounted, 'Enter');
    
    const result = calls;
    const expected: string[] = [];
    
    mounted.container.remove();
    
    t.deepEqual(result, expected);
    t.end();
});

test('controlledEditor: destroy removes the editor', (t) => {
    const mounted = mount();
    
    unmount(mounted);
    
    const result = mounted.container.querySelector('.cm-editor');
    
    t.notOk(result);
    t.end();
});

test('controlledEditor: focus takes the focus', (t) => {
    const mounted = mount({
        focus: true,
    });
    
    const content = mounted.container.querySelector('.cm-content');
    
    const result = document.activeElement === content;
    
    unmount(mounted);
    
    t.ok(result);
    t.end();
});

test('controlledEditor: no focus option leaves the focus alone', (t) => {
    const mounted = mount();
    
    const content = mounted.container.querySelector('.cm-content');
    
    const result = document.activeElement === content;
    
    unmount(mounted);
    
    t.notOk(result);
    t.end();
});

test('controlledEditor: the command word of the first value is marked', (t) => {
    const mounted = mount({
        value: '/help topic',
    });
    
    const mark = mounted.container.querySelector('.input__command');
    
    const result = mark && mark.textContent;
    const expected = '/help';
    
    unmount(mounted);
    
    t.equal(result, expected);
    t.end();
});

test('controlledEditor: a change moves the mark to the new command word', async (t) => {
    const mounted = mount({
        value: '/help topic',
    });
    
    setValue(viewOf(mounted), '/ast');
    await tick();
    
    const mark = mounted.container.querySelector('.input__command');
    
    const result = mark && mark.textContent;
    const expected = '/ast';
    
    unmount(mounted);
    
    t.equal(result, expected);
    t.end();
});

test('controlledEditor: a change followed by destroy does not dispatch to the dead editor', async (t) => {
    const mounted = mount();
    const view = viewOf(mounted);
    
    const target = view as unknown as {
        dispatch: (...args: unknown[]) => void;
    };
    
    const original = target.dispatch.bind(view);
    let count = 0;
    
    target.dispatch = (...args) => {
        ++count;
        original(...args);
    };
    
    setValue(view, '/ast');
    unmount(mounted);
    
    const before = count;
    
    await tick();
    
    const result = count - before;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});
