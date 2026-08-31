import {EditorState, Compartment} from '@codemirror/state';
import {tags} from '@lezer/highlight';
import {history, historyKeymap} from '@codemirror/commands';
import {
    EditorView,
    lineNumbers as lineNumbersExtension,
    drawSelection,
    keymap,
} from '@codemirror/view';
import {
    foldGutter,
    codeFolding,
    syntaxHighlighting,
    HighlightStyle,
} from '@codemirror/language';
import {
    keymapExtension,
    themeExtension,
    languageExtension,
} from './options.js';
import {markField, lineField} from './decorations.js';

const editorHighlightStyle = HighlightStyle.define([{
    tag: tags.keyword,
    class: 'hl-keyword',
}, {
    tag: tags.definitionKeyword,
    class: 'hl-keyword',
}, {
    tag: tags.controlKeyword,
    class: 'hl-keyword',
}, {
    tag: tags.moduleKeyword,
    class: 'hl-module-keyword',
}, {
    tag: tags.operatorKeyword,
    class: 'hl-operator',
}, {
    tag: tags.string,
    class: 'hl-string',
}, {
    tag: tags.number,
    class: 'hl-number',
}, {
    tag: tags.integer,
    class: 'hl-number',
}, {
    tag: tags.float,
    class: 'hl-number',
}, {
    tag: tags.bool,
    class: 'hl-constant',
}, {
    tag: tags.null,
    class: 'hl-constant',
}, {
    tag: tags.comment,
    class: 'hl-comment',
}, {
    tag: tags.lineComment,
    class: 'hl-comment',
}, {
    tag: tags.blockComment,
    class: 'hl-comment',
}, {
    tag: tags.variableName,
    class: 'hl-name',
}, {
    tag: tags.function(tags.variableName),
    class: 'hl-function',
}, {
    tag: tags.definition(tags.variableName),
    class: 'hl-name',
}, {
    tag: tags.propertyName,
    class: 'hl-name',
}, {
    tag: tags.className,
    class: 'hl-class',
}, {
    tag: tags.typeName,
    class: 'hl-type',
}, {
    tag: tags.operator,
    class: 'hl-operator',
}, {
    tag: tags.punctuation,
    class: 'hl-punctuation',
}, {
    tag: tags.regexp,
    class: 'hl-regexp',
}, {
    tag: tags.escape,
    class: 'hl-escape',
}, {
    tag: tags.tagName,
    class: 'hl-tag',
}, {
    tag: tags.attributeName,
    class: 'hl-attr',
}]);

export function createEditor(container, options = {}) {
    /* c8 ignore next */
    const {
        value = '',
        mode = 'javascript',
        keyMap = 'default',
        theme = 'default',
        lineNumbers = true,
        readOnly = false,
        foldGutter: fold = false,
        updateListener,
    } = options;
    
    const themeCompartment = new Compartment();
    const keymapCompartment = new Compartment();
    const langCompartment = new Compartment();
    const historyCompartment = new Compartment();
    
    const hideCursorOnBlur = EditorView.theme({
        '&:not(.cm-focused) .cm-fat-cursor': {
            display: 'none',
        },
    });
    
    const extensions = [
        historyCompartment.of([
            history(),
            keymap.of(historyKeymap),
        ]),
        markField,
        lineField,
        themeCompartment.of(themeExtension(theme)),
        keymapCompartment.of(keymapExtension(keyMap)),
        langCompartment.of(languageExtension(mode)),
        syntaxHighlighting(editorHighlightStyle),
        ...lineNumbers
            ? [
                lineNumbersExtension(),
            ]
            : [],
        ...fold
            ? [
                foldGutter(),
                codeFolding(),
            ]
            : [],
        ...readOnly
            ? [
                EditorState.readOnly.of(true),
            ]
            : [],
        ...updateListener
            ? [
                EditorView.updateListener.of(updateListener),
            ]
            : [],
        drawSelection(),
        hideCursorOnBlur,
    ];
    
    const view = new EditorView({
        state: EditorState.create({
            doc: value,
            extensions,
        }),
        parent: container,
    });
    
    view._themeCompartment = themeCompartment;
    view._keymapCompartment = keymapCompartment;
    view._langCompartment = langCompartment;
    
    return view;
}
