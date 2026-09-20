import {montag} from 'montag';

export default montag`
    // no-nested-ternary

    export const report = () => \`Avoid nested ternary '__a' 🧹\`;

    export const match = () => ({
        '__a ? __b : __c': ({__a, __b, __c}, path) => {
            if (__a.type === 'ConditionalExpression')
                return path;

            if (__b.type === 'ConditionalExpression')
                return path;

            if (__c.type === 'ConditionalExpression')
                return path;

            return false;
        },
    });
`;
