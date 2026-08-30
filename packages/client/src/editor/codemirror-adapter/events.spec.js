import {test} from 'supertape';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {on, off} from './events.js';

function makeView() {
    const element = document.createElement('div');
    document.body.appendChild(element);
    return new EditorView({state: EditorState.create({doc: 'hello'}), parent: element});
}

test('events: on returns tuple of event name and handler', (t) => {
    const view = makeView();
    const handler = () => {};
    t.deepEqual(on(view, 'blur', handler), ['blur', handler]);
    view.destroy();
    t.end();
});

test('events: on fires handler when event dispatched', (t) => {
    const view = makeView();
    let fired = false;
    const [eventName, handler] = on(view, 'blur', () => { fired = true; });
    view.dom.dispatchEvent(new FocusEvent('blur'));
    off(view, eventName, handler);
    view.destroy();
    t.ok(fired);
    t.end();
});

test('events: off removes handler from view dom', (t) => {
    const view = makeView();
    let count = 0;
    const [eventName, handler] = on(view, 'blur', () => { count++; });
    off(view, eventName, handler);
    view.dom.dispatchEvent(new FocusEvent('blur'));
    view.destroy();
    t.equal(count, 0);
    t.end();
});