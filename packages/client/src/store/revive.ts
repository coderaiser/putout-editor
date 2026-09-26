import {
    initialState,
    type State,
} from './state.ts';

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
 * When read from persistent storage, set the last stored code as initial version.
 * This is necessary because we use CodeMirror as an uncontrolled component.
 *
 * Note this *derives* `workbench.initialCode`, `workbench.parserSettings` and
 * `workbench.transform.initialCode` from other state. Anything that passes a
 * preloaded state through here will have those three overwritten, so set the
 * fields they come from — `workbench.code`, the top-level
 * `parserSettings[parser]` map, and `workbench.transform.code` — instead.
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
