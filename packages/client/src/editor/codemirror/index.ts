export {
    createEditor,
    type CreateEditorOptions,
    type PutoutEditorView,
} from './create.ts';

export {
    getValue,
    setValue,
    getDocValue,
    setDocValue,
} from './content.ts';
export {
    getScrollInfo,
    scrollTo,
    type ScrollInfo,
} from './scroll.ts';

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
    type MarkHandle,
} from './decorations.ts';

export {
    setOption,
    type OptionKey,
    type OptionValue,
} from './options.ts';

export {
    on,
    off,
    type EventBinding,
} from './events.ts';

export {
    getView,
    refresh,
    observeResize,
} from './dom.ts';
