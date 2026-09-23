import {montag} from 'montag';

export default montag`
    // apply-shorthand-margin
    
    import {operator} from 'putout';
    
    const {__css} = operator;
    
    export const report = () => \`Use shorthand margin when all sides are equal 🎨\`;
    
    export const replace = () => ({
        [__css]: \`declaration("margin", valueList([
            dimension(__a, __b),
            dimension(__a, __b),
            dimension(__a, __b),
            dimension(__a, __b),
        ]))\`,
    });
`;
