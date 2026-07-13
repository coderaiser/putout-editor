const localRequire = require.context('./', true, /^\.\/(?!utils|transpilers)[^/]+\/(transformers\/([^/]+)\/)?(codeExample\.txt|[^/]+?\.js)$/);

const cutFirstSlash = (name) => name
    .split('/')
    .slice(1);

const files = localRequire
    .keys()
    .map(cutFirstSlash);

const categoryByID = {};
const parserByID = {};
const transformerByID = {};

const restrictedParserNames = new Set([
    'index.js',
    'codeExample.txt',
    'transformers',
    'utils',
]);

export const categories = files
    .filter((name) => name[1] === 'index.js')
    .map(([catName]) => {
        const category = localRequire(`./${catName}/index.js`);
        
        categoryByID[category.id] = category;
        
        category.codeExample = localRequire(`./${catName}/codeExample.txt`).default;
        
        const catFiles = files
            .filter(([curCatName]) => curCatName === catName)
            .map((name) => name.slice(1));
        
        category.parsers = catFiles
            .filter(([parserName]) => !restrictedParserNames.has(parserName))
            .map(([parserName]) => {
                let parser = localRequire(`./${catName}/${parserName}`);
                
                if (parser.__esModule)
                    parser = parser.default;
                
                parserByID[parser.id] = parser;
                parser.category = category;
                
                return parser;
            });
        
        category.transformers = catFiles
            .filter(([dirName, , fileName]) => dirName === 'transformers' && fileName === 'index.js')
            .map(([, transformerName]) => {
                const transformerDir = `./${catName}/transformers/${transformerName}`;
                let transformer = localRequire(`${transformerDir}/index.js`);
                
                if (transformer.__esModule)
                    transformer = transformer.default;
                
                transformerByID[transformer.id] = transformer;
                transformer.defaultTransform = localRequire(`${transformerDir}/codeExample.txt`).default;
                
                return transformer;
            });
        
        return category;
    });

export function getDefaultCategory() {
    return categoryByID.javascript;
}

export function getDefaultParser(category = getDefaultCategory()) {
    return category.parsers.filter((p) => p.showInMenu)[0];
}

export const getCategoryByID = (id) => categoryByID[id];

export const getParserByID = (id) => parserByID[id];

export const getTransformerByID = (id) => transformerByID[id];
