import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import LoadingIndicator from './LoadingIndicator.js';

test('LoadingIndicator: not visible: renders nothing', (t) => {
    render(
        <LoadingIndicator visible={false}/>,
    );
    
    const result = document.querySelector('.loadingIndicator');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('LoadingIndicator: visible: renders spinner', (t) => {
    render(
        <LoadingIndicator visible={true}/>,
    );
    
    const result = document.querySelector('.loadingIndicator');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('LoadingIndicator: visible: renders svg spinner icon', (t) => {
    render(
        <LoadingIndicator visible={true}/>,
    );
    
    const svg = document.querySelector('.loadingIndicator svg');
    
    cleanup();
    
    t.ok(svg);
    t.end();
});
