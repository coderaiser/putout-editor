import {montag} from 'montag';

export default montag`
    // fix-lock-extension
    
    import {operator, types} from 'putout';
    
    const {__ignore, setLiteralValue} = operator;
    const {isStringLiteral} = types;
    
    export const report = () => \`Use '*.lock' instead of '*.loc' 🔒\`;
    
    export const fix = (path) => {
        setLiteralValue(path, '*.lock');
    };
    
    export const traverse = ({push}) => ({
        [__ignore]: (path) => {
            for (const el of path.get('arguments.0.elements')) {
                if (isStringLiteral(el.node, {
                    value: '*.loc',
                }))
                    push(el);
            }
        },
    });
`;
