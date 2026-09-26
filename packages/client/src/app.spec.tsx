import {setImmediate} from 'node:timers/promises';
import {test} from 'supertape';

// The entry point is the one module in src that nothing else imports, which is
// how it stayed out of coverage. Importing it here is the test: the container
// has to exist first, because the module calls createRoot on it at load.
//
// tape runs every spec in one process, so this test gets the real App tree and
// the real global handlers. Without the teardown below it leaks both into the
// specs that follow - a mounted app means "multiple elements with the role
// button" for every later DOM spec, and a live onhashchange means a later spec
// that touches location.hash triggers a real snippet load.
test('app: mounts into the container', async (t) => {
    const previousHashChange = globalThis.onhashchange;
    const previousBeforeUnload = globalThis.onbeforeunload;
    const container = document.createElement('div');
    
    container.id = 'container';
    document.body.append(container);
    
    await import('./app.tsx');
    
    await setImmediate();
    
    const result = container.childElementCount;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
    
    container.remove();
    globalThis.onhashchange = previousHashChange;
    globalThis.onbeforeunload = previousBeforeUnload;
});
