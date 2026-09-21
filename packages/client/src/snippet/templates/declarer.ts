import {montag} from 'montag';

export default montag`
    // putout-plugin-apply-optional-deps
    
    export const report = () => 'Apply optional deps 🧹';
    
    export const match = () => ({
        'putout(__a, {__b})': ({__b}) => {
            const {__putout_processor_apply_deps} = __b;
            
            if (__putout_processor_apply_deps)
                return false;
            
            return true;
        },
    });
    
    export const replace = () => ({
        'putout(__a, {__b})': 'putout(__a, {deps: true})',
    });
`;
