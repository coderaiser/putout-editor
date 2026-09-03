export {createEditor} from './create.ts';
export type {CreateEditorOptions, PutoutEditorView} from './create.ts';
export {
    getValue,
    setValue,
    getDocValue,
    setDocValue,
} from './content.ts';
export {getScrollInfo, scrollTo} from './scroll.ts';
export type {ScrollInfo} from './scroll.ts';
export {
    posFromIndex,
    indexFromPos,
    getCursorIndex,
    offsetToPosition,
    positionToOffset,
} from './position.ts';
export {
    markText,
    addLineClass,
    removeLineClass,
    markField,
    lineField,
} from './decorations.ts';
export type {MarkHandle} from './decorations.ts';
export {setOption} from './options.ts';
export type {OptionKey, OptionValue} from './options.ts';
export {on, off} from './events.ts';
export type {EventBinding} from './events.ts';
export {getView, refresh, observeResize} from './dom.ts';