import {montag} from 'montag';

export default montag`
    // declare-putout-imports
    
    export const declare = () => ({
        putout: "import putout from 'putout'",
        operator: "import {operator} from 'putout'",
        types: "import {types} from 'putout'",
    });
`;
