import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import ErrorBlock from './ErrorBlock.tsx';

const error = (message: string) => render(
    <ErrorBlock
        message={message}
    />,
);

test('ErrorBlock: carries the error-block class the e2e gate looks for', (t) => {
    error('boom');
    
    const result = document.querySelector('.error-block') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('ErrorBlock: shows the message', (t) => {
    error('No source. Use /source first.');
    
    const element = document.querySelector('[data-testid="error-block"]');
    const result = element && element.textContent;
    const expected = 'No source. Use /source first.';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
