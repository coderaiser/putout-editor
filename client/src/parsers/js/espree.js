import React from 'react';
import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'espree/package.json';

const ID = 'espree';

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
        require(['espree'], callback);
    },
    
    parse(espree, code, options) {
        return espree.parse(code, options);
    },
    
    nodeToRange(node) {
        if (isNumber(node.start)) {
            return [
                node.start,
                node.end,
            ];
        }
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
    
    _getSettingsConfiguration() {
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
                ['sourceType', [
                    'script',
                    'module',
                ]],
                'range',
                'loc',
                'comment',
                'attachComment',
                'tokens',
                'tolerant', {
                    key: 'ecmaFeatures',
                    title: 'ecmaFeatures',
                    fields: Object.keys(defaultOptions.ecmaFeatures),
                    settings: (settings) => settings.ecmaFeatures || defaultOptions.ecmaFeatures,
                }],
        };
    },
    
    renderSettings(parserSettings, onChange) {
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
