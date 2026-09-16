import pkg from 'acorn/package.json' with {
    type: 'json',
};
import defaultParserInterface from './estree/defaultESTreeParserInterface.ts';
import {type SettingsObject} from './estree/SettingsRenderer.tsx';
import type {AstNode} from '../../../types.ts';

const ID = 'acorn';

const isNumber = (a: unknown): a is number => typeof a === 'number';

type AcornMod = unknown;
type AcornLooseMod = unknown;
type AcornJsxMod = unknown;
type AcornParser = (code: string, options: Record<string, unknown>) => unknown;

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
    
    loadParser(callback: (value: {
        acorn: AcornMod;
        acornLoose: AcornLooseMod;
        acornJsx: AcornJsxMod;
    }) => void) {
        Promise
            .all([
                import('acorn'),
                import('acorn-loose'),
                import('acorn-jsx'),
            ])
            .then(([acornMod, acornLooseMod, acornJsxMod]) => {
                callback({
                    acorn: acornMod,
                    acornLoose: acornLooseMod,
                    acornJsx: acornJsxMod,
                });
            });
    },
    
    parse(parsers: {
        acorn: AcornMod;
        acornLoose: AcornLooseMod;
        acornJsx: AcornJsxMod;
    }, code: string, options: Record<string, unknown> = {}) {
        let parser: AcornParser | undefined;
        
        if (options['plugins.jsx'] && !options.loose) {
            const {JSXParser} = parsers.acorn as {
                JSXParser: {
                    parse: AcornParser;
                };
            };
            parser = JSXParser.parse.bind(JSXParser);
        } else {
            if (options.loose)
                parser = (parsers.acornLoose as {
                    parse: AcornParser;
                }).parse;
            else
                parser = (parsers.acorn as {
                    parse: AcornParser;
                }).parse;
        }
        
        return parser!(code, options);
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
            'ecmaVersion': 10,
            'sourceType': 'module',
            'allowReserved': false,
            'allowReturnOutsideFunction': true,
            'allowImportExportEverywhere': true,
            'allowAwaitOutsideFunction': true,
            'allowHashBang': false,
            'locations': false,
            'loose': false,
            'ranges': false,
            'preserveParens': false,
            'plugins.jsx': true,
        };
    },
    
    _getSettingsConfiguration() {
        return {
            fields: [
                ['ecmaVersion', [
                    3,
                    5,
                    6,
                    7,
                    8,
                    9,
                    10,
                ], Number],
                [
                    'sourceType',
                    ['script', 'module'],
                ],
                'allowReserved',
                'allowReturnOutsideFunction',
                'allowImportExportEverywhere',
                'allowHashBang',
                'locations',
                'loose',
                'ranges',
                'preserveParens',
                'plugins.jsx',
            ],
        };
    },
    
    renderSettings(parserSettings: SettingsObject, onChange: (settings: SettingsObject) => void) {
        return (
            <div>
                <p>
                    <a
                        href="https://github.com/marijnh/acorn/blob/master/src/options.js"
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
