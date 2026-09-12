import pkg from '@babel/parser/package.json' with {
    type: 'json',
};
import plugins from '@putout/engine-parser/babel/plugins';
import * as options from '@putout/engine-parser/babel/options';
import defaultParserInterface from './estree/defaultESTreeParserInterface.ts';

const isString = (a: unknown): a is string => typeof a === 'string';
const isNumber = (a: unknown): a is number => typeof a === 'number';
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

export const defaultOptions: Record<string, any> = {
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
            settings: (settings: any) => settings.plugins || defaultOptions.plugins,
            values: (plugins: any) => availablePlugins.reduce((obj: Record<string, boolean>, name: string) => {
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
    
    loadParser(callback: (value: any) => void) {
        import('@babel/parser').then((mod: any) => callback(mod.default || mod));
    },
    
    parse(babylon: any, code: string, options: any) {
        options = {
            ...options,
        };
        
        options.plugins = options.plugins
            .map((plugin: any) => {
                if (plugin === 'decorators')
                    return ['decorators', {
                        decoratorsBeforeExport: false,
                    }];
                
                if (plugin === 'discardBinding')
                    return ['discardBinding', {
                        syntaxType: 'void',
                    }];
                
                if (plugin === 'pipelineOperator')
                    return ['pipelineOperator', {
                        proposal: 'minimal',
                    }];
                
                if (plugin === 'optionalChainingAssign')
                    return ['optionalChainingAssign', {
                        version: '2023-07',
                    }];
                
                if (plugin[0] === 'recordAndTuple')
                    return 'recordAndTuple';
                
                return plugin;
            })
            .filter((name: any) => name !== 'recordAndTuple');
        
        return babylon.parse(code, options);
    },
    
    getNodeName(node: any) {
        if (isString(node.type))
            return node.type;
        
        if (typeof node.type === 'object')
            return `Token (${node.type.label})`;
    },
    
    nodeToRange(node: any) {
        if (isNumber(node.start) && isNumber(node.end))
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
