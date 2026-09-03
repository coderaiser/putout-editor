import {keymap, type EditorView} from '@codemirror/view';
import {
    defaultKeymap,
    emacsStyleKeymap,
} from '@codemirror/commands';
import {javascript} from '@codemirror/lang-javascript';
import {vim} from '@replit/codemirror-vim';
import {nord} from '@uiw/codemirror-theme-nord';
import type {Extension} from '@codemirror/state';
import type {
    KeyMap,
    EditorMode,
    EditorTheme,
} from '../../types.ts';

export function keymapExtension(name: KeyMap): Extension {
    if (name === 'vim')
        return vim();
    
    if (name === 'emacs')
        return keymap.of(emacsStyleKeymap);
    
    return keymap.of(defaultKeymap);
}

export function themeExtension(name: EditorTheme): Extension {
    return name === 'nord' ? nord : [];
}

export function languageExtension(mode: EditorMode | {
    name: EditorMode;
}): Extension {
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
    };

export function setOption(view: EditorView & {
    _themeCompartment: import('@codemirror/state');
    _keymapCompartment: import('@codemirror/state');
    _langCompartment: import('@codemirror/state');
}, key: OptionKey, value: OptionValue): void {
    if (key === 'theme')
        return view.dispatch({
            effects: view._themeCompartment.reconfigure(themeExtension(value as EditorTheme)),
        });
    
    if (key === 'keyMap')
        return view.dispatch({
            effects: view._keymapCompartment.reconfigure(keymapExtension(value as KeyMap)),
        });
    
    if (key === 'mode')
        return view.dispatch({
            effects: view._langCompartment.reconfigure(languageExtension(value as EditorMode | {
                name: EditorMode;
            })),
        });
}
