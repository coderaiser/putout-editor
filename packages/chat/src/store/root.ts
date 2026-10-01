import {combineReducers} from '@reduxjs/toolkit';
import {
    reducer as chat,
    type ChatAppState,
} from './slice.ts';

/**
 * One slice, so this is a formality — and that is the point. It is the seam a
 * second slice would be added at, and the shape `useSelector(s => s.chat.x)`
 * already assumes, so the wrapper exists rather than being added later.
 */
export const rootReducer = combineReducers({
    chat,
});

export type RootState = {
    chat: ChatAppState;
};
