import {initialState, type State} from './state.ts';

/**
 * Returns the subset of the data that makes sense to persist between visits.
 */
export const persist = (state: State) => ({
    ...pick(state, 'showTransformPanel', 'parserSettings', 'parserPerCategory'),
    workbench: {
        ...pick(state.workbench, 'parser', 'code', 'keyMap'),
        transform: pick(state.workbench.transform, 'code', 'transformer'),
    },
});

/**
 * Set the stored code as the initial version: CodeMirror is uncontrolled.
 * This overwrites `workbench.initialCode`, `workbench.parserSettings` and
 * `workbench.transform.initialCode`. To preload them, set `workbench.code`,
 * `parserSettings[parser]` and `workbench.transform.code`.
 */
export const revive = (state: State = initialState) => ({
    ...state,
    workbench: {
        ...state.workbench,
        initialCode: state.workbench.code,
        parserSettings: state.parserSettings[state.workbench.parser] || null,
        transform: {
            ...state.workbench.transform,
            initialCode: state.workbench.transform.code,
        },
    },
});

function pick<T extends object, K extends keyof T>(obj: T, ...properties: K[]): Pick<T, K> {
    return properties.reduce((result, prop) => {
        result[prop] = obj[prop];
        return result;
    }, {} as Pick<T, K>);
}
