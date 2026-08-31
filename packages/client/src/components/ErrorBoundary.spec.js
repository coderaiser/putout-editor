import {test} from 'supertape';
import {ErrorBoundary} from 'react-error-boundary';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';

const noop = () => {};

const isError = (a) => a instanceof Error;

const Bomb = ({shouldThrow}) => {
    if (shouldThrow)
        throw Error('test error');
    
    return (
        <div id="safe">safe</div>
    );
};

const renderFallback = ({error}) => (
    <div className="error-boundary">
        <p>{error.message}</p>
    </div>
);

const renderWithBomb = (ui) => render(ui, {
    onCaughtError: noop,
});

test('ErrorBoundary: renders children normally', (t) => {
    const {container} = render(
        <ErrorBoundary fallbackRender={renderFallback}>
            <div id="child">ok</div>
        </ErrorBoundary>,
    );
    
    const result = container.querySelector('#child');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: renders fallback UI on error', (t) => {
    const {container} = renderWithBomb(
        <ErrorBoundary fallbackRender={renderFallback}>
            <Bomb shouldThrow={true}/>
        </ErrorBoundary>,
    );
    
    const result = container.querySelector('.error-boundary');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: fallback renders error message', (t) => {
    const {container} = renderWithBomb(
        <ErrorBoundary fallbackRender={renderFallback}>
            <Bomb shouldThrow={true}/>
        </ErrorBoundary>,
    );
    
    const result = container.querySelector('.error-boundary p').textContent;
    
    cleanup();
    
    t.equal(result, 'test error');
    t.end();
});

test('ErrorBoundary: calls onError when child throws', (t) => {
    let called = false;
    
    renderWithBomb(
        <ErrorBoundary
            fallbackRender={renderFallback}
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
            fallbackRender={renderFallback}
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
            fallbackRender={() => (
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

test('ErrorBoundary: fallbackRender receives the error', (t) => {
    let received;
    
    renderWithBomb(
        <ErrorBoundary
            fallbackRender={({error}) => {
                received = error;
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

test('ErrorBoundary: resetErrorBoundary renders children again', (t) => {
    let shouldThrow = true;
    
    const BombOnce = () => {
        if (shouldThrow)
            throw Error('test error');
        
        return (
            <div id="safe">safe</div>
        );
    };
    
    const {container} = renderWithBomb(
        <ErrorBoundary
            fallbackRender={({resetErrorBoundary}) => (
                <button onClick={resetErrorBoundary}>Try again</button>
            )}
        >
            <BombOnce/>
        </ErrorBoundary>,
    );
    
    shouldThrow = false;
    fireEvent.click(container.querySelector('button'));
    const result = container.querySelector('#safe');
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: does not call onError without error', (t) => {
    let called = false;
    
    render(
        <ErrorBoundary
            fallbackRender={renderFallback}
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
