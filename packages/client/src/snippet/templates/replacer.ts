import {montag} from 'montag';

export default montag`
    // convert-ternary-to-if
    
    export const report = () => \`Use 'if' instead of ternary 🧹\`;
    
    export const replace = () => ({
        '__a ? __b : __c': 'if (__a) __b; else __c;',
    });
`;
