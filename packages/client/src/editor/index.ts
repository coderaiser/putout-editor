export {
    createEditor,
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

// Null-safe wrappers
export {posFromIndex, indexFromPos} from './position.js';

// Existing exports
export {default as Editor} from './Editor.js';
export {default as getFocusPath} from './getFocusPath.ts';
export {default as resolvePositionFromIndex} from './resolvePositionFromIndex.js';
export {default as stringify} from './stringify.ts';
export {formatInput, formatRule} from './format.ts';
