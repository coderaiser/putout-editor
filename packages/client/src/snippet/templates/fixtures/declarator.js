import {montag} from 'montag';

export default montag`
    // declare-putout-imports
    // The plugin auto-inserts missing imports for putout/operator/types.
    
    const {code} = putout(source, {plugins: []});
`;
