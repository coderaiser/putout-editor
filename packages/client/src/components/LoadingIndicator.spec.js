import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import LoadingIndicator from './LoadingIndicator.js';

test('LoadingIndicator: not visible: renders nothing', (t) => {
    render(<LoadingIndicator visible={false}/>);
    cleanup();
    
    t.notOk(document.querySelector('.loadingIndicator'));
    t.end();
});

test('LoadingIndicator: visible: renders spinner', (t) => {
    render(<LoadingIndicator visible={true}/>);
    cleanup();
    
    t.ok(document.querySelector('.loadingIndicator'));
    t.end();
});
