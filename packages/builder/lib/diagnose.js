import {Buffer} from 'node:buffer';
import {transformSync} from 'oxc-transform-react';

// The compiler counts offsets in bytes of UTF-8, not in characters.
const lineOf = (source, offset) => {
    const before = Buffer
        .from(source)
        .subarray(0, offset);
    
    return before
        .toString()
        .split('\n')
        .length;
};

/**
 * What the compiler says about a file, one string for each finding. A finding
 * is a function that the compiler skips, and the reason why. An empty list
 * means that every component and hook in the file is compiled.
 */
export const diagnose = (path, source) => {
    const {errors} = transformSync(path, source, {
        sourcemap: false,
        reactCompiler: {
            target: '19',
            reportDiagnostics: true,
        },
    });
    
    return errors.map(({message, labels}) => {
        const [{message: detail, start}] = labels;
        
        const text = [message, detail]
            .filter(Boolean)
            .join(': ');
        
        return `${text} (line ${lineOf(source, start)})`;
    });
};
