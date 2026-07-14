import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import LoadingIndicator from './LoadingIndicator.js';

test('LoadingIndicator: not visible: renders nothing', (t) => {
    render(<LoadingIndicator visible={false}/>);
    cleanup();
    const result = document.querySelector('.loadingIndicator');
    
    t.notOk(result);
    t.end();
});

test('LoadingIndicator: visible: renders spinner', (t) => {
    render(<LoadingIndicator visible={true}/>);
    cleanup();
    const result = document.querySelector('.loadingIndicator');
    
    t.ok(result);
    t.end();
});
