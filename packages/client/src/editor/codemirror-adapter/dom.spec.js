import {test} from 'supertape';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {getView, refresh, observeResize} from './dom.js';

function makeViewInContainer() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const view = new EditorView({state: EditorState.create({doc: 'hello'}), parent: container});
    return {view, container};
}

test('dom: getView returns EditorView from container', (t) => {
    const {view, container} = makeViewInContainer();
    t.equal(getView(container), view);
    view.destroy();
    t.end();
});

test('dom: getView returns null for empty container', (t) => {
    const container = document.createElement('div');
    t.equal(getView(container), null);
    t.end();
});

test('dom: refresh calls requestMeasure without throwing', (t) => {
    const {view} = makeViewInContainer();
    refresh(view);
    t.ok(true);
    view.destroy();
    t.end();
});

test('dom: observeResize returns a function', (t) => {
    const {view, container} = makeViewInContainer();
    const cleanup = observeResize(view, container);
    t.equal(typeof cleanup, 'function');
    cleanup();
    view.destroy();
    t.end();
});

test('dom: observeResize cleanup disconnects without throwing', (t) => {
    const {view, container} = makeViewInContainer();
    const cleanup = observeResize(view, container);
    cleanup();
    t.ok(true);
    view.destroy();
    t.end();
});