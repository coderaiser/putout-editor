import pkg from '@babel/parser/package.json' with {
    type: 'json',
};
import plugins from '@putout/engine-parser/babel/plugins';
import * as options from '@putout/engine-parser/babel/options';
import defaultParserInterface from './estree/defaultESTreeParserInterface.js';

const isString = (a) => typeof a === 'string';

const isUndefined = (a) => typeof a === 'undefined';
const {keys} = Object;

const availablePlugins = [
    // From https://babeljs.io/docs/en/next/babel-parser.html
    // Miscellaneous
    'estree',
    // Language extensions
    'jsx',
    'typescript',
    // ECMAScript Proposals
    'asyncGenerators',
    'bigInt',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'decorators-legacy',
    'decoratorAutoAccessors',
    'doExpressions',
    'destructuringPrivate',
    'discardBinding',
    'dynamicImport',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'explicitResourceManagement',
    'functionBind',
    'functionSent',
    'importMeta',
    'logicalAssignment',
    'nullishCoalescingOperator',
    'numericSeparator',
    'objectRestSpread',
    'optionalCatchBinding',
    'pipelineOperator',
    'throwExpressions',
    'sourcePhaseImports',
    'deferredImportEvaluation',
    'optionalChainingAssign',
];

const ID = 'babel';

export const defaultOptions = {
    ...options,
    sourceType: 'module',
    ranges: false,
    tokens: false,
    plugins,
    errorRecovery: false,
};

export const parserSettingsConfiguration = {
    fields: [
        [
            'sourceType',
            ['module', 'script'],
        ],
        ...keys(options),
        'ranges',
        'errorRecovery',
        'tokens', {
            key: 'plugins',
            title: 'Plugins',
            fields: availablePlugins,
            settings: (settings) => settings.plugins || defaultOptions.plugins,
            values: (plugins) => availablePlugins.reduce((obj, name) => {
                obj[name] = plugins.includes(name);
                return obj;
            }, {}),
        },
    ],
};

export default {
    ...defaultParserInterface,
    id: ID,
    displayName: ID,
    version: pkg.version,
    homepage: pkg.homepage,
    locationProps: new Set([
        'range',
        'loc',
        'start',
        'end',
    ]),
    
    loadParser(callback) {
        import('@babel/parser').then((mod) => callback(mod.default || mod));
    },
    
    parse(babylon, code, options) {
        options = {
            ...options,
        };
        
        options.plugins = options.plugins
            .map((plugin) => {
                switch(plugin) {
                case 'decorators':
                    return ['decorators', {
                        decoratorsBeforeExport: false,
                    }];
                
                case 'discardBinding':
                    return ['discardBinding', {
                        syntaxType: 'void',
                    }];
                
                case 'pipelineOperator':
                    return ['pipelineOperator', {
                        proposal: 'minimal',
                    }];
                
                case 'optionalChainingAssign':
                    return ['optionalChainingAssign', {
                        version: '2023-07',
                    }];
                
                default:
                    if (plugin[0] === 'recordAndTuple')
                        return 'recordAndTuple';
                    
                    return plugin;
                }
            })
            .filter((name) => name !== 'recordAndTuple');
        
        return babylon.parse(code, options);
    },
    
    getNodeName(node) {
        if (isString(node.type))
            return node.type;
        
        if (typeof node.type === 'object')
            return `Token (${node.type.label})`;
    },
    
    nodeToRange(node) {
        if (!isUndefined(node.start))
            return [
                node.start,
                node.end,
            ];
    },
    
    getDefaultOptions() {
        return defaultOptions;
    },
    
    _getSettingsConfiguration() {
        return parserSettingsConfiguration;
    },
};
