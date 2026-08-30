import {test} from 'supertape';
import {render, cleanup, act, fireEvent} from '@testing-library/react';
import SettingsDialog from './SettingsDialog.js';

const makeParser = (hasSettings = true) => ({
    displayName: 'Babel',
    hasSettings: () => hasSettings,
    renderSettings: (settings, onChange) => (
        <input
            id="setting"
            readOnly
            value={JSON.stringify(settings || {})}
        />
    ),
});

const makeProps = (overrides = {}) => ({
    visible: true,
    parser: makeParser(),
    parserSettings: {},
    onSave: () => {},
    onWantToClose: () => {},
    ...overrides,
});

test('SettingsDialog: returns null when not visible', (t) => {
    const {container} = render(<SettingsDialog {...makeProps({visible: false})}/>);
    const result = container.querySelector('#SettingsDialog');
    cleanup();
    t.notOk(result);
    t.end();
});

test('SettingsDialog: returns null when parser has no renderSettings', (t) => {
    const parser = {...makeParser(), renderSettings: null};
    const {container} = render(<SettingsDialog {...makeProps({parser})}/>);
    const result = container.querySelector('#SettingsDialog');
    cleanup();
    t.notOk(result);
    t.end();
});

test('SettingsDialog: renders when visible', (t) => {
    const {container} = render(<SettingsDialog {...makeProps()}/>);
    const result = container.querySelector('#SettingsDialog');
    cleanup();
    t.ok(result);
    t.end();
});

test('SettingsDialog: renders parser displayName in header', (t) => {
    const {container} = render(<SettingsDialog {...makeProps()}/>);
    const result = container.querySelector('h3').textContent;
    cleanup();
    t.ok(result.includes('Babel'));
    t.end();
});

test('SettingsDialog: renders reset button', (t) => {
    const {container} = render(<SettingsDialog {...makeProps()}/>);
    const buttons = container.querySelectorAll('button');
    cleanup();
    t.ok(buttons[0].textContent.includes('Reset'));
    t.end();
});

test('SettingsDialog: renders close button', (t) => {
    const {container} = render(<SettingsDialog {...makeProps()}/>);
    const buttons = container.querySelectorAll('button');
    cleanup();
    t.ok(buttons[1].textContent.includes('Close'));
    t.end();
});

test('SettingsDialog: close button calls onSave and onWantToClose', (t) => {
    let saved = false;
    let closed = false;
    const {container} = render(
        <SettingsDialog {...makeProps({
            onSave: () => { saved = true; },
            onWantToClose: () => { closed = true; },
        })}/>,
    );
    fireEvent.click(container.querySelectorAll('button')[1]);
    cleanup();
    t.ok(saved && closed);
    t.end();
});

test('SettingsDialog: reset button clears parserSettings', (t) => {
    let savedSettings = null;
    const {container} = render(
        <SettingsDialog {...makeProps({
            parserSettings: {a: 1},
            onSave: (parser, settings) => { savedSettings = settings; },
        })}/>,
    );
    fireEvent.click(container.querySelectorAll('button')[0]); // reset
    fireEvent.click(container.querySelectorAll('button')[1]); // close
    cleanup();
    t.deepEqual(savedSettings, {});
    t.end();
});

test('SettingsDialog: UNSAFE_componentWillReceiveProps syncs new parserSettings', async (t) => {
    const {container, rerender} = render(
        <SettingsDialog {...makeProps({parserSettings: {a: 1}})}/>,
    );
    await act(async () => {
        rerender(<SettingsDialog {...makeProps({parserSettings: {b: 2}})}/>);
    });
    const result = container.querySelector('#setting').value;
    cleanup();
    t.equal(result, '{"b":2}');
    t.end();
});

test('SettingsDialog: outer click on backdrop calls onWantToClose', (t) => {
    let closed = false;
    const {container} = render(
        <SettingsDialog {...makeProps({onWantToClose: () => { closed = true; }})}/>,
    );
    // Click the backdrop element itself (not the inner dialog)
    fireEvent.click(container.querySelector('#SettingsDialog'));
    cleanup();
    t.ok(closed);
    t.end();
});

test('SettingsDialog: inner click does not call onWantToClose', (t) => {
    let closed = false;
    const {container} = render(
        <SettingsDialog {...makeProps({onWantToClose: () => { closed = true; }})}/>,
    );
    fireEvent.click(container.querySelector('.inner'));
    cleanup();
    t.notOk(closed);
    t.end();
});

test('SettingsDialog: onChange updates parserSettings saved on close', (t) => {
    let savedSettings = null;
    const renderSettings = (settings, onChange) => (
        <button id="apply" onClick={() => onChange({x: 2})}>Apply</button>
    );
    const parser = makeParser();
    parser.renderSettings = renderSettings;
    
    const {container} = render(
        <SettingsDialog {...makeProps({
            parser,
            onSave: (parser, settings) => { savedSettings = settings; },
        })}/>,
    );
    fireEvent.click(container.querySelector('#apply'));
    fireEvent.click([...container.querySelectorAll('button')].at(-1)); // close
    cleanup();
    t.deepEqual(savedSettings, {x: 2});
    t.end();
});