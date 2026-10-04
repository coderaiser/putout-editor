import {z} from 'zod';
import {tryCatch} from 'try-catch';
import {compilePlugin} from '@putout/editor-commands/plugin';

export const name = 'validate';

/**
 * The keys the **loader** accepts on a plugin, beyond `report`.
 *
 * A plugin with `report` and none of these compiles cleanly and then throws the
 * moment a user runs it — `Looks like 'fix' is not a 'function' but 'undefined'` —
 * so a validator that stops at "it compiled" is green on exactly the plugin that
 * is about to fail. `validate`'s own description says to call it *before*
 * `find_places`, which makes the gap expensive: it costs the round trip and
 * teaches the caller that `ok` means more than it does.
 *
 * Read off the compiled module rather than the source string, so the list is
 * checked against what the loader will actually find and a plugin whose `report`
 * is a default export or a re-export is judged on its shape rather than on how it
 * was typed.
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
 * The first shape the plugin actually provides, or `undefined`.
 *
 * A `for..of` rather than `SHAPES.some(...)` with a callback: this repo's own
 * `hoist-arrow-callback` hoists a non-block arrow out of a method call, and the
 * hoisted copy would not see `plugin` — so the callback is not a style here, it
 * is a lint fight with a correctness consequence. The rule is happy with a
 * `for..of`, and so is this file's `for-of/map` rule.
 */
const foundShape = (plugin: Record<string, unknown>): string | undefined => {
    for (const shape of SHAPES) {
        if (isFunction(plugin[shape]))
            return shape;
    }
};

/**
 * `undefined` when the plugin has some shape the loader will accept, and a
 * sentence when it has none.
 *
 * A sentence rather than a bare `false` because the caller is a person or a model
 * writing a rule, and the useful half is *which* key to add. `find_places` is
 * named because that is the tool whose description tells a caller to validate
 * first, and `report` alone is what it is about.
 */
export const missingShape = (plugin: Record<string, unknown>): string => {
    if (foundShape(plugin))
        return '';
    
    return 'plugin_shape: this rule has no ' + SHAPES.join(', ') + '. ' +
        'find_places and transform need one of them, and `report` alone is not a ' +
        'rule — add e.g. `export const fix = () => {};` and call validate again.';
};

export const description =
    'Check a putout plugin string for syntax errors and for the shape the runner ' +
    'needs, without needing source code. ' +
    'Returns "ok" on success, `plugin_syntax (line N, col M): …` for a parse error, ' +
    'or `plugin_shape: …` for a plugin that compiles but would throw when run. ' +
    'Call this after writing or editing a plugin before calling find_places.';

export const schema = z.object({
    plugin: z
        .string()
        .describe('Putout plugin as an ESM string to validate'),
});

const answer = (text: string) => ({
    content: [{
        type: 'text' as const,
        text,
    }],
});

export function handler({plugin}: z.infer<typeof schema>) {
    const [error, compiled] = tryCatch(compilePlugin, plugin);
    
    if (error)
        return answer((error as Error).message);
    
    const shape = missingShape(compiled as Record<string, unknown>);
    
    if (shape)
        return answer(shape);
    
    return answer('ok');
}
