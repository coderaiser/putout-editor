import React from 'react';
import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import LoadingIndicator from './LoadingIndicator.js';

test('LoadingIndicator: not visible: renders nothing', (t) => {
    render(<LoadingIndicator visible={false}/>);
    
    t.notOk(document.querySelector('.loadingIndicator'));
    
    cleanup();
    t.end();
});

test('LoadingIndicator: visible: renders spinner', (t) => {
    render(<LoadingIndicator visible={true}/>);
    
    t.ok(document.querySelector('.loadingIndicator'));
    
    cleanup();
    t.end();
});
