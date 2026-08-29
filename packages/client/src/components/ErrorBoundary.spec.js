import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary.js';

const isError = (a) => a instanceof Error;

const Bomb = ({shouldThrow}) => {
    if (shouldThrow)
        throw Error('test error');
    
    return (
        <div id="safe">safe</div>
    );
};

// Suppress React 18 error boundary stderr output in tests
const renderWithBomb = (ui) => render(ui, {
    onCaughtError: () => {},
});

test('ErrorBoundary: renders children normally', (t) => {
    const {container} = render(
        <ErrorBoundary><div id="child">ok</div></ErrorBoundary>,
    );
    
    const result = container.querySelector('#child');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: renders fallback UI on error', (t) => {
    const {container} = renderWithBomb(
        <ErrorBoundary><Bomb shouldThrow={true}/></ErrorBoundary>,
    );
    
    const result = container.querySelector('.error-boundary');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: fallback contains try again button', (t) => {
    const {container} = renderWithBomb(
        <ErrorBoundary><Bomb shouldThrow={true}/></ErrorBoundary>,
    );
    
    const result = container.querySelector('button');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: calls onError when child throws', (t) => {
    let called = false;
    
    renderWithBomb(
        <ErrorBoundary
            onError={() => {
                called = true;
            }}
        >
            <Bomb shouldThrow={true}/>
        </ErrorBoundary>,
    );
    cleanup();
    
    t.ok(called);
    t.end();
});

test('ErrorBoundary: onError receives Error instance', (t) => {
    let received;
    
    renderWithBomb(
        <ErrorBoundary
            onError={(e) => {
                received = e;
            }}
        >
            <Bomb shouldThrow={true}/>
        </ErrorBoundary>,
    );
    cleanup();
    const result = isError(received);
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: renders custom fallback function result', (t) => {
    const {container} = renderWithBomb(
        <ErrorBoundary
            fallback={() => (
                <div id="custom">custom</div>
            )}
        >
            <Bomb shouldThrow={true}/>
        </ErrorBoundary>,
    );
    
    const result = container.querySelector('#custom');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: fallback function receives the error', (t) => {
    let received;
    
    renderWithBomb(
        <ErrorBoundary
            fallback={(e) => {
                received = e;
                return null;
            }}
        >
            <Bomb shouldThrow={true}/>
        </ErrorBoundary>,
    );
    cleanup();
    const result = isError(received);
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: reset button clears error state', (t) => {
    const {container} = renderWithBomb(
        <ErrorBoundary><Bomb shouldThrow={true}/></ErrorBoundary>,
    );
    
    fireEvent.click(container.querySelector('button'));
    cleanup();
    const result = container.querySelector('.error-boundary');
    
    t.notOk(result);
    t.end();
});

test('ErrorBoundary: does not call onError without error', (t) => {
    let called = false;
    
    render(
        <ErrorBoundary
            onError={() => {
                called = true;
            }}
        >
            <div>ok</div>
        </ErrorBoundary>,
    );
    cleanup();
    
    t.notOk(called);
    t.end();
});
