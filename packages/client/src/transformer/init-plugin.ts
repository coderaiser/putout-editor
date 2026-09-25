import path from 'node:path';
import {compileRule} from 'redput/compile-rule';
import {putout, type PutoutPlugin} from 'putout';

const {assign} = Object;
const noop = () => {};

export const initPlugin = (transformCode: string) => {
    const plugin = compileRule(transformCode, {
        require: (name: string) => {
            if (name === 'path' || name === 'node:path')
                return path;
            
            return assign(putout, {
                putout,
            });
        },
    });
    
    plugin.report = plugin.report || noop;
    
    return plugin as PutoutPlugin;
};
