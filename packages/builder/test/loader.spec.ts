import {test, stub} from 'supertape';
import loader from '../lib/loader.js';

const component = `
import {useState} from 'react';

export const Counter = ({step}) => {
    const [count, setCount] = useState(0);
    
    return <button onClick={() => setCount(count + step)}>{count}</button>;
};
`;

const run = (source: string, resourcePath: string) => {
    const callback = stub();
    
    loader.call({
        resourcePath,
        callback,
    }, source);
    
    return callback;
};

test('loader: memoizes component', (t) => {
    const callback = run(component, '/src/counter.jsx');
    const [, code] = callback.args[0];
    
    t.match(code, 'compiler-runtime');
    t.end();
});

test('loader: strips types of typescript file', (t) => {
    const callback = run('export const a: number = 1;', '/src/a.ts');
    const [, code] = callback.args[0];
    
    t.notMatch(code, ': number');
    t.end();
});

test('loader: passes source map', (t) => {
    const callback = run(component, '/src/counter.jsx');
    const [, , map] = callback.args[0];
    
    t.equal(map.version, 3);
    t.end();
});

test('loader: passes error when source cannot be parsed', (t) => {
    const callback = run('const = ;', '/src/broken.js');
    const [{message}] = callback.args[0];
    
    t.equal(message, 'Unexpected token');
    t.end();
});
