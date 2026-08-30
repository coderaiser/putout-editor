import {test} from 'supertape';
import {createEditor} from './create.js';

function makeContainer() {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    return element;
}

test('create: createEditor doc matches value option', (t) => {
    const view = createEditor(makeContainer(), {
        value: 'hello',
    });
    
    const result = view.state.doc.toString();
    const expected = 'hello';
    
    view.destroy();
    
    t.equal(result, expected);
    t.end();
});

test('create: createEditor readOnly true sets state readOnly', (t) => {
    const view = createEditor(makeContainer(), {
        readOnly: true,
    });
    
    view.destroy();
    
    t.ok(view.state.readOnly);
    t.end();
});

test('create: createEditor lineNumbers false does not throw', (t) => {
    const view = createEditor(makeContainer(), {
        lineNumbers: false,
    });
    
    view.destroy();
    
    t.ok(view.state);
    t.end();
});

test('create: createEditor foldGutter true does not throw', (t) => {
    const view = createEditor(makeContainer(), {
        foldGutter: true,
    });
    
    view.destroy();
    
    t.ok(view.state);
    t.end();
});

test('create: createEditor vim keyMap does not throw', (t) => {
    const view = createEditor(makeContainer(), {
        keyMap: 'vim',
    });
    
    view.destroy();
    
    t.ok(view.state);
    t.end();
});

test('create: createEditor emacs keyMap does not throw', (t) => {
    const view = createEditor(makeContainer(), {
        keyMap: 'emacs',
    });
    
    view.destroy();
    
    t.ok(view.state);
    t.end();
});

test('create: createEditor nord theme does not throw', (t) => {
    const view = createEditor(makeContainer(), {
        theme: 'nord',
    });
    
    view.destroy();
    
    t.ok(view.state);
    t.end();
});

test('create: createEditor mode object does not throw', (t) => {
    const view = createEditor(makeContainer(), {
        mode: {
            name: 'javascript',
            json: true,
        },
    });
    
    view.destroy();
    
    t.ok(view.state);
    t.end();
});

test('create: createEditor updateListener is called on change', (t) => {
    let called = false;
    const view = createEditor(makeContainer(), {
        updateListener: () => {
            called = true;
        },
    });
    
    view.dispatch({
        changes: {
            from: 0,
            to: 0,
            insert: 'x',
        },
    });
    view.destroy();
    
    t.ok(called);
    t.end();
});

test('create: createEditor exposes themeCompartment on view', (t) => {
    const view = createEditor(makeContainer());
    
    view.destroy();
    
    t.ok(view._themeCompartment);
    t.end();
});

test('create: createEditor exposes keymapCompartment on view', (t) => {
    const view = createEditor(makeContainer());
    
    view.destroy();
    
    t.ok(view._keymapCompartment);
    t.end();
});

test('create: createEditor produces syntax-highlighted spans for javascript', (t) => {
    const view = createEditor(makeContainer(), {value: 'const x = 1;', mode: 'javascript'});
    const spans = view.dom.querySelectorAll('span.hl-keyword');
    
    view.destroy();
    
    t.ok(spans.length > 0);
    t.end();
});

test('create: createEditor exposes langCompartment on view', (t) => {
    const view = createEditor(makeContainer());
    
    view.destroy();
    
    t.ok(view._langCompartment);
    t.end();
});
