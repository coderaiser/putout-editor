import {test} from 'supertape';
import putoutTransformer from './index.ts';

const transformCode = 'export const report = () => "x";';

const makePutout = () => {
    const used: unknown[] = [];
    
    const putout = (source: string, options: Record<string, unknown>) => {
        used.push(options.parser);
        
        return {
            code: source,
        };
    };
    
    return {
        used,
        putout,
    };
};

// babel is the odd one out: chooseParser wraps it so the parse options are
// adapted, so it arrives at putout as `{parse}` rather than as the module.
const babelModule = {
    parse: (source: string) => `babel parsed ${source}`,
};

// `chooseParser` is private, so it is reached the only way the app reaches it:
// through transform, with each parser name. What is asserted is which parser
// reached putout, which is the whole of chooseParser's job.
const parseWith = (parserName: string) => {
    const {used, putout} = makePutout();
    
    putoutTransformer.transform({
        putout,
        acorn: 'acorn-module',
        babel: babelModule,
        espree: 'espree-module',
        esprima: 'esprima-module',
    }, transformCode, 'const a = 1;', parserName);
    
    return used[0];
};

test('transformer: chooses acorn by name', (t) => {
    const result = parseWith('acorn');
    const expected = 'acorn-module';
    
    t.equal(result, expected);
    t.end();
});

test('transformer: chooses espree by name', (t) => {
    const result = parseWith('espree');
    const expected = 'espree-module';
    
    t.equal(result, expected);
    t.end();
});

test('transformer: chooses esprima by name', (t) => {
    const result = parseWith('esprima');
    const expected = 'esprima-module';
    
    t.equal(result, expected);
    t.end();
});

test('transformer: the babel fallback delegates to the babel module', (t) => {
    const parser = parseWith('something-else') as {
        parse: (source: string) => string;
    };
    
    const result = parser.parse('const a = 1;');
    const expected = 'babel parsed const a = 1;';
    
    t.equal(result, expected);
    t.end();
});
