import {montag} from 'montag';

export default montag`
    // add-missing-putout

    import {operator} from 'putout';

    const {compare, setParenthesizes} = operator;

    export const report = () => 'Add missing argument in putout() call 🧹';

    export const match = () => ({
        'putout(__a)': ({__a}, path) => compare(__a, '__b') && !path.parentPath.isCallExpression(),
    });

    export const fix = ({__a}) => setParenthesizes(__a);
`;
