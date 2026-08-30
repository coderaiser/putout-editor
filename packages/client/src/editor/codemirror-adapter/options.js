import {keymap} from '@codemirror/view';
import {
    defaultKeymap,
    emacsStyleKeymap,
} from '@codemirror/commands';
import {javascript} from '@codemirror/lang-javascript';
import {vim} from '@replit/codemirror-vim';
import {nord} from '@uiw/codemirror-theme-nord';

export function keymapExtension(name) {
    if (name === 'vim')
        return vim();
    
    if (name === 'emacs')
        return keymap.of(emacsStyleKeymap);
    
    return keymap.of(defaultKeymap);
}

export function themeExtension(name) {
    return name === 'nord' ? nord : [];
}

export function languageExtension(mode) {
    const name = typeof mode === 'object' ? mode?.name : mode;
    
    if (name === 'javascript')
        return javascript();
    
    return [];
}

export function setOption(view, key, value) {
    if (key === 'theme')
        return view.dispatch({
            effects: view._themeCompartment.reconfigure(themeExtension(value)),
        });
    
    if (key === 'keyMap')
        return view.dispatch({
            effects: view._keymapCompartment.reconfigure(keymapExtension(value)),
        });
    
    if (key === 'mode')
        return view.dispatch({
            effects: view._langCompartment.reconfigure(languageExtension(value)),
        });
}
