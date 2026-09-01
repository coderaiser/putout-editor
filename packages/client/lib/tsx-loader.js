import {transformSync} from 'oxc-transform';

export function resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('.tsx'))
        return {
            url: new URL(specifier, context.parentURL).href,
            shortCircuit: true,
        };
    
    return nextResolve(specifier, context);
}

export function load(url, context, nextLoad) {
    if (url.endsWith('.tsx')) {
        const {source} = nextLoad(url, {
            format: 'module',
        });
        
        const {code, errors} = transformSync(url, String(source), {
            lang: 'tsx',
            sourcemap: true,
        });
        
        if (errors.length)
            throw Error(errors[0].message);
        
        return {
            format: 'module',
            source: code,
            shortCircuit: true,
        };
    }
    
    return nextLoad(url, context);
}
