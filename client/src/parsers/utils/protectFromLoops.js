import halts, {loopProtect} from 'halting-problem';

const TIMEOUT = 10 * 1000;

export default function protect(jsCode) {
    // assert that there are no obvious infinite loops
    halts(jsCode);
    // guard against non-obvious loops with a timeout of 5 seconds
    const start = Date.now();
    
    jsCode = loopProtect(jsCode, [
        // this function gets called in all possible loops
        // it gets passed the line number as its only argument
        '(function (line) {',
        'if (Date.now() > ' + (start + TIMEOUT) + ') {',
        '  throw new Error("Infinite loop detected on line " + line);',
        '}',
        '})',
    ].join(''));
    
    return jsCode;
}

