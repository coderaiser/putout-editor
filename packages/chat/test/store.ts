import type {Store} from '@reduxjs/toolkit';
import {createAppStore} from '../src/store/createStore.ts';

export type MakeStore = () => Store;

/**
 * The one store factory, for the same reason `index.tsx` goes through
 * `createAppStore`: a spec that built its own would be testing a store the page
 * never runs. Every chat spec gets its store here.
 */
export const makeStore: MakeStore = () => createAppStore();
