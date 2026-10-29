import {setTimeout} from 'node:timers/promises';
import type {ReactElement} from 'react';
import {
    act,
    cleanup,
    render,
} from '@testing-library/react';

interface ActGlobal {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
}

/**
 * Render `ui` once, with React's act environment on, and let every `lazy` chunk
 * under it resolve — so the mounts that follow in the same spec file never
 * suspend.
 *
 * `Input` loads `CodeMirrorBox` with `lazy`, and a suspended resource that
 * finishes loading is a state change React checks against the act environment:
 * with the flag off and an act scope open it prints "not configured to support
 * act(...)" once per mount. Turning the flag on for the whole file is the
 * opposite mistake — every async dispatch after `await wait()` then reports an
 * update "not wrapped in act(...)" — so the flag is on for this one render only
 * and put back after. A `lazy` that has resolved stays resolved, which is the
 * whole reason one warm-up covers the file.
 */
export const warm = async (ui: ReactElement): Promise<void> => {
    const scope = globalThis as ActGlobal;
    const previous = scope.IS_REACT_ACT_ENVIRONMENT;
    
    scope.IS_REACT_ACT_ENVIRONMENT = true;
    
    render(ui);
    
    await act(async () => {
        await setTimeout(50);
    });
    
    cleanup();
    
    scope.IS_REACT_ACT_ENVIRONMENT = previous;
};
