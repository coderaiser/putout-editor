import {montag} from 'montag';

export default montag`
    // merge-duplicate-imports
    
    import {operator, types} from 'putout';
    
    const {remove} = operator;
    const {isImportDeclaration} = types;
    
    export const report = ({path}) =>
        \`Merge duplicate import from '\${path.node.source.value}' 🧹\`;
    
    export const fix = ({path, original}) => {
        original.node.specifiers.push(...path.node.specifiers);
        remove(path);
    };
    
    export const traverse = ({push}) => ({
        Program(path) {
            const imports = path.get('body').filter(isImportDeclaration);
            const seen = new Map();
            
            for (const imp of imports) {
                const src = imp.node.source.value;
                
                if (!seen.has(src)) {
                    seen.set(src, imp);
                    continue;
                }
                
                push({path: imp, original: seen.get(src)});
            }
        },
    });
`;
