import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import ElementName from './ElementName.js';

const noop = () => {};

test('ElementName: returns nothing when name is falsy', (t) => {
    const {container} = render(
        <ElementName name={null}/>,
    );
    
    const result = container.innerHTML;
    
    cleanup();
    
    t.equal(result, '');
    t.end();
});

test('ElementName: renders name text', (t) => {
    render(
        <ElementName name="id" showToggler={false} onClick={null}/>,
    );
    
    const name = document.querySelector('.name');
    
    cleanup();
    const result = name.textContent.includes('id');
    
    t.ok(result);
    t.end();
});

test('ElementName: renders computed prefix', (t) => {
    render(
        <ElementName name="x" computed={true} showToggler={false} onClick={null}/>,
    );
    
    const computed = document.querySelector('[title="computed"]');
    
    cleanup();
    
    t.ok(computed);
    t.end();
});

test('ElementName: does not render computed span when computed is false', (t) => {
    render(
        <ElementName name="x" computed={false} showToggler={false} onClick={null}/>,
    );
    
    const computed = document.querySelector('[title="computed"]');
    
    cleanup();
    
    t.notOk(computed);
    t.end();
});

test('ElementName: renders colon separator', (t) => {
    render(
        <ElementName name="id" showToggler={false} onClick={null}/>,
    );
    
    const separator = document.querySelector('.p');
    
    cleanup();
    const result = separator.textContent.includes(':');
    
    t.ok(result);
    t.end();
});

test('ElementName: renders name text with toggler and click handler', (t) => {
    render(
        <ElementName name="id" showToggler={true} onClick={noop}/>,
    );
    
    const name = document.querySelector('.name');
    
    cleanup();
    const result = name.textContent.includes('id');
    
    t.ok(result);
    t.end();
});
