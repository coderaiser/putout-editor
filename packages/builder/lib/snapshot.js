const isRegExp = (a) => a instanceof RegExp;
const isFn = (a) => typeof a === 'function';
const isPlain = ({constructor}) => !constructor || constructor === Object;

const walkItem = (ancestors) => (item) => walk(item, ancestors);
const walkEntry = (ancestors) => ([key, item]) => [key, walk(item, ancestors)];
const byText = (a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b));

function walk(value, ancestors) {
    if (isFn(value) || isRegExp(value))
        return String(value);
    
    if (!value || typeof value !== 'object')
        return value;
    
    if (ancestors.includes(value))
        return '<cycle>';
    
    const next = [...ancestors, value];
    
    if (Array.isArray(value))
        return value.map(walkItem(next));
    
    const entries = Object
        .entries(value)
        .map(walkEntry(next));
    
    if (isPlain(value))
        return Object.fromEntries(entries);
    
    return Object.fromEntries([
        ['$class', value.constructor.name],
        ...entries,
    ]);
}

/**
 * A rspack config holds regular expressions, functions, and plugin objects.
 * `createSnapshot` turns it into plain JSON, so that a spec can compare two configs.
 * It masks the parts that change without a reason: the root path, the folder of the installed
 * packages (hoisting moves it), the version, the cache breaker.
 * The order of `plugins` does not matter to rspack here, so the snapshot sorts them.
 */
export const createSnapshot = (config, {root, version, cacheBreaker}) => {
    const plain = walk(config, []);
    
    if (plain.plugins)
        plain.plugins.sort(byText);
    
    const text = JSON
        .stringify(plain)
        .replaceAll(root, '<root>')
        .replaceAll(/<root>(\/packages\/[^/]+)?\/node_modules\//g, '<modules>/')
        .replaceAll(`"${version}"`, '"<version>"')
        .replaceAll(`-${cacheBreaker}.`, '-<cache>.');
    
    return JSON.parse(text);
};
