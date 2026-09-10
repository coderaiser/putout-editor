import {tryToCatch} from 'try-to-catch';
import {request} from '../client.ts';

export const name = 'docs';

export const description =
    'Fetch the full putout-editor reference: API docs, plugin patterns ' +
    '(replace/traverse/include), template variable syntax (__x, __args), ' +
    'and error recovery guide. Call this at the start of a rule-writing session.';

export const schema = {};

export async function handler() {
    const [error, text] = await tryToCatch(request, '/llms-full.txt', {
        responseType: 'text',
    });
    
    if (error)
        return {
            content: [{
                type: 'text' as const,
                text: `Error: ${error.message}`,
            }],
        };
    
    return {
        content: [{
            type: 'text' as const,
            text: text as string,
        }],
    };
}
