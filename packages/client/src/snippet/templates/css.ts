import {montag} from 'montag';

export default montag`
    // remove-vendor-prefix
    
    import {operator} from 'putout';
    
    const {__css, remove} = operator;
    
    export const report = () => \`Remove outdated vendor prefix 🎨\`;
    
    export const fix = (path) => {
        remove(path);
    };
    
    export const traverse = ({push}) => ({
        [__css](path) {
            for (const decl of path.get('arguments.0.elements')) {
                const name = decl.get('arguments.0');
                
                if (name.isStringLiteral() && name.node.value.startsWith('-webkit-'))
                    push(decl);
            }
        },
    });
`;
