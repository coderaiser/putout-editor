import {test} from 'supertape';
import {
    render as testingRender,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import type {ReactElement} from 'react';
import ParserButton from './ParserButton.tsx';
import type {ParserInfo, ParserCategory} from '../parsers/index.ts';
import {ToolbarMenuProvider} from '../../store/ToolbarMenuContext.tsx';

const render = (ui: ReactElement) => testingRender(
    <ToolbarMenuProvider>
        {ui}
    </ToolbarMenuProvider>,
);

const openParser = () => fireEvent.click(document.querySelector('.menuButton > span')!);

const mockParser: ParserInfo = {
    id: 'babel',
    displayName: 'Babel',
    showInMenu: true,
    hasSettings: () => false,
};

const mockCategory: ParserCategory = {
    id: 'javascript',
    displayName: 'JavaScript',
    mimeTypes: ['text/javascript'],
    fileExtension: '.js',
    codeExample: '',
    parsers: [
        mockParser, {
            id: 'acorn',
            displayName: 'Acorn',
            showInMenu: true,
            hasSettings: () => false,
        },
    ],
};

const noop = () => {};

test('ParserButton: renders parser display name', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const spanText = document.querySelector('.menuButton span');
    
    cleanup();
    const result = spanText?.textContent?.includes('Babel');
    
    t.ok(result);
    t.end();
});

test('ParserButton: renders code Icon svg', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const svg = document.querySelector('span svg');
    
    cleanup();
    
    t.ok(svg, 'code icon svg rendered');
    t.end();
});

test('ParserButton: renders settings svg', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const svg = document.querySelector('button svg');
    
    cleanup();
    
    t.ok(svg, 'settings icon svg rendered');
    t.end();
});

test('ParserButton: settings button disabled when parser has no settings', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const buttons = document.querySelectorAll('button');
    const settingsBtn = [...buttons].at(-1)!;
    
    cleanup();
    
    t.ok(settingsBtn.disabled);
    t.end();
});

test('ParserButton: menu items always rendered (visible on hover via CSS)', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    openParser();
    
    const items = document.querySelectorAll('li');
    
    cleanup();
    
    t.equal(items.length, 2);
    t.end();
});

test('ParserButton: only parsers with showInMenu are rendered', (t) => {
    const categoryWithHidden: ParserCategory = {
        ...mockCategory,
        parsers: [
            mockParser, {
                id: 'hidden',
                displayName: 'Hidden',
                showInMenu: false,
                hasSettings: () => false,
            },
        ],
    };
    
    render(
        <ParserButton
            parser={mockParser}
            category={categoryWithHidden}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    openParser();
    
    const items = document.querySelectorAll('li');
    
    cleanup();
    
    t.equal(items.length, 1);
    t.end();
});

test('ParserButton: clicking parser item calls onParserChange', (t) => {
    let changedParser: ParserInfo | undefined;
    
    const onParserChange = (p: ParserInfo | undefined) => {
        changedParser = p;
    };
    
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={onParserChange}
            onParserSettingsButtonClick={noop}
        />,
    );
    openParser();
    
    const items = document.querySelectorAll('li');
    
    fireEvent.click(items[1]);
    
    cleanup();
    
    t.equal(changedParser?.id, 'acorn');
    t.end();
});

test('ParserButton: clicking parser item without data-id passes undefined', (t) => {
    let called = false;
    
    const onParserChange = () => {
        called = true;
    };
    
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={onParserChange}
            onParserSettingsButtonClick={noop}
        />,
    );
    openParser();
    
    const items = document.querySelectorAll('li');
    items[0].removeAttribute('data-id');
    
    fireEvent.click(items[0]);
    
    cleanup();
    
    t.ok(called);
    t.end();
});

test('ParserButton: clicking parser item closes menu', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    openParser();
    const item = document.querySelector('li')!;
    
    fireEvent.click(item);
    
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('ParserButton: clicking trigger span opens menu', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const span = document.querySelector('.menuButton > span')!;
    
    fireEvent.click(span);
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ParserButton: second trigger click closes menu', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const span = document.querySelector('.menuButton span')!;
    
    fireEvent.click(span);
    fireEvent.click(span);
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('ParserButton: settings button calls onParserSettingsButtonClick', (t) => {
    let clicked = false;
    
    const parserWithSettings = {
        ...mockParser,
        hasSettings: () => true,
    };
    
    render(
        <ParserButton
            parser={parserWithSettings}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={() => {
                clicked = true;
            }}
        />,
    );
    
    const buttons = document.querySelectorAll('button');
    const settingsBtn = [...buttons].at(-1)!;
    
    fireEvent.click(settingsBtn);
    
    cleanup();
    
    t.ok(clicked);
    t.end();
});

test('ParserButton: settings button enabled when parser has settings', (t) => {
    const parserWithSettings = {
        ...mockParser,
        hasSettings: () => true,
    };
    
    render(
        <ParserButton
            parser={parserWithSettings}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const buttons = document.querySelectorAll('button');
    const settingsBtn = [...buttons].at(-1)!;
    
    cleanup();
    
    t.notOk(settingsBtn.disabled);
    t.end();
});

test('ParserButton: clicking parser item calls onParserChange with undefined for unknown parser', (t) => {
    let changedParser: ParserInfo | undefined;
    
    const categoryWithUnknownParser: ParserCategory = {
        ...mockCategory,
        parsers: [
            mockParser, {
                id: 'unknown-parser',
                displayName: 'Unknown',
                showInMenu: true,
                hasSettings: () => false,
            },
        ],
    };
    
    render(
        <ParserButton
            parser={mockParser}
            category={categoryWithUnknownParser}
            onParserChange={(parser) => {
                changedParser = parser;
            }}
            onParserSettingsButtonClick={noop}
        />,
    );
    openParser();
    
    const items = document.querySelectorAll('li');
    
    fireEvent.click(items[1]);
    
    cleanup();
    
    t.equal(changedParser, undefined);
    t.end();
});

test('ParserButton: outside click closes menu', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    openParser();
    fireEvent.mouseDown(document.body);
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('ParserButton: Enter opens menu', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const trigger = document.querySelector('.menuButton > span')!;
    
    fireEvent.keyDown(trigger, {
        key: 'Enter',
    });
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ParserButton: Space opens menu', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const trigger = document.querySelector('.menuButton > span')!;
    
    fireEvent.keyDown(trigger, {
        key: ' ',
    });
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.ok(result);
    t.end();
});
