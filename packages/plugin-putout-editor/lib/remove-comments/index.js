const KEYS = [
    'leadingComments',
    'trailingComments',
    'innerComments',
];
const has = (node, key) => Boolean(node[key] && node[key].length);

export const report = () => 'A rule says what the code already says';

export const fix = ({path, key}) => {
    path.node[key] = [];
};

export const traverse = ({push}) => ({
    VariableDeclaration: (path) => {
        for (const key of KEYS) {
            if (has(path.node, key))
                push({
                    path,
                    key,
                });
        }
    },
});
