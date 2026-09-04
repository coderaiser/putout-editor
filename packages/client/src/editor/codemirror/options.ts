import {keymap, type EditorView} from '@codemirror/view';
import {
    defaultKeymap,
    emacsStyleKeymap,
    indentWithTab,
} from '@codemirror/commands';
import {javascript} from '@codemirror/lang-javascript';
import {vim} from '@replit/codemirror-vim';
import {nord} from '@uiw/codemirror-theme-nord';
import {type Extension, type Compartment} from '@codemirror/state';
import type {
    KeyMap,
    EditorMode,
    EditorTheme,
} from '../../types.ts';

export function keymapExtension(name: KeyMap): Extension {
    if (name === 'vim')
        return vim();
    
    if (name === 'emacs')
        return keymap.of([...emacsStyleKeymap, indentWithTab]);
    
    return keymap.of([...defaultKeymap, indentWithTab]);
}

export function themeExtension(name: EditorTheme): Extension {
    return name === 'nord' ? nord : [];
}

export function languageExtension(mode: EditorMode | {
    name: EditorMode;
    json?: boolean;
} | null): Extension {
    const name = typeof mode === 'object' ? mode?.name : mode;
    
    if (name === 'javascript')
        return javascript();
    
    return [];
}

export type OptionKey = 'theme' | 'keyMap' | 'mode';

export type OptionValue =
    | EditorTheme
    | KeyMap
    | EditorMode
    | {
        name: EditorMode;
        json?: boolean;
    }
    | null;

export function setOption(view: EditorView & {
    _themeCompartment: Compartment;
    _keymapCompartment: Compartment;
    _langCompartment: Compartment;
}, key: OptionKey, value: OptionValue): void {
    const {
        _themeCompartment,
        _keymapCompartment,
        _langCompartment,
    } = view;
    
    if (key === 'theme')
        return view.dispatch({
            effects: _themeCompartment.reconfigure(themeExtension(value as EditorTheme)),
        });
    
    if (key === 'keyMap')
        return view.dispatch({
            effects: _keymapCompartment.reconfigure(keymapExtension(value as KeyMap)),
        });
    
    if (key === 'mode')
        return view.dispatch({
            effects: _langCompartment.reconfigure(languageExtension(value as EditorMode | {
                name: EditorMode;
            })),
        });
}
