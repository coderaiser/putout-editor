import {montag} from 'montag';

export default montag`
    // remove-trailing-spaces-from-heading
    
    import {operator} from 'putout';
    
    const {setLiteralValue} = operator;
    
    export const report = () => \`Remove trailing spaces from headings ✂️\`;
    
    export const fix = (path) => {
        const arg = path.get('arguments.1');
        
        setLiteralValue(arg, arg.node.value.trimEnd());
    };
    
    export const include = () => [
        'heading(__a, __b)',
    ];
    
    export const filter = (path) => {
        const arg = path.get('arguments.1');
        
        if (!arg.isStringLiteral())
            return false;
        
        return arg.node.value !== arg.node.value.trimEnd();
    };
`;
