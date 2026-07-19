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
    const settingsBtn = buttons[buttons.length - 1];
    
    cleanup();
    
    t.ok(settingsBtn.disabled);
    t.end();
});

test('ParserButton: clicking span toggles menu open', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const span = document.querySelector('.menuButton span');
    
    fireEvent.click(span);
    
    const items = document.querySelectorAll('li');
    
    cleanup();
    
    t.equal(items.length, 2);
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
    
    const span = document.querySelector('.menuButton span');
    
    fireEvent.click(span);
    
    const items = document.querySelectorAll('li');
    
    fireEvent.click(items[1]);
    
    cleanup();
    
    t.equal(changedParser.id, 'acorn');
    t.end();
});

test('ParserButton: clicking parser item closes menu', (t) => {
    const onParserChange = () => {};
    
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={onParserChange}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const span = document.querySelector('.menuButton span');
    
    fireEvent.click(span);
    fireEvent.click(document.querySelector('li'));
    
    const itemsAfter = document.querySelectorAll('li');
    
    cleanup();
    
    t.equal(itemsAfter.length, 0);
    t.end();
});

test('ParserButton: outside click closes the menu', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const span = document.querySelector('.menuButton span');
    
    fireEvent.click(span);
    
    const div = document.querySelector('.menuButton');
    
    fireEvent.click(document.body);
    const result = div.className.includes('is-open');
    
    t.notOk(result);
    t.end();
});

test('ParserButton: has is-open class when menu is open', (t) => {
    render(
        <ParserButton
            parser={mockParser}
            category={mockCategory}
            onParserChange={noop}
            onParserSettingsButtonClick={noop}
        />,
    );
    
    const span = document.querySelector('.menuButton span');
    
    fireEvent.click(span);
    
    const div = document.querySelector('.menuButton');
    
    cleanup();
    const result = div.className.includes('is-open');
    
    t.ok(result);
    t.end();
});
