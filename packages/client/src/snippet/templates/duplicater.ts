import {montag} from 'montag';

export default montag`
    // count-switch-case

    export const report = ({count}) => \`Avoid too many '__a' cases ('\${count}') 🧹\`;

    export const match = () => ({
        'switch (__a) {__b}': ({__b}, path) => {
            const count = path.node.cases.length;

            if (count > 3)
                return {path, count};

            return false;
        },
    });
`;
