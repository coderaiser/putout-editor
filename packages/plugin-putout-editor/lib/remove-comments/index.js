import {traverse as babelTraverse} from 'putout';

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
    Program(path) {
        babelTraverse(path.node, {
            noScope: true,
            enter(node) {
                for (const key of KEYS) {
                    if (has(node.node, key))
                        push({
                            path: node,
                            key,
                        });
                }
            },
        });
    },
});
