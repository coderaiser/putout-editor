const KEYS = [
    'leadingComments',
    'trailingComments',
    'innerComments',
];

export const report = () => 'A rule says what the code already says';

export const fix = ({path, key}) => {
    path.node[key] = [];
};

export const traverse = ({push}) => ({
    VariableDeclaration: (path) => {
        for (const key of KEYS) {
            const comments = path.node[key] || [];
            
            comments.map(() => push({
                path,
                key,
            }));
        }
    },
});
