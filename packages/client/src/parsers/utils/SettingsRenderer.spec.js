import {test, stub} from 'supertape';
import {render, cleanup, fireEvent} from '@testing-library/react';
import SettingsRenderer from './SettingsRenderer.js';

test('SettingsRenderer: renders checkbox for string field', (t) => {
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: ['option1'],
            }}
            parserSettings={{}}
            onChange={stub()}
        />,
    );
    
    const checkbox = document.querySelector('input[type="checkbox"]');
    
    cleanup();
    
    t.ok(checkbox);
    t.end();
});

test('SettingsRenderer: renders checkbox checked when value is true', (t) => {
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: ['option1'],
            }}
            parserSettings={{option1: true}}
            onChange={stub()}
        />,
    );
    
    const checkbox = document.querySelector('input[type="checkbox"]');
    
    cleanup();
    
    t.ok(checkbox.checked);
    t.end();
});

test('SettingsRenderer: checkbox disabled when field is required', (t) => {
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: ['option1'],
                required: new Set(['option1']),
            }}
            parserSettings={{option1: true}}
            onChange={stub()}
        />,
    );
    
    const checkbox = document.querySelector('input[type="checkbox"]');
    
    cleanup();
    
    t.ok(checkbox.disabled);
    t.end();
});

test('SettingsRenderer: renders title when provided', (t) => {
    render(
        <SettingsRenderer
            settingsConfiguration={{
                title: 'My Title',
                fields: [],
            }}
            parserSettings={{}}
            onChange={stub()}
        />,
    );
    
    const title = document.querySelector('h4');
    
    cleanup();
    
    t.equal(title.textContent, 'My Title');
    t.end();
});

test('SettingsRenderer: renders select for array field', (t) => {
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: [
                    ['mode', ['es', 'js']],
                ],
            }}
            parserSettings={{mode: 'es'}}
            onChange={stub()}
        />,
    );
    
    const select = document.querySelector('select');
    
    cleanup();
    
    t.ok(select);
    t.end();
});

test('SettingsRenderer: renders nested settings for object field', (t) => {
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: [
                    {
                        key: 'nested',
                        fields: ['opt1'],
                        settings: (settings) => settings.nested,
                    },
                ],
            }}
            parserSettings={{
                nested: {
                    opt1: true,
                },
            }}
            onChange={stub()}
        />,
    );
    
    const checkbox = document.querySelector('input[type="checkbox"]');
    
    cleanup();
    
    t.ok(checkbox);
    t.end();
});

test('SettingsRenderer: onChange called when checkbox toggled', (t) => {
    const onChange = stub();
    
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: ['option1'],
            }}
            parserSettings={{option1: false}}
            onChange={onChange}
        />,
    );
    
    const checkbox = document.querySelector('input[type="checkbox"]');
    
    fireEvent.click(checkbox);
    
    cleanup();
    
    t.calledOnce(onChange);
    t.end();
});

test('SettingsRenderer: renders values from map options', (t) => {
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: [
                    ['mode', {
                        'ECMAScript': 'es',
                        'JavaScript': 'js',
                    }],
                ],
            }}
            parserSettings={{mode: 'es'}}
            onChange={stub()}
        />,
    );
    
    const select = document.querySelector('select');
    
    cleanup();
    
    t.ok(select);
    t.end();
});

test('SettingsRenderer: select onChange calls update with converter', (t) => {
    const onChange = stub();
    
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: [
                    ['ecmaVersion', [3, 5, 6], Number],
                ],
            }}
            parserSettings={{ecmaVersion: 6}}
            onChange={onChange}
        />,
    );
    
    const select = document.querySelector('select');
    
    fireEvent.change(select, {target: {value: '5'}});
    
    cleanup();
    
    t.calledWith(onChange, [{ecmaVersion: 5}]);
    t.end();
});

test('SettingsRenderer: onChange with nested object updates parent settings', (t) => {
    const onChange = stub();
    
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: [
                    {
                        key: 'plugins',
                        title: 'Plugins',
                        fields: ['jsx', 'typescript'],
                        settings: (settings) => settings.plugins || {},
                    },
                ],
            }}
            parserSettings={{}}
            onChange={onChange}
        />,
    );
    
    const checkbox = document.querySelector('input[type="checkbox"]');
    
    fireEvent.click(checkbox);
    
    cleanup();
    
    t.calledOnce(onChange);
    t.end();
});

test('SettingsRenderer: array parserSettings uses valuesFromArray', (t) => {
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: ['jsx', 'typescript'],
            }}
            parserSettings={['jsx']}
            onChange={stub()}
        />,
    );
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    cleanup();
    
    t.equal(checkboxes.length, 2);
    t.end();
});

test('SettingsRenderer: array update strategy add value', (t) => {
    const onChange = stub();
    
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: ['jsx'],
            }}
            parserSettings={[]}
            onChange={onChange}
        />,
    );
    
    const checkbox = document.querySelector('input[type="checkbox"]');
    
    fireEvent.click(checkbox);
    
    cleanup();
    
    t.calledOnce(onChange);
    t.end();
});

test('SettingsRenderer: array updater removes value on unchecked', (t) => {
    const onChange = stub();
    
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: ['jsx', 'typescript'],
            }}
            parserSettings={['jsx', 'typescript']}
            onChange={onChange}
        />,
    );
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    fireEvent.click(checkboxes[0]);
    
    cleanup();
    
    t.calledOnce(onChange);
    t.end();
});

test('SettingsRenderer: select with default identity converter', (t) => {
    const onChange = stub();
    
    render(
        <SettingsRenderer
            settingsConfiguration={{
                fields: [
                    ['mode', ['es', 'js']],
                ],
            }}
            parserSettings={{mode: 'es'}}
            onChange={onChange}
        />,
    );
    
    const select = document.querySelector('select');
    
    fireEvent.change(select, {target: {value: 'js'}});
    
    cleanup();
    
    t.calledWith(onChange, [{mode: 'js'}]);
    t.end();
});
