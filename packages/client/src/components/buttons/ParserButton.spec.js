import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import ParserButton from './ParserButton.js';

const mockParser = {
    id: 'babel',
    displayName: 'Babel',
    showInMenu: true,
    hasSettings: () => false,
};

const mockCategory = {
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
    const result = spanText.textContent.includes('Babel');
    
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
    const settingsBtn = [...buttons].at(-1);
    
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
    
    const items = document.querySelectorAll('li');
    
    cleanup();
    
    t.equal(items.length, 2);
    t.end();
});

test('ParserButton: only parsers with showInMenu are rendered', (t) => {
    const categoryWithHidden = {
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
    
    const items = document.querySelectorAll('li');
    
    cleanup();
    
    t.equal(items.length, 1);
    t.end();
});

test('ParserButton: clicking parser item calls onParserChange', (t) => {
    let changedParser;
    
    const onParserChange = (p) => {
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
    
    const items = document.querySelectorAll('li');
    
    fireEvent.click(items[1]);
    
    cleanup();
    
    t.equal(changedParser.id, 'acorn');
    t.end();
});

test('ParserButton: clicking parser item sets is-closed class', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const div = document.querySelector('.menuButton');
    const item = document.querySelector('li');
    
    fireEvent.click(item);
    
    const result = div.className.includes('is-closed');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ParserButton: clicking trigger span sets is-closed class', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const span = document.querySelector('.menuButton span');
    const div = document.querySelector('.menuButton');
    
    fireEvent.click(span);
    
    const result = div.className.includes('is-closed');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ParserButton: mouseleave clears is-closed class', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const span = document.querySelector('.menuButton span');
    const div = document.querySelector('.menuButton');
    
    fireEvent.click(span);
    fireEvent.mouseLeave(div);
    
    const result = div.className.includes('is-closed');
    
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
    const settingsBtn = [...buttons].at(-1);
    
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
    const settingsBtn = [...buttons].at(-1);
    
    cleanup();
    
    t.notOk(settingsBtn.disabled);
    t.end();
});
