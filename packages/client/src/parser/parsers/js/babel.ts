import pkg from '@babel/parser/package.json' with {
    type: 'json',
};
import plugins from '@putout/engine-parser/babel/plugins';
import * as options from '@putout/engine-parser/babel/options';
import defaultParserInterface from './estree/defaultESTreeParserInterface.ts';
import type {AstNode} from '../../../types.ts';

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

export const defaultOptions: Record<string, unknown> = {
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
            settings: (settings: Record<string, unknown>) => settings.plugins || defaultOptions.plugins,
            values: (plugins: string[]) => availablePlugins.reduce((obj: Record<string, boolean>, name: string) => {
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
    
    loadParser(callback: (value: unknown) => void) {
        import('@babel/parser').then((mod: unknown) => callback(mod && (mod as Record<string, unknown>).default || mod));
    },
    
    parse(babylon: unknown, code: string, options: Record<string, unknown>) {
        const opts: Record<string, unknown> = {
            ...options,
        };
        
        opts.plugins = (opts.plugins as unknown[])
            .map((plugin: unknown) => {
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
                
                if (isString(plugin) && plugin.startsWith('recordAndTuple'))
                    return 'recordAndTuple';
                
                return plugin;
            })
            .filter((name: unknown) => name !== 'recordAndTuple');
        
        return (babylon as {
            parse: (code: string, options: Record<string, unknown>) => unknown;
        }).parse(code, opts);
    },
    
    getNodeName(node: AstNode) {
        if (isString(node.type))
            return node.type;
        
        if (typeof node.type === 'object' && node.type != null)
            return `Token (${String((node.type as {
                label?: unknown;
            }).label)})`;
    },
    
    nodeToRange(node: {start?: unknown; end?: unknown}) {
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
