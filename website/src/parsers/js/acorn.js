import React from 'react';
import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'acorn/package.json';

const ID = 'acorn';

export default {
    ...defaultParserInterface,
    
    id: ID,
    displayName: ID,
    version: `${pkg.version}`,
    homepage: pkg.homepage,
    locationProps: new Set(['range', 'loc', 'start', 'end']),
    
    loadParser(callback) {
        require(['acorn', 'acorn-loose', 'acorn-jsx', 'acorn-stage3'], (acorn, acornLoose, acornJsx, acornStage3) => {
            callback({
                acorn,
                acornLoose,
                acornJsx,
                acornStage3,
            });
        });
    },
    
    parse(parsers, code, options = {}) {
        let parser;
        
        const {acorn} = parsers;
        
        // that's right, hot fix
        acorn.version = '6.3.0';
        
        parsers.acorn.Parser.extend(parsers.acornStage3);
        
        if (options['plugins.jsx'] && !options.loose) {
            const cls = parsers.acorn.Parser.extend(parsers.acornJsx());
            parser = cls.parse.bind(cls);
        } else {
            parser = options.loose ?
                parsers.acornLoose.parse :
                parsers.acorn.parse;
        }
        
        return parser(code, options);
    },
    
    nodeToRange(node) {
        if (typeof node.start === 'number') {
            return [node.start, node.end];
        }
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
                ['ecmaVersion', [3, 5, 6, 7, 8, 9, 10], (x) => Number(x)],
                ['sourceType', ['script', 'module']],
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
                        target="_blank" rel="noopener noreferrer">
            Option descriptions
                    </a>
                </p>
                {defaultParserInterface.renderSettings.call(
                    this,
                    parserSettings,
                    onChange
                )}
            </div>
        );
    },
};
