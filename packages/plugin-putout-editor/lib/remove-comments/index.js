const KEYS = [
    'leadingComments',
    'trailingComments',
    'innerComments',
];

export const report = () => 'A rule says what the code already says';

export const fix = (path) => {
    for (const key of KEYS) {
        if (path.node[key])
            path.node[key] = [];
    }
};

export const include = () => [
    'Statement',
    'Expression',
    'ObjectProperty',
];

export const filter = (path) => {
    for (const key of KEYS)
        if (path.node[key] && path.node[key].length)
            return true;
    
    return false;
};
