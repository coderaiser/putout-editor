import {EditorState, Compartment} from '@codemirror/state';
import {EditorView, lineNumbers as lineNumbersExtension, drawSelection} from '@codemirror/view';
import {foldGutter, codeFolding} from '@codemirror/language';
import {keymapExtension, themeExtension, languageExtension} from './options.js';
import {markField, lineField} from './decorations.js';

export function createEditor(container, options = {}) { /* c8 ignore next */
    const {
        value              = '',
        mode               = 'javascript',
        keyMap             = 'default',
        theme              = 'default',
        lineNumbers        = true,
        readOnly           = false,
        foldGutter: fold   = false,
        updateListener,
    } = options;

    const themeCompartment  = new Compartment();
    const keymapCompartment = new Compartment();
    const langCompartment   = new Compartment();

    const extensions = [
        markField,
        lineField,
        themeCompartment.of(themeExtension(theme)),
        keymapCompartment.of(keymapExtension(keyMap)),
        langCompartment.of(languageExtension(mode)),
        ...(lineNumbers ? [lineNumbersExtension()] : []),
        ...(fold ? [foldGutter(), codeFolding()] : []),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
        ...(updateListener ? [EditorView.updateListener.of(updateListener)] : []),
        drawSelection(),
    ];

    const view = new EditorView({
        state: EditorState.create({doc: value, extensions}),
        parent: container,
    });

    view._themeCompartment  = themeCompartment;
    view._keymapCompartment = keymapCompartment;
    view._langCompartment   = langCompartment;

    return view;
}