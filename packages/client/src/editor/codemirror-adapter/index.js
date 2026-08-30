export {createEditor} from './create.js';
export {
    getValue,
    setValue,
    getDocValue,
    setDocValue,
} from './content.js';
export {getScrollInfo, scrollTo} from './scroll.js';
export {
    posFromIndex,
    indexFromPos,
    getCursorIndex,
} from './position.js';
export {
    markText,
    addLineClass,
    removeLineClass,
} from './decorations.js';
export {setOption} from './options.js';
export {on, off} from './events.js';
export {
    getView,
    refresh,
    observeResize,
} from './dom.js';
