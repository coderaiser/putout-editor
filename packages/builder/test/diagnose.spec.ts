import {test} from 'supertape';
import {diagnose} from '../lib/diagnose.js';

const clean = `
export const Counter = ({step}) => <button>{step}</button>;
`;

const refWrite = `import {useRef} from 'react';

export const Box = ({value}) => {
    const ref = useRef(value);
    
    ref.current = value;
    
    return <div/>;
};
`;

test('diagnose: a component that the compiler accepts has no finding', (t) => {
    const result = diagnose('/src/counter.tsx', clean);
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('diagnose: a file without a component has no finding', (t) => {
    const result = diagnose('/src/a.ts', 'export const a: number = 1;');
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('diagnose: a write to a ref in render is a finding with its line', (t) => {
    const result = diagnose('/src/box.tsx', refWrite);
    
    const expected = [
        'Cannot access refs during render: Cannot update ref value during render (line 6)',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('diagnose: the line is right after multibyte characters', (t) => {
    const wide = `// ${'└'.repeat(80)}\n${refWrite}`;
    const result = diagnose('/src/box.tsx', wide);
    
    const expected = [
        'Cannot access refs during render: Cannot update ref value during render (line 7)',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('diagnose: a syntax error is a finding without a detail', (t) => {
    const result = diagnose('/src/broken.js', 'const = ;');
    
    const expected = [
        'Unexpected token (line 1)',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});
