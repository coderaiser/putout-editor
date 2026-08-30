import {test} from 'supertape';
import {createEditor} from './create.js';

function makeContainer() {
    const element = document.createElement('div');
    document.body.appendChild(element);
    return element;
}

test('create: createEditor doc matches value option', (t) => {
    const view = createEditor(makeContainer(), {value: 'hello'});
    t.equal(view.state.doc.toString(), 'hello');
    view.destroy();
    t.end();
});

test('create: createEditor readOnly true sets state readOnly', (t) => {
    const view = createEditor(makeContainer(), {readOnly: true});
    t.ok(view.state.readOnly);
    view.destroy();
    t.end();
});

test('create: createEditor lineNumbers false does not throw', (t) => {
    const view = createEditor(makeContainer(), {lineNumbers: false});
    t.ok(view.state);
    view.destroy();
    t.end();
});

test('create: createEditor foldGutter true does not throw', (t) => {
    const view = createEditor(makeContainer(), {foldGutter: true});
    t.ok(view.state);
    view.destroy();
    t.end();
});

test('create: createEditor vim keyMap does not throw', (t) => {
    const view = createEditor(makeContainer(), {keyMap: 'vim'});
    t.ok(view.state);
    view.destroy();
    t.end();
});

test('create: createEditor emacs keyMap does not throw', (t) => {
    const view = createEditor(makeContainer(), {keyMap: 'emacs'});
    t.ok(view.state);
    view.destroy();
    t.end();
});

test('create: createEditor nord theme does not throw', (t) => {
    const view = createEditor(makeContainer(), {theme: 'nord'});
    t.ok(view.state);
    view.destroy();
    t.end();
});

test('create: createEditor mode object does not throw', (t) => {
    const view = createEditor(makeContainer(), {mode: {name: 'javascript', json: true}});
    t.ok(view.state);
    view.destroy();
    t.end();
});

test('create: createEditor updateListener is called on change', (t) => {
    let called = false;
    const view = createEditor(makeContainer(), {
        updateListener: () => { called = true; },
    });
    view.dispatch({changes: {from: 0, to: 0, insert: 'x'}});
    view.destroy();
    t.ok(called);
    t.end();
});

test('create: createEditor exposes themeCompartment on view', (t) => {
    const view = createEditor(makeContainer());
    t.ok(view._themeCompartment);
    view.destroy();
    t.end();
});

test('create: createEditor exposes keymapCompartment on view', (t) => {
    const view = createEditor(makeContainer());
    t.ok(view._keymapCompartment);
    view.destroy();
    t.end();
});

test('create: createEditor exposes langCompartment on view', (t) => {
    const view = createEditor(makeContainer());
    t.ok(view._langCompartment);
    view.destroy();
    t.end();
});