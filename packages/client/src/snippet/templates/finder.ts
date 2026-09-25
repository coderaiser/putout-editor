import {montag} from 'montag';

export default montag`
    // check-typo-in-label
    
    export const report = () => 'Fix label typo 🧹';
    
    export const find = (ast, {traverse, push}) => {
        traverse(ast, {
            'const __a = __b'(path) {
                push(path);
            },
        });
    };
    
    export const fix = (path) => {
        path.remove();
    };
`;
