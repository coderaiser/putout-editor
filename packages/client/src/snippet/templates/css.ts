import {montag} from 'montag';

export default montag`
    // use-custom-property-for-color
    
    export const report = () => \`Use a custom property instead of a literal color 🎨\`;
    
    export const replace = () => ({
        'functionValue("rgb", __a)': 'functionValue("var", ["--shadow-color"])',
    });
`;
