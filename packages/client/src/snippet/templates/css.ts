import {montag} from 'montag';

export default montag`
    // convert-rgb-to-var
    
    import {operator} from 'putout';
    
    const {__css, remove} = operator;
    
    export const report = () => \`Use 'var' instead of 'rgb'\`;
    
    export const replace = ({push}) => ({
        'functionValue("rgb", __a)': 'functionValue("var", ["--shadow-color"])',
    });
`;
