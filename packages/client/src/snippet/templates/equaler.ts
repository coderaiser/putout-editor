import {montag} from 'montag';

export default montag`
    // check-margin

    export const report = () => \`Fix margin '__a' 🧹\`;

    export const match = () => ({
        'margin: __a': ({__a}) => __a.value === '4px' ? __a : false,
    });

    export const replace = () => ({
        'margin: __a': 'padding: __a',
    });
`;
