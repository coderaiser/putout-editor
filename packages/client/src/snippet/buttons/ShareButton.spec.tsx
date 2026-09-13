// @ts-nocheck
import {test} from 'supertape';
import {
    render,
    screen,
    cleanup,
} from '@testing-library/react';
import ShareButton from './ShareButton.tsx';

const noop = () => {};

test('ShareButton: no snippet: disabled', (t) => {
    render(
        <ShareButton snippet={null}/>,
    );
    
    const {disabled} = screen.getByRole('button');
    
    cleanup();
    
    t.ok(disabled);
    t.end();
});

test('ShareButton: snippet present: enabled', (t) => {
    render(
        <ShareButton snippet={{}}/>,
    );
    
    const {disabled} = screen.getByRole('button');
    
    cleanup();
    
    t.notOk(disabled);
    t.end();
});

test('ShareButton: renders button with text', (t) => {
    render(
        <ShareButton snippet={{}}/>,
    );
    
    const button = screen.getByRole('button');
    const text = button.textContent;
    
    cleanup();
    
    t.ok(text.includes('Share'));
    t.end();
});

test('ShareButton: renders share svg icon', (t) => {
    render(
        <ShareButton snippet={{}}/>,
    );
    
    const svg = document.querySelector('button svg');
    
    cleanup();
    
    t.ok(svg, 'share icon svg rendered');
    t.end();
});

test('ShareButton: click calls onClick handler when provided', (t) => {
    let clicked = false;
    
    render(
        <ShareButton
            onShareButtonClick={() => {
                clicked = true;
            }}
            snippet={{}}
        />,
    );
    screen
        .getByRole('button')
        .click();
    
    cleanup();
    
    t.ok(clicked);
    t.end();
});

test('ShareButton: click calls onShare when onShareButtonClick not provided', (t) => {
    let called = false;
    
    render(
        <ShareButton
            onShare={() => {
                called = true;
            }}
            snippet={{}}
        />,
    );
    screen
        .getByRole('button')
        .click();
    
    cleanup();
    
    t.ok(called);
    t.end();
});

test('ShareButton: onShareButtonClick takes precedence over onShare', (t) => {
    let shareButtonClicked = false;
    
    render(
        <ShareButton
            onShareButtonClick={() => {
                shareButtonClicked = true;
            }}
            onShare={noop}
            snippet={{}}
        />,
    );
    screen
        .getByRole('button')
        .click();
    
    cleanup();
    
    t.ok(shareButtonClicked);
    t.end();
});
