import {z} from 'zod';
import {tryCatch} from 'try-catch';
import {compilePlugin} from '@putout/editor-commands/plugin';

export const name = 'validate';

/**
 * The keys the loader accepts beside `report`. Without one, the plugin
 * compiles and then throws on run. Read from the compiled module, so a
 * default export or a re-export also counts.
 */
const SHAPES = [
    'fix',
    'find',
    'traverse',
    'replace',
    'include',
    'exclude',
    'rules',
    'declare',
    'scan',
];

const isFunction = (value: unknown): boolean => typeof value === 'function';

/**
 * The first shape the plugin has, or `undefined`. A `for..of`, not
 * `SHAPES.some(cb)`: `hoist-arrow-callback` would move the callback out of
 * the scope of `plugin`.
 */
const foundShape = (plugin: Record<string, unknown>): string | undefined => {
    for (const shape of SHAPES) {
        if (isFunction(plugin[shape]))
            return shape;
    }
};

/**
 * An empty string when the plugin has a shape the loader accepts, else a
 * sentence that names the key to add.
 */
export const missingShape = (plugin: Record<string, unknown>): string => {
    if (foundShape(plugin))
        return '';
    
    return 'plugin_shape: this rule has no ' + SHAPES.join(', ') + '. ' +
    'find_places and transform need one of them, and `report` alone is not a ' + 'rule — add e.g. `export const fix = () => {};` and call validate again.';
};

export const description = 'Check a plugin: "ok", "plugin_syntax (line N, col N): ..." or "plugin_shape: ..." (no runnable export). Run it before find_places.';

export const schema = z.object({
    plugin: z
        .string()
        .describe('Plugin source (ESM)'),
});

type Answer = {
    content: {
        type: 'text';
        text: string;
    }[];
    isError?: true;
};

const answer = (text: string): Answer => ({
    content: [{
        type: 'text' as const,
        text,
    }],
});

/** Not `ok`: the text stays as it is, and `isError` tells the client it failed. */
const failure = (text: string): Answer => ({
    ...answer(text),
    isError: true,
});

export function handler({plugin}: z.infer<typeof schema>): Answer {
    const [error, compiled] = tryCatch(compilePlugin, plugin);
    
    if (error)
        return failure((error as Error).message);
    
    const shape = missingShape(compiled as Record<string, unknown>);
    
    if (shape)
        return failure(shape);
    
    return answer('ok');
}
