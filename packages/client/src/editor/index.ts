export {
    getValue,
    setValue,
    getDocValue,
    setDocValue,
    getScrollInfo,
    scrollTo,
    getCursorIndex,
    markText,
    addLineClass,
    removeLineClass,
    setOption,
    on,
    off,
    getView,
    refresh,
    observeResize,
} from 'qword/client';

// qword's `createEditor`, plus the `allowMultipleSelections` the editor needs for
// vim blockwise visual. Import this one from here, not from `qword/client`.
export {createEditor} from './create-editor.ts';

// Null-safe wrappers
export {posFromIndex, indexFromPos} from './position.ts';

// Existing exports
export {default as Editor} from './Editor.tsx';
export {default as getFocusPath} from './getFocusPath.ts';
export {default as resolvePositionFromIndex} from './resolvePositionFromIndex.ts';
export {default as stringify} from './stringify.ts';
export {formatInput, formatRule} from './format.ts';
