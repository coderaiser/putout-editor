import {test} from 'supertape';
import {
    templates,
    categories,
    replacer,
    traverser,
    includer,
    fixer,
    checker,
    watcher,
    lister,
    ignorer,
    declarer,
    equaler,
    deleter,
    duplicater,
    counter,
    typer,
    finder,
} from './index.ts';

const all = {
    replacer,
    traverser,
    includer,
    fixer,
    checker,
    watcher,
    lister,
    ignorer,
    declarer,
    equaler,
    deleter,
    duplicater,
    counter,
    typer,
    finder,
};

test('snippet: templates: categories has 15 entries', (t) => {
    t.equal(categories.length, 15);
    t.end();
});

test('snippet: templates: templates map has 15 entries', (t) => {
    t.equal(Object.keys(templates).length, 15);
    t.end();
});

for (const [name, template] of Object.entries(all)) {
    test(`snippet: templates: ${name}: starts with montag comment line`, (t) => {
        const [first] = template.split('\n');
        
        t.ok(first.startsWith('// '), first);
        t.end();
    });
    
    test(`snippet: templates: ${name}: second line is blank`, (t) => {
        const [, second] = template.split('\n');
        
        t.equal(second, '');
        t.end();
    });
}
