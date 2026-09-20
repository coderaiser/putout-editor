import {montag} from 'montag';

export default montag`
    // putout-plugin-apply-optional-needs

    export const report = () => 'Apply optional needs 🧹';

    export const match = () => ({
        'putout(__a, __b)': ({__a}) => {
            const {__putout_processor_apply_needs} = __a.body || {};

            if (__putout_processor_apply_needs)
                return false;

            return true;
        },
    });

    export const replace = () => ({
        'putout(__a, __b)': 'putout(__a, {needs: true})',
    });
`;
