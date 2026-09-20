import {montag} from 'montag';

export default montag`
    // check-typo-in-label

    import {operator} from 'putout';

    const {getTemplateValues} = operator;

    export const report = () => 'Fix label typo 🧹';

    export const match = () => ({
        'const __a = __b': (vars, {node}) => {
            const {loc} = node;

            if (!loc)
                return false;

            return true;
        },
    });

    export const find = (ast, {traverse}) => {
        const places = [];

        traverse(ast, {
            'const __a = __b'(path) {
                const {loc} = path.node;

                places.push({
                    message: 'Fix typo',
                    position: loc,
                });
            },
        });

        return places;
    };

    export const fix = (places, {writeFileContent}) => {
        for (const {position} of places) {
            writeFileContent(__filename, 'fixed');
        }
    };

    export const scan = (root, {push}) => {
        push('found');
    };
`;
