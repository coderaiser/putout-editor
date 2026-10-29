import {z} from 'zod';

export const name = 'new_rule';

export const description = 'Write a new putout rule with the putout tools, test first.';

export const argsSchema = {
    goal: z
        .string()
        .describe('What the rule must do, for example "replace var with let"'),
};

type Args = {
    goal: string;
};

const workflow = (goal: string) => `Write a putout rule. Goal: ${goal}

Use the putout MCP tools in this order:

1. docs {section: 'template'}: read the pattern grammar.
2. get_example: get a working plugin of the right shape (replacer first).
3. name_pattern on a sample, then test_pattern: find a key, and check what it matches and binds.
4. Write the plugin: export report first, then the action.
5. validate: the answer must be "ok".
6. find_places: on a fixture with the bad code, and on a fixture with nothing to find (no places).
7. transform: check the fixed code.

House rules: no optional chaining, no node.type === 'X' (use types.isX),
one "no report" test per guard, and 100% coverage.`;

export const handler = ({goal}: Args) => ({
    messages: [{
        role: 'user' as const,
        content: {
            type: 'text' as const,
            text: workflow(goal),
        },
    }],
});
