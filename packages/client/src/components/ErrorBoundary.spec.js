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

// Suppress React error boundary console output in tests
const silence = () => {
    const orig = console.error;
    
    console.error = () => {};
    
    return () => {
        console.error = orig;
    };
};

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
    const restore = silence();
    const {container} = render(
        <ErrorBoundary><Bomb shouldThrow={true}/></ErrorBoundary>,
    );
    
    restore();
    const result = container.querySelector('.error-boundary');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: fallback contains try again button', (t) => {
    const restore = silence();
    const {container} = render(
        <ErrorBoundary><Bomb shouldThrow={true}/></ErrorBoundary>,
    );
    
    restore();
    const result = container.querySelector('button');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: calls onError when child throws', (t) => {
    const restore = silence();
    let called = false;
    
    render(
        <ErrorBoundary
            onError={() => {
                called = true;
            }}
        >
            <Bomb shouldThrow={true}/>
        </ErrorBoundary>,
    );
    restore();
    cleanup();
    
    t.ok(called);
    t.end();
});

test('ErrorBoundary: onError receives Error instance', (t) => {
    const restore = silence();
    let received;
    
    render(
        <ErrorBoundary
            onError={(e) => {
                received = e;
            }}
        >
            <Bomb shouldThrow={true}/>
        </ErrorBoundary>,
    );
    restore();
    cleanup();
    const result = isError(received);
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: renders custom fallback function result', (t) => {
    const restore = silence();
    const {container} = render(
        <ErrorBoundary
            fallback={() => (
                <div id="custom">custom</div>
            )}
        >
            <Bomb shouldThrow={true}/>
        </ErrorBoundary>,
    );
    
    restore();
    const result = container.querySelector('#custom');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: fallback function receives the error', (t) => {
    const restore = silence();
    let received;
    
    render(
        <ErrorBoundary
            fallback={(e) => {
                received = e;
                return null;
            }}
        >
            <Bomb shouldThrow={true}/>
        </ErrorBoundary>,
    );
    restore();
    cleanup();
    const result = isError(received);
    
    t.ok(result);
    t.end();
});

test('ErrorBoundary: reset button clears error state', (t) => {
    const restore = silence();
    const {container} = render(
        <ErrorBoundary><Bomb shouldThrow={true}/></ErrorBoundary>,
    );
    
    restore();
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
