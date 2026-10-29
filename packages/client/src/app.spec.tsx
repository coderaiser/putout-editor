import {setImmediate} from 'node:timers/promises';
import {test} from 'supertape';

/*
 * Import the entry point: nothing else imports it. The module calls `createRoot`
 * on load, so make the container first. All specs share one process: the
 * teardown removes the app and `onhashchange` for the specs after this one.
 */
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
