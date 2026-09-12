import pkg from 'acorn/package.json' with {
    type: 'json',
};
import defaultParserInterface from './estree/defaultESTreeParserInterface.ts';

const ID = 'acorn';

const isNumber = (a: unknown): a is number => typeof a === 'number';

type AcornMod = any;
type AcornLooseMod = any;
type AcornJsxMod = any;

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
    
    loadParser(callback: (value: {acorn: AcornMod; acornLoose: AcornLooseMod; acornJsx: AcornJsxMod}) => void) {
        Promise
            .all([
                import('acorn'),
                import('acorn-loose'),
                import('acorn-jsx'),
            ])
            .then(([acornMod, acornLooseMod, acornJsxMod]) => {
                callback({
                    acorn: acornMod as any,
                    acornLoose: acornLooseMod as any,
                    acornJsx: acornJsxMod as any,
                });
            });
    },
    
    parse(parsers: {acorn: AcornMod; acornLoose: AcornLooseMod; acornJsx: AcornJsxMod}, code: string, options: Record<string, any> = {}) {
        let parser: ((code: string, options: Record<string, any>) => any) | undefined;
        
        if (options['plugins.jsx'] && !options.loose) {
            const cls = parsers.acorn.JSXParser;
            parser = cls.parse.bind(cls);
        } else {
            if (options.loose)
                parser = parsers.acornLoose.parse;
            else
                parser = parsers.acorn.parse;
        }
        
        return parser!(code, options);
    },
    
    nodeToRange(node: any) {
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
    
    renderSettings(parserSettings: any, onChange: (settings: any) => void) {
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
