import {montag} from 'montag';

export default montag`
    export const report = () => \`Use 'if' instead of ternary 🧹\`;
    
    export const replace = () => ({
        '__a ? __b : __c': 'if (__a) __b; else __c;',
    });
`;
