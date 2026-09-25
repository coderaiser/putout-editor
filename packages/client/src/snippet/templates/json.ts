import {montag} from 'montag';

export default montag`
    // remove-duplicate-keywords
    
    import {operator} from 'putout';
    
    const {__json, getProperties, remove} = operator;
    
    export const report = () => \`Remove duplicate keywords 📦\`;
    
    export const fix = (path) => {
        remove(path);
    };
    
    export const traverse = ({push}) => ({
        [__json](path) {
            const {keywordsPath} = getProperties(path.get('arguments.0'), ['keywords']);
            
            if (!keywordsPath)
                return;
            
            const elements = keywordsPath.get('value').get('elements');
            const seen = new Set();
            
            for (const element of elements) {
                const {value} = element.node;
                
                if (seen.has(value)) {
                    push(element);
                    continue;
                }
                
                seen.add(value);
            }
        },
    });
`;
