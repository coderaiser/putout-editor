import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'babylon7/babylon-package';
import plugins from '@putout/engine-parser/babel/plugins';
import options from '@putout/engine-parser/babel/options';

const isUndefined = (a) => typeof a === 'undefined';
const {keys} = Object;

const availablePlugins = [
    // From https://babeljs.io/docs/en/next/babel-parser.html
    // Miscellaneous
    'estree',
    // Language extensions
    'flow',
    'flowComments',
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
    'optionalChaining',
    'pipelineOperator',
    'throwExpressions',
    'recordAndTuple',
    'importAttributes',
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
};

export const parserSettingsConfiguration = {
    fields: [
        ['sourceType', [
            'module',
            'script',
        ]],
        ...keys(options),
        'ranges',
        'tokens', {
            key: 'plugins',
            title: 'Plugins',
            fields: availablePlugins,
            settings: (settings) => settings.plugins || defaultOptions.plugins,
            values: (plugins) => availablePlugins.reduce((obj, name) => {
                obj[name] = plugins.includes(name);
                return obj;
            }, {}),
        }],
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
        require(['@babel/parser'], callback);
    },
    
    parse(babylon, code, options) {
        options = {
            ...options,
        };
        
        // TODO: Make decoratorsBeforeExport settable through settings somhow
        // TODO: Make pipelineOperator.proposal settable through settings somhow
        options.plugins = options.plugins.map((plugin) => {
            switch(plugin) {
            case 'decorators':
                return ['decorators', {
                    decoratorsBeforeExport: false,
                }];
            
            case 'pipelineOperator':
                return ['pipelineOperator', {
                    proposal: 'minimal',
                }];
            
            case 'recordAndTuple':
                return ['recordAndTuple', {
                    syntaxType: 'hash',
                }];
            
            case 'importAttributes':
                return ['importAttributes', {
                    deprecatedAssertSyntax: true,
                }];
            
            case 'optionalChainingAssign':
                return ['optionalChainingAssign', {
                    version: '2023-07',
                }];
            
            default:
                return plugin;
            }
        });
        
        return babylon.parse(code, options);
    },
    
    getNodeName(node) {
        switch(typeof node.type) {
        case 'string':
            return node.type;
        
        case 'object':
            return `Token (${node.type.label})`;
        }
    },
    
    nodeToRange(node) {
        if (!isUndefined(node.start)) {
            return [
                node.start,
                node.end,
            ];
        }
    },
    
    getDefaultOptions() {
        return defaultOptions;
    },
    
    _getSettingsConfiguration() {
        return parserSettingsConfiguration;
    },
};
