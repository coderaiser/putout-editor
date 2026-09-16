import {test} from 'supertape';
import {
    render,
    screen,
    cleanup,
} from '@testing-library/react';
import ShareButton from './ShareButton.tsx';
import type {Revision} from '../../store/reducers.ts';

const noop = () => {};

const makeRevision = (overrides: Partial<Revision> = {}): Revision => ({
    canSave: () => true,
    getSnippetID: () => 'snippet-id',
    getRevisionID: () => 'revision-id',
    getTransformerID: () => null,
    getTransformCode: () => '',
    getParserID: () => 'babel',
    getCode: () => 'const x = 1',
    getParserSettings: () => null,
    getPath: () => '/gist/snippet-id/revision-id',
    getShareData: () => ({
        versionedURL: 'https://example.com/v1',
        latestURL: null,
        embedURL: null,
    }),
    ...overrides,
});

test('ShareButton: no snippet: disabled', (t) => {
    render(
        <ShareButton snippet={null}/>,
    );
    
    const button = screen.getByRole('button');
    
    cleanup();
    
    t.ok(button.hasAttribute('disabled'));
    t.end();
});

test('ShareButton: snippet present: enabled', (t) => {
    render(
        <ShareButton snippet={makeRevision()}/>,
    );
    
    const button = screen.getByRole('button');
    
    cleanup();
    
    t.notOk(button.hasAttribute('disabled'));
    t.end();
});

test('ShareButton: renders button with text', (t) => {
    render(
        <ShareButton snippet={makeRevision()}/>,
    );
    
    const button = screen.getByRole('button');
    const text = button.textContent;
    
    cleanup();
    
    t.ok(text.includes('Share'));
    t.end();
});

test('ShareButton: renders share svg icon', (t) => {
    render(
        <ShareButton snippet={makeRevision()}/>,
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
            snippet={makeRevision()}
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
            snippet={makeRevision()}
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
            snippet={makeRevision()}
        />,
    );
    screen
        .getByRole('button')
        .click();
    
    cleanup();
    
    t.ok(shareButtonClicked);
    t.end();
});
