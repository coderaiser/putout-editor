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
 * Render `ui` once with the React act environment on, so each `lazy` chunk
 * resolves and later mounts do not suspend. The flag is on for this render
 * only: on for the file, each later dispatch reports "not wrapped in act".
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
