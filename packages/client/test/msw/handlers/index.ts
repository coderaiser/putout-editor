import {gistHandlers} from './gist.ts';
import {parseHandlers} from './parse.ts';

export const handlers = [...gistHandlers, ...parseHandlers];
