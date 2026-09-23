import {montag} from 'montag';

export default montag`
    // remove-duplicate-keywords
    
    import {operator} from 'putout';
    
    const {__json, getProperties, setValues} = operator;
    
    export const report = () => \`Remove duplicate keywords 📦\`;
    
    export const fix = (path) => {
        const keywordsPath = path.get('value');
        const elements = keywordsPath.node.elements;
        const unique = [...new Set(elements.map((e) => e.value))];
        
        setValues(keywordsPath, unique);
    };
    
    export const traverse = ({push}) => ({
        [__json](path) {
            const {keywordsPath} = getProperties(path.get('arguments.0'), ['keywords']);
            
            if (!keywordsPath)
                return;
            
            const elements = keywordsPath.get('value').node.elements;
            const values = elements.map((e) => e.value);
            
            if (new Set(values).size !== values.length)
                push(keywordsPath);
        },
    });
`;
