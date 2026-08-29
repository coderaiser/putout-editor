import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import Editor from './Editor.js';

test('Editor: renders .editor container', (t) => {
    const {container} = render(<Editor value="const x = 1"/>);
    const result = container.querySelector('.editor');
    cleanup();
    t.ok(result);
    t.end();
});

test('Editor: renders with default props', (t) => {
    const {container} = render(<Editor/>);
    const result = container.querySelector('.editor');
    cleanup();
    t.ok(result);
    t.end();
});

test('Editor: renders with error prop', (t) => {
    const error = {loc: {line: 1}, message: 'oops'};
    const {container} = render(<Editor error={error}/>);
    const result = container.querySelector('.editor');
    cleanup();
    t.ok(result);
    t.end();
});

test('Editor: renders with highlightRange prop', (t) => {
    const {container} = render(<Editor highlightRange={[0, 5]}/>);
    const result = container.querySelector('.editor');
    cleanup();
    t.ok(result);
    t.end();
});

test('Editor: renders in readOnly mode', (t) => {
    const {container} = render(<Editor readOnly={true} value="x"/>);
    const result = container.querySelector('.editor');
    cleanup();
    t.ok(result);
    t.end();
});

test('Editor: renders with highlight disabled', (t) => {
    const {container} = render(<Editor highlight={false}/>);
    const result = container.querySelector('.editor');
    cleanup();
    t.ok(result);
    t.end();
});
