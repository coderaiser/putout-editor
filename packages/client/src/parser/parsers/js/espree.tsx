import pkg from 'espree/package.json' with {
    type: 'json',
};
import defaultParserInterface from './estree/defaultESTreeParserInterface.ts';
import {type SettingsConfig, type Settings} from './estree/SettingsRenderer.tsx';
import type {AstNode} from '../../../types.ts';

const ID = 'espree';

const isNumber = (a: unknown): a is number => typeof a === 'number';

type EspreeMod = unknown;

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
    
    loadParser(callback: (value: EspreeMod) => void) {
        import('espree').then((mod: unknown) => callback(mod && (mod as Record<string, unknown>).default || mod));
    },
    
    parse(espree: EspreeMod, code: string, options: Record<string, unknown>) {
        return (espree as {
            parse: (code: string, options: Record<string, unknown>) => unknown;
        }).parse(code, options);
    },
    
    nodeToRange(node: AstNode) {
        if (isNumber(node.start))
            return [
                node.start,
                node.end,
            ];
    },
    
    getDefaultOptions() {
        return {
            range: true,
            loc: false,
            comment: false,
            attachComment: false,
            tokens: false,
            tolerant: false,
            ecmaVersion: 6,
            sourceType: 'module',
            
            ecmaFeatures: {
                jsx: true,
                globalReturn: true,
                experimentalObjectRestSpread: true,
            },
        };
    },
    
    _getSettingsConfiguration(): SettingsConfig {
        const defaultOptions = this.getDefaultOptions();
        
        return {
            fields: [
                ['ecmaVersion', [
                    3,
                    5,
                    6,
                    7,
                    8,
                    9,
                ], Number],
                [
                    'sourceType',
                    ['script', 'module'],
                ],
                'range',
                'loc',
                'comment',
                'attachComment',
                'tokens',
                'tolerant', {
                    key: 'ecmaFeatures',
                    title: 'ecmaFeatures',
                    fields: Object.keys(defaultOptions.ecmaFeatures),
                    settings: (settings) => 'ecmaFeatures' in settings && settings.ecmaFeatures || defaultOptions.ecmaFeatures,
                },
            ],
        };
    },
    
    renderSettings(parserSettings: Settings, onChange: (settings: Settings) => void) {
        return (
            <div>
                <p>
                    <a
                        href="https://github.com/eslint/espree#usage"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Option descriptions
                    </a>
                </p>
                {defaultParserInterface.renderSettings.call(this, parserSettings, onChange)}
            </div>
        );
    },
};
