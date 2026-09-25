import {montag} from 'montag';

export default montag`
    // apply-shorthand-margin
    
    import {operator} from 'putout';
    
    const {__css} = operator;
    
    const margin = __css.replace(
        '__array',
        '[declaration("margin", valueList([dimension(__a, __b), dimension(__a, __b), dimension(__a, __b), dimension(__a, __b)]))]',
    );
    const shorthand = __css.replace(
        '__array',
        '[declaration("margin", dimension(__a, __b))]',
    );
    
    export const report = () => \`Use shorthand margin when all sides are equal 🎨\`;
    
    export const replace = () => ({
        [margin]: shorthand,
    });
`;
