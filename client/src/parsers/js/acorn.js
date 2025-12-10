import React from 'react';
import pkg from 'acorn/package.json';
import defaultParserInterface from './utils/defaultESTreeParserInterface';

const ID = 'acorn';

const isNumber = (a) => typeof a === 'number';

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
        require(['acorn', 'acorn-loose', 'acorn-jsx'], (acorn, acornLoose, acornJsx) => {
            callback({
                acorn,
                acornLoose,
                acornJsx,
            });
        });
    },
    
    parse(parsers, code, options = {}) {
        let parser;
        
        if (options['plugins.jsx'] && !options.loose) {
            const cls = parsers.acorn.Parser.extend(parsers.acornJsx());
            parser = cls.parse.bind(cls);
        } else {
            parser = options.loose ? parsers.acornLoose.parse : parsers.acorn.parse;
        }
        
        return parser(code, options);
    },
    
    nodeToRange(node) {
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
                ['sourceType', [
                    'script',
                    'module',
                ]],
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
    
    renderSettings(parserSettings, onChange) {
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
