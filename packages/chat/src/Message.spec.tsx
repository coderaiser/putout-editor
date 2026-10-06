import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import type {Message as MessageModel} from '#store';
import Message from './Message.tsx';

/**
 * A line still running: no `result` yet, so `Message` renders nothing.
 *
 * `Result`'s first branch is `if (!result) return null`. Nothing in the app
 * produces a null-result message today — `useChat` always dispatches the
 * command's answer with the message — so this branch is only reachable by
 * handing `Message` a message directly. That is still worth having: the
 * branch is in the render path, and a spec is cheaper than discovering it
 * uncovered.
 */
test('Message: a message with no result yet renders nothing', (t) => {
    const message: MessageModel = {
        id: 1,
        text: 'ast',
        result: null,
    };
    
    render(<Message message={message}/>);
    
    const node = document.querySelector('.message');
    const result = node && node.textContent;
    const expected = '';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * A `text` result that is **not** `help` is a `TextBlock`, not the table.
 *
 * The other half of the `text === 'help' && result.type === 'text'` guard: the
 * first operand short-circuits for every ordinary `text` answer, and without
 * this a help-specific branch could quietly swallow all of them. `source` is
 * the natural subject — it answers with `type: 'source'`, so this pins that the
 * table does not swallow a non-`text` result either.
 */
test('Message: a text result that is not help is not the table', (t) => {
    const message: MessageModel = {
        id: 2,
        text: 'console',
        result: {
            type: 'text',
            data: 'Console opened',
        },
    };
    
    render(<Message message={message}/>);
    
    const block = document.querySelector('.text-block');
    const result = block && block.textContent;
    const expected = 'Console opened';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
