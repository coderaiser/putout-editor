const KEYS = [
    'leadingComments',
    'trailingComments',
    'innerComments',
];

const NODES = [
    'ClassDeclaration',
    'ExportNamedDeclaration',
    'ExpressionStatement',
    'FunctionDeclaration',
    'ObjectProperty',
    'ReturnStatement',
    'VariableDeclaration',
];

const has = (node, key) => Boolean(node[key] && node[key].length);

export const report = () => 'A rule says what the code already says';

export const fix = ({path, key}) => {
    path.node[key] = [];
};

export const traverse = ({push}) => Object.fromEntries(NODES.map((node) => [
    node,
    (path) => {
        for (const key of KEYS) {
            if (has(path.node, key))
                push({
                    path,
                    key,
                });
        }
    },
]));
