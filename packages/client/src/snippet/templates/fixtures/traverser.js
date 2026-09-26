import {montag} from 'montag';

export default montag`
    // merge-duplicate-imports
    // The plugin merges two imports from the same source into one.
    
    import {a} from 'x';
    import {b} from 'x';
`;
