import {test, stub} from 'supertape';
import {
    render,
    cleanup,
} from '@testing-library/react';
import Toolbar from './Toolbar.js';

const noop = () => {};

const mockCategory = {
    parsers: [],
    transformers: [],
};

const mockParser = {
    id: 'babel',
    displayName: 'Babel',
    showInMenu: true,
    hasSettings: () => false,
    version: '1.0',
    homepage: 'https://babel.dev',
};

const mockTransformer = {
    displayName: 'putout',
    version: '1.0',
    homepage: 'https://github.com/coderaiser/putout',
};

test('Toolbar: renders title', (t) => {
    render(
        <Toolbar
            parser={mockParser}
            category={mockCategory}
            showTransformer={false}
            onSave={noop}
            onFork={noop}
            onNew={noop}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
            onShareButtonClick={noop}
            onTransformChange={noop}
            onKeyMapChange={noop}
            keyMap="default"
        />,
    );
    
    const title = document.querySelector('#Toolbar h1');
    
    cleanup();
    
    t.ok(title);
    t.end();
});

test('Toolbar: renders help question-mark svg icon', (t) => {
    render(
        <Toolbar
            parser={mockParser}
            category={mockCategory}
            showTransformer={false}
            onSave={noop}
            onFork={noop}
            onNew={noop}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
            onShareButtonClick={noop}
            onTransformChange={noop}
            onKeyMapChange={noop}
            keyMap="default"
        />,
    );
    
    const svg = document.querySelector('#Toolbar a svg');
    
    cleanup();
    
    t.ok(svg, 'help icon svg rendered');
    t.end();
});

test('Toolbar: parser displayName with version and homepage renders link', (t) => {
    render(
        <Toolbar
            parser={mockParser}
            category={mockCategory}
            showTransformer={false}
            onSave={noop}
            onFork={noop}
            onNew={noop}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
            onShareButtonClick={noop}
            onTransformChange={noop}
            onKeyMapChange={noop}
            keyMap="default"
        />,
    );
    
    const info = document.querySelector('#info');
    
    cleanup();
    
    const result = info.textContent.includes('Babel-1.0');
    
    t.ok(result);
    t.end();
});

test('Toolbar: transformer info shown when showTransformer', (t) => {
    render(
        <Toolbar
            parser={mockParser}
            category={mockCategory}
            transformer={mockTransformer}
            showTransformer={true}
            onSave={noop}
            onFork={noop}
            onNew={noop}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
            onShareButtonClick={noop}
            onTransformChange={noop}
            onKeyMapChange={noop}
            keyMap="default"
        />,
    );
    
    const info = document.querySelector('#info');
    
    cleanup();
    
    const result = info.textContent.includes('Transformer') && info.textContent.includes('putout-1.0');
    
    t.ok(result);
    t.end();
});

test('Toolbar: default transformer used when transformer prop missing', (t) => {
    render(
        <Toolbar
            parser={mockParser}
            category={mockCategory}
            showTransformer={true}
            onSave={noop}
            onFork={noop}
            onNew={noop}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
            onShareButtonClick={noop}
            onTransformChange={noop}
            onKeyMapChange={noop}
            keyMap="default"
        />,
    );
    
    const info = document.querySelector('#info');
    
    cleanup();
    
    const result = info.textContent.includes('Transformer');
    
    t.ok(result);
    t.end();
});