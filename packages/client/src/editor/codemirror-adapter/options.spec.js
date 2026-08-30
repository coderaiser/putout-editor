import {test} from 'supertape';
import {EditorState, Compartment} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {keymapExtension, themeExtension, languageExtension, setOption} from './options.js';

function makeView() {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const view = new EditorView({state: EditorState.create({doc: 'hello'}), parent: element});
    view._themeCompartment  = new Compartment();
    view._keymapCompartment = new Compartment();
    view._langCompartment   = new Compartment();
    return view;
}

test('options: keymapExtension default returns extension object', (t) => {
    t.ok(keymapExtension('default'));
    t.end();
});

test('options: keymapExtension vim returns extension object', (t) => {
    t.ok(keymapExtension('vim'));
    t.end();
});

test('options: keymapExtension emacs returns extension object', (t) => {
    t.ok(keymapExtension('emacs'));
    t.end();
});

test('options: themeExtension nord returns nord theme object', (t) => {
    t.ok(themeExtension('nord'));
    t.end();
});

test('options: themeExtension default returns empty array', (t) => {
    t.deepEqual(themeExtension('default'), []);
    t.end();
});

test('options: languageExtension javascript returns extension object', (t) => {
    t.ok(languageExtension('javascript'));
    t.end();
});

test('options: languageExtension object with javascript name returns extension', (t) => {
    t.ok(languageExtension({name: 'javascript', json: true}));
    t.end();
});

test('options: languageExtension unknown string returns empty array', (t) => {
    t.deepEqual(languageExtension('css'), []);
    t.end();
});

test('options: languageExtension null returns empty array', (t) => {
    t.deepEqual(languageExtension(null), []);
    t.end();
});

test('options: setOption theme dispatches without throwing', (t) => {
    const view = makeView();
    setOption(view, 'theme', 'nord');
    view.destroy();
    t.ok(true);
    t.end();
});

test('options: setOption keyMap dispatches without throwing', (t) => {
    const view = makeView();
    setOption(view, 'keyMap', 'vim');
    view.destroy();
    t.ok(true);
    t.end();
});

test('options: setOption mode dispatches without throwing', (t) => {
    const view = makeView();
    setOption(view, 'mode', 'javascript');
    view.destroy();
    t.ok(true);
    t.end();
});