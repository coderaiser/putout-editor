import {montag} from 'montag';

export default montag`
    // find-duplicate-values
    
    import {types} from 'putout';
    
    const {isIdentifier} = types;
    
    export const report = ({name}) => \`Duplicate numeric value in '\${name}' 🔍\`;
    
    export const find = (ast, {traverse, push}) => {
        const seen = new Map();
        
        traverse(ast, {
            VariableDeclarator(path) {
                const {id, init} = path.node;
                
                if (!isIdentifier(id) || !init || init.type !== 'NumericLiteral')
                    return;
                
                const {value} = init;
                
                if (seen.has(value)) {
                    push({
                        path,
                        name: id.name,
                    });
                    return;
                }
                
                seen.set(value, id.name);
            },
        });
    };
    
    export const fix = ({path}) => path.remove();
`;
