import {test} from 'supertape';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {on, off} from './events.js';

function makeView() {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    return new EditorView({
        state: EditorState.create({
            doc: 'hello',
        }),
        parent: element,
    });
}

test('events: on returns tuple of event name and handler', (t) => {
    const view = makeView();
    const handler = () => {};
    const result = on(view, 'blur', handler);
    const expected = ['blur', handler];
    
    view.destroy();
    
    t.deepEqual(result, expected);
    t.end();
});

test('events: on fires handler when event dispatched on contentDOM', (t) => {
    const view = makeView();
    let fired = false;

    const [eventName, handler] = on(view, 'blur', () => {
        fired = true;
    });

    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    off(view, eventName, handler);
    view.destroy();

    t.ok(fired);
    t.end();
});

test('events: off removes handler from contentDOM', (t) => {
    const view = makeView();
    let count = 0;

    const [eventName, handler] = on(view, 'blur', () => {
        count++;
    });

    off(view, eventName, handler);
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    view.destroy();

    t.equal(count, 0);
    t.end();
});

test('events: handler fires on contentDOM blur (not view.dom)', (t) => {
    const view = makeView();
    let fired = false;

    const [eventName, handler] = on(view, 'blur', () => {
        fired = true;
    });

    // Dispatch on contentDOM (the actual focusable element)
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));

    t.ok(fired, 'handler should fire when blur dispatched on contentDOM');
    off(view, eventName, handler);
    view.destroy();
    t.end();
});

test('events: handler does NOT fire when event dispatched only on view.dom wrapper', (t) => {
    const view = makeView();
    let fired = false;

    const [eventName, handler] = on(view, 'blur', () => {
        fired = true;
    });

    // Dispatch on view.dom (outer wrapper) - should NOT trigger handler
    // since listener is on contentDOM, and events dispatched on view.dom
    // won't bubble down to contentDOM
    view.dom.dispatchEvent(new FocusEvent('blur', {bubbles: false}));

    t.notOk(fired, 'handler should NOT fire when event only on view.dom wrapper');
    off(view, eventName, handler);
    view.destroy();
    t.end();
});
