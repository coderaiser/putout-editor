import {montag} from 'montag';

export default montag`
    // no-duplicate-keywords
    
    export const exclude = () => ['x'];
    
    export const report = () => 'Avoid duplicate keywords 🧹';
    
    export const replace = () => ({
        'const __a = __b': 'const __a = __b',
    });
`;
